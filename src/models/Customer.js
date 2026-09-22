// Default export class Customer
// Define private fields: #identification, #fullName, #phoneNumber, #username, #password, #failedAttempts, #isBlocked, #products
// Create constructor initializing basic data, setting #failedAttempts to 0, #isBlocked to false, and #products to an empty array
// Implement editProfile(data) to update #fullName or #phoneNumber
// Implement changePassword(currentPass, newPass) to update #password if currentPass is correct, otherwise throw Error

export default class Customer {
  #identification;
  #fullName;
  #phoneNumber;
  #username;
  #password;
  #failedAttempts;
  #isBlocked;
  #products;

  constructor(identification, fullName, phoneNumber, username, password) {
    this.#identification = identification;
    this.#fullName = fullName;
    this.#phoneNumber = phoneNumber;
    this.#username = username;
    this.#password = password;
    this.#failedAttempts = 0;
    this.#isBlocked = false;
    this.#products = [];
  }

  editProfile(data) {
    if (data.fullName) this.#fullName = data.fullName;
    if (data.phoneNumber) this.#phoneNumber = data.phoneNumber;
  }

  changePassword(currentPass, newPass) {
    if (this.#password === currentPass) {
      this.#password = newPass;
    } else {
      throw new Error("Invalid current password");
    }
  }
}