import BankingSystem from './BankingSystem.js';
import Customer from './Customer.js';
import Account from './Account.js';
import SavingsAccount from './SavingsAccount.js';
import CheckingAccount from './CheckingAccount.js';
import CreditCard from './CreditCard.js';

const SCHEMA_VERSION = 1;
const DEFAULT_KEY = 'miplata-gold-demo-v1';

export default class LocalBankStorage {
  constructor(storage = globalThis.localStorage, key = DEFAULT_KEY) {
    this.storage = storage;
    this.key = key;
  }

  async save(bank, productSequence = 1) {
    if (!this.storage) throw new Error('This browser does not provide local storage.');
    const customers = await Promise.all(bank.getCustomers().map(async customer => ({
      identification: customer.identification,
      fullName: customer.fullName,
      phone: customer.phone,
      username: customer.username,
      role: customer.role,
      permissions: [...customer.permissions],
      passwordRecord: await customer.getPasswordRecord(),
      failedAttempts: customer.getFailedAttempts(),
      isLocked: customer.isLocked(),
      products: customer.getProducts().map(product => {
        const serialized = {
          productNumber: product.productNumber,
          history: product.getHistory().map(transaction => ({
            ...transaction,
            dateTime: transaction.dateTime.toISOString()
          }))
        };

        if (product instanceof SavingsAccount) {
          return { ...serialized, type: 'savings', balance: product.getBalance() };
        }
        if (product instanceof CheckingAccount) {
          return { ...serialized, type: 'checking', balance: product.getBalance() };
        }
        if (product instanceof CreditCard) {
          return {
            ...serialized,
            type: 'credit-card',
            creditLimit: product.creditLimit,
            currentDebt: product.currentDebt
          };
        }
        throw new Error(`Unsupported product type: ${product.constructor.name}`);
      })
    })));

    const snapshot = {
      schemaVersion: SCHEMA_VERSION,
      productSequence,
      customers
    };
    this.storage.setItem(this.key, JSON.stringify(snapshot));
  }

  async restore(bank = new BankingSystem()) {
    if (!this.storage) throw new Error('This browser does not provide local storage.');
    const raw = this.storage.getItem(this.key);
    if (raw === null) return { bank, productSequence: 1, restored: false };

    let snapshot;
    try {
      snapshot = JSON.parse(raw);
    } catch {
      throw new Error('Saved demo data is damaged. Clear local demo data to start over.');
    }
    if (snapshot?.schemaVersion !== SCHEMA_VERSION || !Array.isArray(snapshot.customers)) {
      throw new Error('Saved demo data uses an unsupported format. Clear local demo data to start over.');
    }

    const restoredCustomers = snapshot.customers.map(record => {
      const customer = new Customer(
        record.identification,
        record.fullName,
        record.phone,
        record.username,
        '',
        record.role ?? 'customer',
        record.permissions
      );
      customer.restorePasswordRecord(record.passwordRecord);
      customer.restoreSecurityState(record.failedAttempts, record.isLocked);

      if (!Array.isArray(record.products)) throw new Error('Saved customer products are invalid.');
      for (const storedProduct of record.products) {
        let product;
        if (storedProduct.type === 'savings') {
          product = new SavingsAccount(storedProduct.productNumber, storedProduct.balance);
        } else if (storedProduct.type === 'checking') {
          product = new CheckingAccount(storedProduct.productNumber, storedProduct.balance);
        } else if (storedProduct.type === 'credit-card') {
          product = new CreditCard(storedProduct.productNumber, storedProduct.creditLimit);
          if (!Number.isFinite(storedProduct.currentDebt) || storedProduct.currentDebt < 0 || storedProduct.currentDebt > product.creditLimit) {
            throw new Error('Saved card debt is invalid.');
          }
          product.currentDebt = storedProduct.currentDebt;
        } else {
          throw new Error('Saved product type is not supported.');
        }
        if (!(product instanceof Account) && !(product instanceof CreditCard)) {
          throw new Error('Saved product could not be restored.');
        }
        product.restoreHistory(storedProduct.history);
        customer.addProduct(product);
      }
      return customer;
    });

    for (const customer of restoredCustomers) bank.registerCustomer(customer, { allowAdministratorRestore: true });
    return {
      bank,
      productSequence: Number.isInteger(snapshot.productSequence) && snapshot.productSequence > 0
        ? snapshot.productSequence
        : restoredCustomers.length + 1,
      restored: true
    };
  }

  clear() {
    if (!this.storage) throw new Error('This browser does not provide local storage.');
    this.storage.removeItem(this.key);
  }
}