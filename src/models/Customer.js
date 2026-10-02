import Product from './Product.js';
import { hashPassword, verifyPassword as verifyPasswordHash } from './PasswordCrypto.js';
import { ADMIN_PERMISSIONS, CUSTOMER_PERMISSIONS, normalizePermissions } from './permissions.js';

/**
 * Class representing a bank customer.
 */
export default class Customer {
  #password;
  #passwordRecord;
  #failedAttempts;
  #isLocked;

  constructor(identification, fullName, phone, username, password, role = 'customer', permissions) {
    this.identification = identification;
    this.fullName = fullName;
    this.phone = phone;
    this.username = username;
    this.role = role === 'admin' ? 'admin' : 'customer';
    this.permissions = normalizePermissions(permissions ?? (this.role === 'admin' ? ADMIN_PERMISSIONS : CUSTOMER_PERMISSIONS));
    this.#password = password;
    this.#passwordRecord = null;
    this.#failedAttempts = 0;
    this.#isLocked = false;
    this.products = [];
  }

  getUsername() {
    return this.username;
  }

  getFailedAttempts() {
    return this.#failedAttempts;
  }

  getProducts() {
    return [...this.products];
  }

  hasPermission(permission) {
    return this.role === 'admin' || this.permissions.includes(permission);
  }

  setAccess(role, permissions) {
    if (!['admin', 'customer'].includes(role)) throw new Error('Role must be admin or customer.');
    this.role = role;
    this.permissions = role === 'admin'
      ? [...ADMIN_PERMISSIONS]
      : normalizePermissions(['view-own', ...(permissions ?? [])]);
    return { role: this.role, permissions: [...this.permissions] };
  }

  addProduct(product) {
    if (!(product instanceof Product)) {
      throw new Error('Customer products must be valid bank products.');
    }
    if (this.products.some(item => item.productNumber === product.productNumber)) {
      throw new Error('A product with this number is already assigned to the customer.');
    }
    this.products.push(product);
    return product;
  }

  removeProduct(productNumber) {
    const productIndex = this.products.findIndex(item => item.productNumber === productNumber);
    if (productIndex < 0) return false;
    this.products.splice(productIndex, 1);
    return true;
  }

  editProfile(data = {}) {
    const fields = ['identification', 'fullName', 'phone', 'username'];
    for (const field of fields) {
      if (Object.hasOwn(data, field)) {
        const value = String(data[field]).trim();
        if (!value) throw new Error(`${field} cannot be empty.`);
        this[field] = value;
      }
    }
    return { identification: this.identification, fullName: this.fullName, phone: this.phone };
  }

  async verifyPassword(inputPassword) {
    if (this.#isLocked) {
      throw new Error("Account is locked due to multiple failed login attempts.");
    }

    const passwordMatches = this.#passwordRecord
      ? await verifyPasswordHash(inputPassword, this.#passwordRecord)
      : this.#password === inputPassword;
    if (passwordMatches) {
      this.#failedAttempts = 0;
      return true;
    }

    this.#failedAttempts++;
    if (this.#failedAttempts >= 3) {
      this.#isLocked = true;
    }
    return false;
  }

  async changePassword(currentPassword, newPassword) {
    const passwordMatches = this.#passwordRecord
      ? await verifyPasswordHash(currentPassword, this.#passwordRecord)
      : this.#password === currentPassword;
    if (!passwordMatches) {
      throw new Error("Current password is incorrect.");
    }
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      throw new Error('New password must contain at least 6 characters.');
    }
    this.#password = newPassword;
    this.#passwordRecord = null;
    this.#failedAttempts = 0;
    return true;
  }

  async getPasswordRecord() {
    if (!this.#passwordRecord) this.#passwordRecord = await hashPassword(this.#password);
    this.#password = null;
    return { ...this.#passwordRecord };
  }

  restorePasswordRecord(record) {
    if (!record?.salt || !record?.hash) throw new Error('Stored password data is missing.');
    this.#password = null;
    this.#passwordRecord = { salt: record.salt, hash: record.hash };
  }

  restoreSecurityState(failedAttempts = 0, isLocked = false) {
    this.#failedAttempts = Math.max(0, Math.min(3, Number(failedAttempts) || 0));
    this.#isLocked = Boolean(isLocked) || this.#failedAttempts >= 3;
  }

  isLocked() {
    return this.#isLocked;
  }
}