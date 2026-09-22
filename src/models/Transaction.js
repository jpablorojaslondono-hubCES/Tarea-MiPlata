// Import Transaction from './Transaction.js'
// Default export class Product
// Define private fields: #productNumber and #history
// Create constructor(productNumber) setting #productNumber and initializing #history as empty array
// Implement getTransactions() returning #history
// Implement registerTransaction(type, amount) that creates a Transaction and pushes it to #history

import Transaction from './Transaction.js';

export default class Product {
  #productNumber;
  #history;

  constructor(productNumber) {
    this.#productNumber = productNumber;
    this.#history = [];
  }

  getTransactions() {
    return this.#history;
  }

  registerTransaction(type, amount) {
    const transaction = new Transaction(type, amount);
    this.#history.push(transaction);
  }
}