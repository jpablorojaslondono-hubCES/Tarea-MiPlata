// Import Customer from './Customer.js'
// Default export class BankingSystem
// Define private fields: #customers (empty array) and #authenticatedUser (null)
// Create constructor initializing fields
// Implement registerUser(customer): push customer to #customers
// Implement login(username, password): find customer by username. If not found or blocked, throw Error. If password fails, increment attempts and throw Error. If success, reset attempts and set #authenticatedUser.

import Customer from './Customer.js';

export default class BankingSystem {
  #customers;
  #authenticatedUser;

  constructor() {
    this.#customers = [];
    this.#authenticatedUser = null;
  }

  registerUser(customer) {
    this.#customers.push(customer);
  }

  login(username, password) {
    const customer = this.#customers.find(c => c.getUsername() === username);
    
    if (!customer) throw new Error("User not found");
    if (customer.getIsBlocked()) throw new Error("Account is blocked");

    if (customer.getPassword() !== password) {
      customer.incrementFailedAttempts();
      throw new Error("Invalid password");
    }

    customer.resetFailedAttempts();
    this.#authenticatedUser = customer;
  }
  // Find the customer by username in #customers array
// If customer is not found, throw an Error "User not found"
// If found, call the block() method on the customer object

  blockAccount(username) {
    const customer = this.#customers.find(c => c.getUsername() === username);
    if (!customer) {
      throw new Error("User not found");
    }
    customer.block();
  }


  // Add method getAllCustomers() that returns the #customers array
// Add method deleteCustomer(username) that filters the #customers array to remove the given username

  getAllCustomers() {
    return this.#customers;
  }

  deleteCustomer(username) {
    this.#customers = this.#customers.filter(c => c.getUsername() !== username);
  }
  
}

