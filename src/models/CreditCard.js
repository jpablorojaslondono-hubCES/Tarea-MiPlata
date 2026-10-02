import Product from './Product.js';

/**
 * Class representing a credit card product with a credit limit.
 */
export default class CreditCard extends Product {
  constructor(productNumber, creditLimit) {
    super(productNumber);
    if (!Number.isFinite(creditLimit) || creditLimit <= 0) {
      throw new Error('Credit limit must be greater than zero.');
    }
    this.creditLimit = creditLimit;
    this.currentDebt = 0;
  }

  calculateRate(installments) {
    if (!Number.isInteger(installments) || installments < 1) {
      throw new Error('Installments must be a positive whole number.');
    }
    if (installments <= 2) return 0;
    if (installments <= 6) return 0.019;
    return 0.023;
  }

  calculateMonthlyPayment(amount, installments, rate = this.calculateRate(installments)) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Purchase amount must be greater than zero.');
    }
    if (!Number.isInteger(installments) || installments < 1) {
      throw new Error('Installments must be a positive whole number.');
    }
    if (rate === 0) return amount / installments;
    return amount * rate / (1 - Math.pow(1 + rate, -installments));
  }

  calculateMonthlyFee(installments = 1) {
    if (this.currentDebt === 0) return 0;
    return this.calculateMonthlyPayment(this.currentDebt, installments);
  }

  makePurchase(amount, installments = 1) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error("Purchase amount must be greater than zero.");
    }
    const rate = this.calculateRate(installments);
    const availableCredit = this.creditLimit - this.currentDebt;
    if (amount > availableCredit) {
      throw new Error("Purchase exceeds available credit limit.");
    }

    this.currentDebt += amount;
    const monthlyPayment = this.calculateMonthlyPayment(amount, installments, rate);
    this.registerTransaction('PURCHASE', amount, { installments, rate, monthlyPayment });
    return { amount, installments, rate, monthlyPayment, currentDebt: this.currentDebt };
  }
}