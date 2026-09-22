// Import Product from './Product.js'
// Default export class CreditCard extending Product
// Define private fields #creditLimit and #currentDebt
// Create constructor(productNumber, creditLimit) calling super(productNumber) and setting #currentDebt to 0
// Implement makePurchase(amount, installments): throw Error if #currentDebt + amount > #creditLimit, otherwise add amount to #currentDebt and call registerTransaction('Purchase', amount)
// Implement calculateRate(installments): return 0.021 if installments > 1, else 0
// Implement calculateMonthlyFee(): return #currentDebt * 0.05 if #currentDebt > 0, else 0

import Product from './Product.js';

export default class CreditCard extends Product {
  #creditLimit;
  #currentDebt;

  constructor(productNumber, creditLimit) {
    super(productNumber);
    this.#creditLimit = creditLimit;
    this.#currentDebt = 0;
  }

  makePurchase(amount, installments) {
    if (this.#currentDebt + amount > this.#creditLimit) {
      throw new Error("Credit limit exceeded");
    }
    this.#currentDebt += amount;
    this.registerTransaction('Purchase', amount);
  }

  calculateRate(installments) {
    return installments > 1 ? 0.021 : 0;
  }

  calculateMonthlyFee() {
    return this.#currentDebt > 0 ? (this.#currentDebt * 0.05) : 0;
  }
}