// Import Account from './Account.js'
// Default export class SavingsAccount extending Account
// Define a static property INTEREST_RATE = 0.015
// Create constructor(productNumber, balance) calling super(productNumber, balance)
// Implement withdraw(amount): if amount > getBalance(), throw Error. Else, subtract amount using setBalance() and call registerTransaction('Withdrawal', amount)

import Account from './Account.js';

export default class SavingsAccount extends Account {
  static INTEREST_RATE = 0.015;

  constructor(productNumber, balance) {
    super(productNumber, balance);
  }

  withdraw(amount) {
    if (amount > this.getBalance()) {
      throw new Error("Insufficient funds");
    }
    this.setBalance(this.getBalance() - amount);
    this.registerTransaction('Withdrawal', amount);
  }
}