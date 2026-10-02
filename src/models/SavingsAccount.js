import Account from './Account.js';

/**
 * Class representing a savings account with a fixed interest rate.
 */
export default class SavingsAccount extends Account {
  static INTEREST_RATE = 0.015;

  constructor(accountNumber, initialBalance = 0) {
    super(accountNumber, initialBalance);
  }

  withdraw(amount, transactionType = 'WITHDRAWAL') {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Withdrawal amount must be greater than zero.");
    }
    const interest = this.getBalance() * SavingsAccount.INTEREST_RATE;
    if (amount > this.getBalance() + interest) {
      throw new Error("Insufficient funds in savings account.");
    }
    if (interest > 0) {
      this.deposit(interest, 'INTEREST');
    }
    return this.debit(amount, transactionType);
  }
}