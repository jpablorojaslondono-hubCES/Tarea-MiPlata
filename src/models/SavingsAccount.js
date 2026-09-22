import Account from './Account.js';

export default class SavingsAccount extends Account {
	static INTEREST_RATE = 0.015;

	constructor(productNumber, balance) {
		super(productNumber, balance);
	}

	withdraw(amount) {
		if (amount > this.getBalance()) {
			throw new Error('Insufficient funds');
		}

		this.setBalance(this.getBalance() - amount);
		this.registerTransaction('Withdrawal', amount);
	}
}
