/* Import Account from './Account.js'
Default export class CheckingAccount extending Account
 Define static property OVERDRAFT_PCT = 0.20
 Create constructor(productNumber, balance) calling super(productNumber, balance)
 Implement withdraw(amount) method:
 - Calculate maxLimit = this.getBalance() + (this.getBalance() * CheckingAccount.OVERDRAFT_PCT)
 - If amount > maxLimit, throw Error "Insufficient funds including overdraft"
 - Otherwise, decrease the balance by amount and call this.registerTransaction('Withdrawal', amount) 
 */



