/* Import Account from './Account.js'
Default export class CheckingAccount extending Account
 Define static property OVERDRAFT_PCT = 0.20
 Create constructor(productNumber, balance) calling super(productNumber, balance)
 Implement withdraw(amount) method:
 - Calculate maxLimit = this.getBalance() + (this.getBalance() * CheckingAccount.OVERDRAFT_PCT)
 - If amount > maxLimit, throw Error "Insufficient funds including overdraft"
 - Otherwise, decrease the balance by amount and call this.registerTransaction('Withdrawal', amount) 
 */
import Account from './Account.js';

export default class CheckingAccount extends Account {
  static OVERDRAFT_PCT = 0.20;

  constructor(productNumber, balance) {
    super(productNumber, balance);
  }

  withdraw(amount) {
    const maxLimit = this.getBalance() + (this.getBalance() * CheckingAccount.OVERDRAFT_PCT);
    
    if (amount > maxLimit) {
      throw new Error("Insufficient funds including overdraft");
    }
    
    this.setBalance(this.getBalance() - amount);
    this.registerTransaction('Withdrawal', amount);
  }
}


