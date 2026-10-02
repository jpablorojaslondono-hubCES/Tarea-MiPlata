import Account from './Account.js';

/**
 * Class representing a checking account with an overdraft limit.
 */
export default class CheckingAccount extends Account {
  static OVERDRAFT_PCT = 0.20;

  constructor(accountNumber, initialBalance = 0) {
    super(accountNumber, initialBalance, { allowNegativeBalance: true });
  }

  getAvailableFunds() {
    const balance = this.getBalance();
    return balance > 0 ? balance * (1 + CheckingAccount.OVERDRAFT_PCT) : 0;
  }

  canWithdraw(amount) {
    return Number.isFinite(amount) && amount > 0 && amount <= this.getAvailableFunds();
  }

  withdraw(amount, transactionType = 'WITHDRAWAL') {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Withdrawal amount must be greater than zero.");
    }
    if (!this.canWithdraw(amount)) {
      throw new Error("Withdrawal exceeds checking balance and overdraft limit.");
    }
    return this.debit(amount, transactionType);
  }
}