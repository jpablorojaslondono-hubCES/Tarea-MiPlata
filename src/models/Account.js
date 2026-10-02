import Product from './Product.js';

/**
 * Abstract class representing a bank product account.
 */
export default class Account extends Product {
  #balance;

  constructor(accountNumber, initialBalance = 0, { allowNegativeBalance = false } = {}) {
    if (new.target === Account) {
      throw new Error("Cannot instantiate abstract class Account directly.");
    }
    super(accountNumber);
    this.accountNumber = accountNumber;
    this.productNumber = accountNumber;
    if (!Number.isFinite(initialBalance) || (!allowNegativeBalance && initialBalance < 0)) {
      throw new Error(allowNegativeBalance ? 'Initial balance must be a number.' : 'Initial balance must be a non-negative number.');
    }
    this.#balance = initialBalance;
  }

  getBalance() {
    return this.#balance;
  }

  deposit(amount, transactionType = 'DEPOSIT') {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Deposit amount must be greater than zero.");
    }
    this.#balance += amount;
    this.registerTransaction(transactionType, amount);
    return this.#balance;
  }

  consign(amount) {
    return this.deposit(amount, 'CONSIGNMENT');
  }

  consultBalance() {
    return this.getBalance();
  }

  canWithdraw(amount) {
    return Number.isFinite(amount) && amount > 0 && amount <= this.#balance;
  }

  debit(amount, transactionType = 'WITHDRAWAL') {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Withdrawal amount must be greater than zero.');
    }
    this.#balance -= amount;
    this.registerTransaction(transactionType, amount);
    return this.#balance;
  }

  withdraw(amount) {
    throw new Error("Method 'withdraw()' must be implemented.");
  }

  transfer(amount, destination) {
    if (!(destination instanceof Account)) {
      throw new Error('Destination must be a bank account.');
    }
    if (destination === this) {
      throw new Error('Transfers to the same account are not allowed.');
    }
    if (!this.canWithdraw(amount)) {
      throw new Error('Insufficient available funds for this transfer.');
    }

    this.withdraw(amount, 'TRANSFER_OUT');
    destination.deposit(amount, 'TRANSFER_IN');
    return { sourceBalance: this.getBalance(), destinationBalance: destination.getBalance() };
  }
}