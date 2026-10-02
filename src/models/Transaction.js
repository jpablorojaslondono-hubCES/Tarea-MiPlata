/**
 * Class representing a financial transaction.
 */
export default class Transaction {
  constructor(type, value, details = {}) {
    this.dateTime = new Date();
    this.type = type;
    this.value = value;
    Object.assign(this, details);
  }
}