// Import Product from './Product.js'
// Default export class Account extending Product
// Define private field #balance
// Create constructor(productNumber, balance) calling super(productNumber) and initializing #balance
// Implement getBalance() returning #balance
// Implement setBalance(amount) setting #balance
// Implement deposit(amount): add to #balance and call registerTransaction('Deposit', amount)
// Implement withdraw(amount): throw Error "Method withdraw() must be implemented by subclasses"
// Implement transfer(amount, destinationAccount): call this.withdraw(amount) and destinationAccount.deposit(amount)

import Product from './Product.js';

export default class Account extends Product {
  #balance;

  constructor(productNumber, balance) {
    super(productNumber);
    this.#balance = balance;
  }

  getBalance() {
    return this.#balance;
  }
  
  setBalance(amount) {
    this.#balance = amount;
  }

  deposit(amount) {
    this.#balance += amount;
    this.registerTransaction('Deposit', amount);
  }

  withdraw(amount) {
    throw new Error("Method withdraw() must be implemented by subclasses");
  }

  transfer(amount, destinationAccount) {
    this.withdraw(amount);
    destinationAccount.deposit(amount);
  }
}