import Customer from './Customer.js';

/**
 * Class representing the central banking system controller.
 */
export default class BankingSystem {
  constructor() {
    this.customers = [];
    this.authenticatedUser = null;
  }

  registerCustomer(customer, { allowAdministratorRestore = false, allowAdministratorBootstrap = false } = {}) {
    if (!(customer instanceof Customer)) {
      throw new Error('Only valid customers can be registered.');
    }
    const exists = this.customers.some(c => c.username.toLowerCase() === customer.username.toLowerCase());
    if (exists) {
      throw new Error("Customer with this username already exists.");
    }
    if (customer.role === 'admin'
      && !allowAdministratorRestore
      && !this.authenticatedUser?.hasPermission('manage-users')
      && !(allowAdministratorBootstrap && !this.customers.some(item => item.role === 'admin'))) {
      throw new Error('Only an administrator can create another administrator.');
    }
    this.customers.push(customer);
    return customer;
  }

  registerUser(customer) {
    return this.registerCustomer(customer);
  }

  async authenticate(username, password) {
    const normalizedUsername = username.trim().toLowerCase();
    const customer = this.customers.find(c => c.username.toLowerCase() === normalizedUsername);
    if (!customer) {
      throw new Error("Customer not found.");
    }

    if (await customer.verifyPassword(password)) {
      this.authenticatedUser = customer;
      return true;
    }
    if (customer.isLocked()) {
      throw new Error('Account is locked after three failed attempts.');
    }
    return false;
  }

  async login(username, password) {
    return this.authenticate(username, password);
  }

  getCustomers() {
    return [...this.customers];
  }

  requirePermission(permission) {
    if (!this.authenticatedUser?.hasPermission(permission)) {
      throw new Error('You do not have permission to perform this action.');
    }
  }

  getAllCustomers() {
    this.requirePermission('view-all');
    return this.getCustomers();
  }

  clearCustomers() {
    this.customers = [];
    this.logout();
  }

  findCustomer(username) {
    const normalizedUsername = username.trim().toLowerCase();
    return this.customers.find(customer => customer.username.toLowerCase() === normalizedUsername) ?? null;
  }

  editCustomer(username, profile) {
    const customer = this.findCustomer(username);
    if (!customer) throw new Error('Customer not found.');
    if (customer !== this.authenticatedUser) this.requirePermission('manage-users');
    const normalizedProfile = { ...profile };
    if (normalizedProfile.username) {
      normalizedProfile.username = normalizedProfile.username.trim();
      const duplicate = this.customers.some(item => item !== customer && item.username.toLowerCase() === normalizedProfile.username.toLowerCase());
      if (duplicate) throw new Error('Customer with this username already exists.');
    }
    return customer.editProfile(normalizedProfile);
  }

  deleteCustomer(username) {
    this.requirePermission('manage-users');
    const index = this.customers.findIndex(customer => customer.username === username);
    if (index < 0) return false;
    if (this.customers[index].role === 'admin'
      && this.customers.filter(customer => customer.role === 'admin').length === 1) {
      throw new Error('The last administrator cannot be deleted.');
    }
    if (this.authenticatedUser === this.customers[index]) this.logout();
    this.customers.splice(index, 1);
    return true;
  }

  transfer(source, destination, amount) {
    this.requirePermission('transfer');
    if (!this.authenticatedUser) throw new Error('Log in before making a transfer.');
    if (!this.authenticatedUser.products.includes(source)) {
      throw new Error('The source product must belong to the logged-in customer.');
    }
    return source.transfer(amount, destination);
  }

  deposit(account, amount) {
    this.requirePermission('deposit');
    if (!this.authenticatedUser.products.includes(account)) {
      throw new Error('You can only deposit to your own account.');
    }
    return account.consign(amount);
  }

  withdraw(account, amount) {
    this.requirePermission('withdraw');
    if (!this.authenticatedUser.products.includes(account)) {
      throw new Error('You can only withdraw from your own account.');
    }
    return account.withdraw(amount);
  }

  makeCardPurchase(card, amount, installments) {
    this.requirePermission('card-purchase');
    if (!this.authenticatedUser.products.includes(card)) {
      throw new Error('You can only use your own card.');
    }
    return card.makePurchase(amount, installments);
  }

  assignCustomerAccess(username, role, permissions) {
    this.requirePermission('manage-permissions');
    const customer = this.findCustomer(username);
    if (!customer) throw new Error('Customer not found.');
    const previous = { role: customer.role, permissions: [...customer.permissions] };
    customer.setAccess(role, permissions);
    const administratorCanManage = this.customers.some(item => item.role === 'admin');
    if (!administratorCanManage) {
      customer.setAccess(previous.role, previous.permissions);
      throw new Error('At least one administrator account must remain.');
    }
    return customer;
  }

  logout() {
    this.authenticatedUser = null;
  }

  getAuthenticatedUser() {
    return this.authenticatedUser;
  }
}