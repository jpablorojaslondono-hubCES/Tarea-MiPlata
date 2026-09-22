// Import Transaction from './Transaction.js'
// Default export class Product
// Define private fields: #productNumber, #history (initialize as empty array)
// Create constructor receiving productNumber
// Create getTransactions() method returning #history
// Create registerTransaction(type, amount) method that pushes a new Transaction to #history

import Transaction from './Transaction.js';

export default class Product {
  #productNumber;
  #history;

  constructor(productNumber) {
    if (new.target === Product) {
      throw new Error("Cannot instantiate abstract class Product directly");
    }
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



