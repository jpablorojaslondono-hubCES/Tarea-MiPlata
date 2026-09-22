// Import Account from './Account.js'
// Default export class SavingsAccount extending Account
// Define a static property INTEREST_RATE = 0.015
// Create constructor(productNumber, balance) that calls super(productNumber, balance)
// Implement withdraw(amount) method:
// - Check if amount <= this.getBalance(). If not, throw Error "Insufficient funds"
// - If sufficient, subtract amount from balance and call this.registerTransaction('Withdrawal', amount)

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

	setBalance(balance) {
		this.#balance = balance;
	}
}