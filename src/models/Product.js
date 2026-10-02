import Transaction from './Transaction.js';

/**
 * Abstract class representing a bank product.
 */
export default class Product {
  constructor(productNumber) {
    if (this.constructor === Product) {
      throw new Error("Cannot instantiate abstract class Product directly.");
    }
    this.productNumber = productNumber;
    this.history = [];
    this.transactions = this.history;
  }

  getHistory() {
    return [...this.history];
  }

  getTransactions() {
    return this.getHistory();
  }

  restoreHistory(entries = []) {
    if (!Array.isArray(entries)) throw new Error('Stored transaction history is invalid.');
    this.history = entries.map(entry => {
      const { dateTime, type, value, ...details } = entry;
      const transaction = new Transaction(type, value, details);
      transaction.dateTime = new Date(dateTime);
      if (Number.isNaN(transaction.dateTime.getTime())) throw new Error('Stored transaction date is invalid.');
      return transaction;
    });
    this.transactions = this.history;
  }

  registerTransaction(type, value, details = {}) {
    const transaction = new Transaction(type, value, details);
    this.history.push(transaction);
    return transaction;
  }
}