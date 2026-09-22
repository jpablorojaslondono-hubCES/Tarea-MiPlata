// Default export the Transaction class
// Define private fields (#): dateTime (default to new Date()), transactionType, and amount
// Create a constructor that receives transactionType and amount to initialize the fields
export default class Transaction {
  #dateTime = new Date();
  #transactionType;
  #amount;

  constructor(transactionType, amount) {
    this.#transactionType = transactionType;
    this.#amount = amount;
  }
}