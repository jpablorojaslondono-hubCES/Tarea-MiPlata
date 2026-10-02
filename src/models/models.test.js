import test from 'node:test';
import assert from 'node:assert/strict';
import BankingSystem from './BankingSystem.js';
import Customer from './Customer.js';
import SavingsAccount from './SavingsAccount.js';
import CheckingAccount from './CheckingAccount.js';
import CreditCard from './CreditCard.js';
import LocalBankStorage from './LocalBankStorage.js';

class MemoryStorage {
  values = new Map();

  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
}

test('registration rejects duplicate usernames and login locks on the third failure', async () => {
  const bank = new BankingSystem();
  const customer = new Customer('ID-1', 'Ana Demo', '3000000000', 'ana', 'demo123');
  bank.registerCustomer(customer);
  assert.throws(() => bank.registerCustomer(customer), /already exists/);
  assert.equal(await bank.authenticate('ana', 'wrong'), false);
  assert.equal(customer.getFailedAttempts(), 1);
  assert.equal(await bank.authenticate('ana', 'wrong'), false);
  await assert.rejects(bank.authenticate('ana', 'wrong'), /locked/);
  assert.equal(customer.isLocked(), true);
});

test('savings deposits and applies monthly interest on withdrawal', () => {
  const account = new SavingsAccount('S-1', 1000);
  assert.equal(account.consign(200), 1200);
  assert.equal(account.withdraw(500), 718);
  assert.deepEqual(account.getHistory().map(item => item.type), ['CONSIGNMENT', 'INTEREST', 'WITHDRAWAL']);
  assert.throws(() => account.withdraw(10000), /Insufficient funds/);
  assert.throws(() => account.consign(0), /greater than zero/);
});

test('checking account permits up to 20 percent overdraft and records it', () => {
  const account = new CheckingAccount('C-1', 1000000);
  assert.equal(account.withdraw(1200000), -200000);
  assert.throws(() => account.withdraw(1), /overdraft limit/);
});

test('transfers reject same product and record both sides', () => {
  const source = new CheckingAccount('C-1', 500000);
  const destination = new SavingsAccount('S-1', 100000);
  assert.throws(() => source.transfer(1000, source), /same account/);
  source.transfer(50000, destination);
  assert.equal(source.getBalance(), 450000);
  assert.equal(destination.getBalance(), 150000);
  assert.equal(source.getHistory()[0].type, 'TRANSFER_OUT');
  assert.equal(destination.getHistory()[0].type, 'TRANSFER_IN');
});

test('credit card purchase applies the correct installment rates and payment', () => {
  const card = new CreditCard('T-1', 5000000);
  const twoMonths = card.makePurchase(200000, 2);
  assert.equal(twoMonths.rate, 0);
  assert.equal(twoMonths.monthlyPayment, 100000);
  const threeMonths = card.makePurchase(300000, 3);
  assert.equal(threeMonths.rate, 0.019);
  assert.ok(threeMonths.monthlyPayment > 100000);
  assert.equal(card.calculateRate(7), 0.023);
  assert.equal(card.getHistory().length, 2);
});

test('customer profile, password change, and product management work', async () => {
  const customer = new Customer('ID-2', 'Luis Demo', '3000000001', 'luis', 'before1');
  const account = new SavingsAccount('S-2', 0);
  customer.addProduct(account);
  assert.equal(customer.getProducts().length, 1);
  customer.editProfile({ fullName: 'Luis Updated', phone: '3001112222' });
  assert.equal(customer.fullName, 'Luis Updated');
  await customer.changePassword('before1', 'after123');
  assert.equal(await customer.verifyPassword('after123'), true);
  assert.equal(customer.removeProduct('S-2'), true);
});

test('customer usernames stay unique when profiles are edited', () => {
  const bank = new BankingSystem();
  bank.registerCustomer(new Customer('ADMIN-3', 'Admin Edit', '3000000099', 'admin_edit', 'admin789', 'admin'), { allowAdministratorBootstrap: true });
  bank.registerCustomer(new Customer('ID-3', 'Marta Demo', '3000000002', 'marta', 'demo123'));
  bank.registerCustomer(new Customer('ID-4', 'Nico Demo', '3000000003', 'nico', 'demo123'));
  bank.authenticatedUser = bank.findCustomer('admin_edit');
  bank.editCustomer('marta', { username: 'marta.gold' });
  assert.equal(bank.findCustomer('marta'), null);
  assert.equal(bank.findCustomer('marta.gold').fullName, 'Marta Demo');
  assert.throws(() => bank.editCustomer('marta.gold', { username: 'nico' }), /already exists/);
});

test('username casing is preserved while authentication remains case-insensitive', async () => {
  const bank = new BankingSystem();
  const customer = new Customer('ID-11', 'Case Demo', '3000000020', 'PabloRL', 'case123');
  bank.registerCustomer(customer);
  assert.equal(customer.username, 'PabloRL');
  assert.equal(await bank.authenticate('pablorl', 'case123'), true);
  assert.throws(() => bank.registerCustomer(new Customer('ID-12', 'Duplicate Demo', '3000000021', 'PABLORL', 'case456')), /already exists/);
});

test('authenticated customer can transfer to another customer account', async () => {
  const bank = new BankingSystem();
  const sender = new Customer('ID-5', 'Sender Demo', '3000000004', 'sender', 'demo123');
  const recipient = new Customer('ID-6', 'Recipient Demo', '3000000005', 'recipient', 'demo123');
  const source = new CheckingAccount('C-5', 100000);
  const destination = new SavingsAccount('S-6', 10000);
  sender.addProduct(source);
  recipient.addProduct(destination);
  bank.registerCustomer(sender);
  bank.registerCustomer(recipient);
  await bank.authenticate('sender', 'demo123');
  bank.transfer(source, destination, 25000);
  assert.equal(source.getBalance(), 75000);
  assert.equal(destination.getBalance(), 35000);
});

test('local storage restores class instances, balances, card debt, and movement dates', async () => {
  const storage = new LocalBankStorage(new MemoryStorage(), 'round-trip');
  const bank = new BankingSystem();
  const customer = new Customer('ID-7', 'Persisted Demo', '3000000006', 'persisted', 'not-a-real-password');
  const savings = new SavingsAccount('S-7', 400000);
  const checking = new CheckingAccount('C-7', 1000000);
  const card = new CreditCard('T-7', 5000000);
  savings.consign(10000);
  checking.withdraw(1200000);
  card.makePurchase(250000, 3);
  customer.addProduct(savings);
  customer.addProduct(checking);
  customer.addProduct(card);
  bank.registerCustomer(customer);

  await storage.save(bank, 12);
  const raw = storage.storage.getItem('round-trip');
  assert.equal(raw.includes('not-a-real-password'), false);
  const restoredBank = new BankingSystem();
  const result = await storage.restore(restoredBank);
  const restored = restoredBank.findCustomer('persisted');
  assert.equal(result.productSequence, 12);
  assert.equal(result.restored, true);
  assert.equal(restored.getProducts()[0] instanceof SavingsAccount, true);
  assert.equal(restored.getProducts()[1].getBalance(), -200000);
  assert.equal(restored.getProducts()[2].currentDebt, 250000);
  assert.equal(restored.getProducts()[0].getHistory()[0].dateTime instanceof Date, true);
  assert.equal(await restoredBank.authenticate('persisted', 'not-a-real-password'), true);
});

test('failed login counts and lock status persist locally', async () => {
  const storage = new LocalBankStorage(new MemoryStorage(), 'lock-state');
  const bank = new BankingSystem();
  bank.registerCustomer(new Customer('ID-8', 'Locked Demo', '3000000007', 'locked', 'demo789'));
  await bank.authenticate('locked', 'wrong');
  await bank.authenticate('locked', 'wrong');
  await storage.save(bank);

  const restoredBank = new BankingSystem();
  await storage.restore(restoredBank);
  assert.equal(restoredBank.findCustomer('locked').getFailedAttempts(), 2);
  await assert.rejects(restoredBank.authenticate('locked', 'wrong'), /locked/);
  await storage.save(restoredBank);

  const lockedAgain = new BankingSystem();
  await storage.restore(lockedAgain);
  assert.equal(lockedAgain.findCustomer('locked').isLocked(), true);
  await assert.rejects(lockedAgain.authenticate('locked', 'demo789'), /locked/);
});

test('administrator can view all customers and assign limited customer permissions', async () => {
  const bank = new BankingSystem();
  const administrator = new Customer('ADMIN-1', 'Admin Demo', '3000000010', 'admin', 'admin123', 'admin');
  const customer = new Customer('ID-9', 'Customer Demo', '3000000011', 'customer', 'customer123');
  const account = new SavingsAccount('S-9', 50000);
  customer.addProduct(account);
  bank.registerCustomer(administrator, { allowAdministratorBootstrap: true });
  bank.registerCustomer(customer);
  await bank.authenticate('admin', 'admin123');
  bank.assignCustomerAccess('customer', 'customer', ['view-own']);
  await bank.authenticate('customer', 'customer123');
  assert.throws(() => bank.getAllCustomers(), /permission/);
  assert.throws(() => bank.withdraw(account, 1000), /permission/);

  await bank.authenticate('admin', 'admin123');
  assert.equal(bank.getAllCustomers().length, 2);
  bank.assignCustomerAccess('customer', 'customer', ['deposit']);
  assert.equal(customer.hasPermission('view-own'), true);
  assert.equal(customer.hasPermission('deposit'), true);
  assert.equal(customer.hasPermission('withdraw'), false);
  assert.throws(() => bank.assignCustomerAccess('admin', 'customer', []), /administrator account/);
  assert.equal(administrator.role, 'admin');
});

test('administrator roles and permissions survive local storage restore', async () => {
  const storage = new LocalBankStorage(new MemoryStorage(), 'roles-round-trip');
  const bank = new BankingSystem();
  const administrator = new Customer('ADMIN-2', 'Admin Saved', '3000000012', 'saved_admin', 'admin456', 'admin');
  const customer = new Customer('ID-10', 'Restricted Demo', '3000000013', 'restricted', 'customer456');
  bank.registerCustomer(administrator, { allowAdministratorBootstrap: true });
  bank.registerCustomer(customer);
  await bank.authenticate('saved_admin', 'admin456');
  bank.assignCustomerAccess('restricted', 'customer', ['transfer']);
  await storage.save(bank);

  const restoredBank = new BankingSystem();
  await storage.restore(restoredBank);
  const restoredAdmin = restoredBank.findCustomer('saved_admin');
  const restoredCustomer = restoredBank.findCustomer('restricted');
  assert.equal(restoredAdmin.role, 'admin');
  assert.equal(restoredCustomer.role, 'customer');
  assert.equal(restoredCustomer.hasPermission('view-own'), true);
  assert.equal(restoredCustomer.hasPermission('transfer'), true);
  assert.equal(restoredCustomer.hasPermission('withdraw'), false);
  await restoredBank.authenticate('saved_admin', 'admin456');
  assert.equal(restoredBank.getAllCustomers().length, 2);
});