import BankingSystem from './models/BankingSystem.js';
import Customer from './models/Customer.js';
import Account from './models/Account.js';
import SavingsAccount from './models/SavingsAccount.js';
import CheckingAccount from './models/CheckingAccount.js';
import CreditCard from './models/CreditCard.js';
import LocalBankStorage from './models/LocalBankStorage.js';

const bank = new BankingSystem();
const localBankStorage = new LocalBankStorage();
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const currency = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
});
let productSequence = 1;
let toastTimer;
let lastFocusedElement;
let persistenceError = null;
let registrationRole = 'customer';
let registrationMode = 'customer';

function showToast(message, type = 'success') {
  const toast = $('#toast');
  if (!toast) return;
  const localizedMessage = message === 'You do not have permission to perform this action.'
    ? 'No tienes permiso para realizar esta operación.'
    : message;
  toast.textContent = localizedMessage;
  toast.className = `toast toast-${type}`;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3600);
}

const storageReady = localBankStorage.restore(bank).then(({ productSequence: savedSequence }) => {
  productSequence = savedSequence;
  syncAdminBootstrapButton();
}).catch(error => {
  persistenceError = error;
  syncAdminBootstrapButton();
  showToast(error.message, 'error');
});

async function persistBankState() {
  await storageReady;
  if (persistenceError) throw persistenceError;
  await localBankStorage.save(bank, productSequence);
}

function openAuth(mode = 'login') {
  const modal = $('#login-modal');
  lastFocusedElement = document.activeElement;
  modal.hidden = false;
  document.body.classList.add('dialog-open');
  setAuthMode(mode);
  syncAdminBootstrapButton();
  (mode === 'login' ? $('#username') : $('#register-identification'))?.focus();
}

function closeAuth() {
  const modal = $('#login-modal');
  modal.hidden = true;
  document.body.classList.remove('dialog-open');
  lastFocusedElement?.focus();
}

function setAuthMode(mode) {
  const registering = ['register', 'admin-setup', 'admin-create'].includes(mode);
  registrationRole = ['admin-setup', 'admin-create'].includes(mode) ? 'admin' : 'customer';
  registrationMode = mode;
  $('#login-form').hidden = registering;
  $('#registration-form').hidden = !registering;
  $('#show-login').hidden = mode !== 'login' && mode !== 'register';
  $('#show-register').hidden = mode !== 'login' && mode !== 'register';
  $('#registration-role-note').hidden = !registering;
  $('#registration-role-note').textContent = registrationRole === 'admin'
    ? 'Esta cuenta tendrá acceso administrativo a la información local del banco.'
    : 'Las cuentas nuevas pueden ver y operar solo sus propios productos.';
  $('#auth-title').textContent = mode === 'admin-setup' || mode === 'admin-create'
    ? mode === 'admin-setup' ? 'Configura el administrador inicial' : 'Crear administrador'
    : registering ? 'Crea tu cuenta de demostración' : 'Ingresa a tu Sucursal Virtual';
  $('#auth-feedback').textContent = '';
  if (registering) $('#registration-submit').textContent = registrationRole === 'admin' ? 'Crear administrador' : 'Crear cuenta de demo';
  syncAdminBootstrapButton();
}

function syncAdminBootstrapButton() {
  const hasAdministrator = bank.getCustomers().some(customer => customer.role === 'admin');
  $('#admin-bootstrap-btn').hidden = hasAdministrator || $('#login-form').hidden;
}

function syncAccessForm() {
  const customer = bank.findCustomer($('#access-customer').value);
  if (!customer) return;
  $('#access-role').value = customer.role;
  $$('.permission-list input[type="checkbox"]').forEach(input => {
    input.checked = customer.hasPermission(input.value);
    input.disabled = customer.role === 'admin' || input.value === 'view-own';
  });
  $('#access-form').classList.toggle('is-admin-selected', customer.role === 'admin');
}

function createProducts(customer) {
  const suffix = String(productSequence++).padStart(3, '0');
  customer.addProduct(new SavingsAccount(`AH-${suffix}`, 2500000));
  customer.addProduct(new CheckingAccount(`CCO-${suffix}`, 1000000));
  customer.addProduct(new CreditCard(`TCR-${suffix}`, 5000000));
}

function getCurrentCustomer() {
  return bank.getAuthenticatedUser();
}

function getAllAccounts() {
  return bank.getCustomers().flatMap(customer => customer.getProducts()
    .filter(product => product instanceof Account)
    .map(product => ({ customer, product })));
}

function findAccount(productNumber) {
  return getAllAccounts().find(({ product }) => product.productNumber === productNumber)?.product ?? null;
}

function describeProduct(product) {
  if (product instanceof SavingsAccount) return 'Cuenta de ahorros';
  if (product instanceof CheckingAccount) return 'Cuenta corriente';
  if (product instanceof CreditCard) return 'Tarjeta de crédito';
  return 'Producto';
}

function makeOption(value, label) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  return option;
}

function fillSelect(select, entries, placeholder) {
  if (!select) return;
  select.replaceChildren(makeOption('', placeholder));
  for (const [value, label] of entries) select.append(makeOption(value, label));
}

function renderAdminDashboard(admin) {
  $('#admin-dashboard').hidden = false;
  $('#customer-dashboard').hidden = true;
  const customers = bank.getAllCustomers();
  const accounts = getAllAccounts();
  const products = customers.flatMap(customer => customer.getProducts().map(product => ({ customer, product })));
  const totalBalance = accounts.reduce((total, { product }) => total + product.getBalance(), 0);
  const totalDebt = products.reduce((total, { product }) => total + (product instanceof CreditCard ? product.currentDebt : 0), 0);
  $('#admin-customer-count').textContent = String(customers.length);
  $('#admin-product-count').textContent = String(products.length);
  $('#admin-total-balance').textContent = currency.format(totalBalance);
  $('#admin-card-debt').textContent = currency.format(totalDebt);

  const customerRows = $('#admin-customers-body');
  customerRows.replaceChildren();
  for (const customer of customers) {
    const customerProducts = customer.getProducts();
    const balances = customerProducts.map(product => product instanceof CreditCard
      ? `${product.productNumber}: deuda ${currency.format(product.currentDebt)} / cupo ${currency.format(product.creditLimit)}`
      : `${product.productNumber}: ${currency.format(product.getBalance())}`);
    const row = document.createElement('tr');
    [customer.fullName, customer.username, customer.role === 'admin' ? 'Administrador' : 'Cliente', customer.isLocked() ? 'Bloqueada' : 'Activa', customer.identification, customer.phone, customerProducts.map(describeProduct).join(', ') || 'Sin productos', balances.join(' | ') || 'Sin saldos', customer.permissions.join(', ')]
      .forEach(value => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      });
    customerRows.append(row);
  }

  const movementRows = customers.flatMap(customer => customer.getProducts().flatMap(product =>
    product.getHistory().map(transaction => ({ customer, product, transaction }))
  )).sort((first, second) => second.transaction.dateTime - first.transaction.dateTime).slice(0, 50);
  const movementsBody = $('#admin-movements-body');
  movementsBody.replaceChildren();
  for (const { customer, product, transaction } of movementRows) {
    const row = document.createElement('tr');
    const movementNames = { CONSIGNMENT: 'Consignación', INTEREST: 'Interés', WITHDRAWAL: 'Retiro', TRANSFER_OUT: 'Transferencia enviada', TRANSFER_IN: 'Transferencia recibida', PURCHASE: 'Compra con tarjeta' };
    [new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short' }).format(transaction.dateTime), `${customer.fullName} (${customer.username})`, movementNames[transaction.type] ?? transaction.type, product.productNumber, currency.format(transaction.value)]
      .forEach(value => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      });
    movementsBody.append(row);
  }
  if (!movementRows.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.textContent = 'Todavía no hay movimientos.';
    row.append(cell);
    movementsBody.append(row);
  }

  const selectedUsername = $('#access-customer').value || admin.username;
  fillSelect($('#access-customer'), customers.map(customer => [customer.username, `${customer.fullName} (${customer.username})`]), 'Selecciona un usuario');
  $('#access-customer').value = customers.some(customer => customer.username === selectedUsername) ? selectedUsername : admin.username;
  fillCustomerManager();
  syncAccessForm();
  const selectedCustomer = bank.findCustomer($('#access-customer').value);
  $('#access-role').value = selectedCustomer.role;
}

function renderDashboard() {
  const customer = getCurrentCustomer();
  if (!customer) return;
  $('#public-content').hidden = true;
  $('#dashboard').hidden = false;
  $('#welcome-message').textContent = `Hola, ${customer.fullName}`;
  const isAdmin = customer.role === 'admin';
  $('#dashboard-role-label').textContent = isAdmin ? 'Administración · Demo' : 'Sucursal Virtual · Demo';
  $('#dashboard-description').textContent = isAdmin
    ? 'Vista administrativa: información local de todos los clientes y sus productos.'
    : 'Tus productos y movimientos guardados en este navegador.';
  if (isAdmin) {
    renderAdminDashboard(customer);
    return;
  }
  $('#admin-dashboard').hidden = true;
  $('#customer-dashboard').hidden = false;
  $('#profile-identification').value = customer.identification;
  $('#profile-name').value = customer.fullName;
  $('#profile-phone').value = customer.phone;
  $('#profile-username').value = customer.username;
  $('#deposit-form').hidden = !customer.hasPermission('deposit');
  $('#withdraw-form').hidden = !customer.hasPermission('withdraw');
  $('#transfer-form').hidden = !customer.hasPermission('transfer');
  $('#card-purchase-form').hidden = !customer.hasPermission('card-purchase');

  const products = customer.getProducts();
  const selectedAccount = $('#account-select').value;
  const selectedTransferSource = $('#transfer-source').value;
  const selectedCreditCard = $('#credit-card-select').value;
  const productGrid = $('#products-grid');
  productGrid.replaceChildren();
  for (const product of products) {
    const card = document.createElement('article');
    card.className = 'dashboard-product';
    const heading = document.createElement('h3');
    heading.textContent = describeProduct(product);
    const number = document.createElement('p');
    number.className = 'product-number';
    number.textContent = product.productNumber;
    const value = document.createElement('strong');
    value.textContent = product instanceof CreditCard
      ? `Disponible ${currency.format(product.creditLimit - product.currentDebt)}`
      : `Saldo ${currency.format(product.getBalance())}`;
    card.append(heading, number, value);
    productGrid.append(card);
  }

  const ownAccounts = products.filter(product => product instanceof Account);
  fillSelect($('#account-select'), ownAccounts.map(account => [account.productNumber, `${describeProduct(account)} · ${account.productNumber}`]), 'Selecciona una cuenta');
  fillSelect($('#transfer-source'), ownAccounts.map(account => [account.productNumber, `${describeProduct(account)} · ${account.productNumber}`]), 'Selecciona cuenta de origen');
  const creditCards = products.filter(product => product instanceof CreditCard);
  fillSelect($('#credit-card-select'), creditCards.map(card => [card.productNumber, `${card.productNumber} · Disponible ${currency.format(card.creditLimit - card.currentDebt)}`]), 'Selecciona una tarjeta');
  if (ownAccounts.some(account => account.productNumber === selectedAccount)) $('#account-select').value = selectedAccount;
  if (ownAccounts.some(account => account.productNumber === selectedTransferSource)) $('#transfer-source').value = selectedTransferSource;
  if (creditCards.some(card => card.productNumber === selectedCreditCard)) $('#credit-card-select').value = selectedCreditCard;
  fillCustomerManager();
  renderDestinations();
  renderMovements();
  calculateLoan();
}

function renderDestinations() {
  const sourceNumber = $('#transfer-source')?.value;
  const selectedDestination = $('#transfer-destination')?.value;
  const choices = getAllAccounts()
    .filter(({ product }) => product.productNumber !== sourceNumber)
    .map(({ customer, product }) => [product.productNumber, `${customer.fullName} · ${describeProduct(product)} · ${product.productNumber}`]);
  fillSelect($('#transfer-destination'), choices, 'Selecciona cuenta destino');
  if (choices.some(([productNumber]) => productNumber === selectedDestination)) {
    $('#transfer-destination').value = selectedDestination;
  }
}

function fillCustomerManager() {
  const customers = bank.getAllCustomers();
  const selectedUsername = $('#managed-customer').value;
  fillSelect($('#managed-customer'), customers.map(customer => [customer.username, `${customer.fullName} (${customer.username})`]), 'Selecciona cliente');
  if (customers.some(customer => customer.username === selectedUsername)) $('#managed-customer').value = selectedUsername;
  const rows = $('#customer-table-body');
  if (!rows) return;
  rows.replaceChildren();
  for (const customer of customers) {
    const row = document.createElement('tr');
    for (const text of [customer.fullName, customer.identification, customer.phone, customer.username]) {
      const cell = document.createElement('td');
      cell.textContent = text;
      row.append(cell);
    }
    rows.append(row);
  }
}

function renderMovements() {
  const customer = getCurrentCustomer();
  const body = $('#movements-body');
  if (!customer || !body) return;
  const movements = customer.getProducts().flatMap(product => product.getHistory().map(transaction => ({
    transaction,
    product
  }))).sort((first, second) => second.transaction.dateTime - first.transaction.dateTime);
  body.replaceChildren();
  if (movements.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 4;
    cell.textContent = 'Aún no tienes movimientos. Realiza una operación para verla aquí.';
    row.append(cell);
    body.append(row);
    return;
  }
  for (const { transaction, product } of movements) {
    const row = document.createElement('tr');
    const dateCell = document.createElement('td');
    dateCell.textContent = new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short' }).format(transaction.dateTime);
    const detailCell = document.createElement('td');
    const movementNames = {
      CONSIGNMENT: 'Consignación',
      INTEREST: 'Interés aplicado',
      WITHDRAWAL: 'Retiro',
      TRANSFER_OUT: 'Transferencia enviada',
      TRANSFER_IN: 'Transferencia recibida',
      PURCHASE: 'Compra con tarjeta'
    };
    detailCell.textContent = movementNames[transaction.type] ?? transaction.type;
    const productCell = document.createElement('td');
    productCell.textContent = product.productNumber;
    const amountCell = document.createElement('td');
    amountCell.textContent = currency.format(transaction.value);
    row.append(dateCell, detailCell, productCell, amountCell);
    body.append(row);
  }
}

function requirePositiveAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Ingresa un monto mayor que cero.');
  return amount;
}

function setFormFeedback(message, type = 'error') {
  const feedback = $('#auth-feedback');
  feedback.textContent = message;
  feedback.className = `form-feedback is-${type}`;
}

function finishLogin() {
  $('#login-attempts').textContent = '';
  $('#login-form').reset();
  $('#registration-form').reset();
  closeAuth();
  renderDashboard();
  if (getCurrentCustomer()?.role === 'admin') {
    $('#access-role').value = bank.findCustomer($('#access-customer').value)?.role ?? 'admin';
  }
  $('#welcome-message').focus();
  showToast('Ingresaste al entorno de demostración.');
}

function calculateLoan() {
  const amountInput = $('#credit-amount');
  const termInput = $('#credit-term');
  if (!amountInput || !termInput) return;
  const amount = Number(amountInput.value);
  const months = Number(termInput.value);
  const annualRate = 0.24;
  const monthlyRate = Math.pow(1 + annualRate, 1 / 12) - 1;
  const monthlyPayment = amount * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
  const total = monthlyPayment * months;
  $('#amount-val').textContent = currency.format(amount);
  $('#term-val').textContent = String(months);
  $('#monthly-fee').textContent = currency.format(monthlyPayment);
  $('#total-payment').textContent = currency.format(total);
  $('#total-interest').textContent = currency.format(total - amount);
}

function closeDashboard() {
  bank.logout();
  $('#dashboard').hidden = true;
  $('#public-content').hidden = false;
  $('#login-modal').hidden = true;
  $('#open-login-btn').focus();
}

async function resetLocalDemoData() {
  if (!window.confirm('¿Borrar todas las cuentas y movimientos guardados en este navegador?')) return;
  try {
    localBankStorage.clear();
    bank.clearCustomers();
    productSequence = 1;
    persistenceError = null;
    $('#dashboard').hidden = true;
    $('#public-content').hidden = false;
    $('#login-modal').hidden = true;
    document.body.classList.remove('dialog-open');
    $('#open-login-btn').focus();
    showToast('Se borraron los datos locales de esta demo.');
  } catch (error) {
    showToast(`No se pudieron borrar los datos: ${error.message}`, 'error');
  }
}

$('#open-login-btn').addEventListener('click', () => openAuth('login'));
$('#open-register-btn').addEventListener('click', () => openAuth('register'));
$('#open-register-simulator').addEventListener('click', () => openAuth('register'));
$('[data-open-auth="register"]').addEventListener('click', () => openAuth('register'));
$$('.product-cta').forEach(button => button.addEventListener('click', () => openAuth('register')));
$('#close-login-btn').addEventListener('click', closeAuth);
$('#show-login').addEventListener('click', () => setAuthMode('login'));
$('#show-register').addEventListener('click', () => setAuthMode('register'));
$('#admin-bootstrap-btn').addEventListener('click', () => {
  if (bank.getCustomers().some(customer => customer.role === 'admin')) {
    return showToast('Ya existe un administrador configurado.', 'error');
  }
  setAuthMode('admin-setup');
});
$('#login-modal').addEventListener('click', event => {
  if (event.target === $('#login-modal')) closeAuth();
});

$('#registration-form').addEventListener('submit', async event => {
  event.preventDefault();
  await storageReady;
  const identification = $('#register-identification').value.trim();
  const fullName = $('#register-name').value.trim();
  const phone = $('#register-phone').value.trim();
  const username = $('#register-username').value.trim();
  const password = $('#register-password').value;
  const confirmation = $('#register-confirm-password').value;
  if (password.length < 6) return setFormFeedback('La clave debe tener al menos 6 caracteres.');
  if (password !== confirmation) return setFormFeedback('Las claves no coinciden.');
  try {
    const hasAuthenticatedCustomer = Boolean(getCurrentCustomer());
    if (registrationMode === 'admin-create' && !getCurrentCustomer()?.hasPermission('manage-users')) {
      throw new Error('Only an administrator can create another administrator.');
    }
    if (registrationMode === 'admin-setup' && bank.getCustomers().some(item => item.role === 'admin')) {
      throw new Error('An administrator account is already configured.');
    }
    const customer = new Customer(identification, fullName, phone, username, password, registrationRole);
    if (registrationRole === 'customer') createProducts(customer);
    bank.registerCustomer(customer, { allowAdministratorBootstrap: registrationMode === 'admin-setup' });
    await persistBankState();
    syncAdminBootstrapButton();
    if (hasAuthenticatedCustomer) {
      closeAuth();
      renderDashboard();
      showToast(registrationRole === 'admin' ? 'Administrador guardado localmente.' : 'Cliente guardado localmente.');
    } else {
      await bank.authenticate(username, password);
      await persistBankState();
      finishLogin();
    }
  } catch (error) {
    setFormFeedback(error.message);
  }
});

$('#login-form').addEventListener('submit', async event => {
  event.preventDefault();
  await storageReady;
  const username = $('#username').value.trim().toLowerCase();
  const customer = bank.findCustomer(username);
  try {
    const authenticated = await bank.authenticate(username, $('#password').value);
    await persistBankState();
    if (!authenticated) {
      const attempts = customer?.getFailedAttempts() ?? 0;
      $('#login-attempts').textContent = customer?.isLocked()
        ? 'La cuenta quedó bloqueada después de tres intentos fallidos.'
        : `Intentos fallidos: ${attempts} de 3.`;
      return setFormFeedback('Usuario o clave incorrectos. Revisa los datos e inténtalo de nuevo.');
    }
    finishLogin();
  } catch (error) {
    try { await persistBankState(); } catch (saveError) { persistenceError = saveError; }
    $('#login-attempts').textContent = customer ? `Intentos fallidos: ${customer.getFailedAttempts()} de 3.` : '';
    setFormFeedback(error.message === 'Account is locked after three failed attempts.'
      ? 'La cuenta está bloqueada después de tres intentos fallidos.'
      : error.message === 'Customer not found.'
        ? 'No encontramos ese usuario. Verifica la información ingresada.'
        : error.message);
  }
});

$('#logout-btn').addEventListener('click', closeDashboard);

$$('[data-dashboard-target]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  if (!getCurrentCustomer()) {
    openAuth('login');
    return;
  }
  $('#public-content').hidden = true;
  $('#dashboard').hidden = false;
  document.getElementById(link.dataset.dashboardTarget).scrollIntoView({ behavior: 'smooth' });
}));

$('#deposit-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const account = findAccount($('#account-select').value);
    if (!account || !getCurrentCustomer().getProducts().includes(account)) throw new Error('Selecciona una cuenta propia.');
    bank.deposit(account, requirePositiveAmount($('#deposit-amount').value));
    await persistBankState();
    form.reset();
    renderDashboard();
    showToast('Consignación de ejemplo realizada.');
  } catch (error) { showToast(error.message, 'error'); }
});

$('#withdraw-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const account = findAccount($('#account-select').value);
    if (!account || !getCurrentCustomer().getProducts().includes(account)) throw new Error('Selecciona una cuenta propia.');
    bank.withdraw(account, requirePositiveAmount($('#withdraw-amount').value));
    await persistBankState();
    form.reset();
    renderDashboard();
    showToast('Retiro de ejemplo realizado.');
  } catch (error) { showToast(error.message, 'error'); }
});

$('#transfer-source').addEventListener('change', renderDestinations);
$('#transfer-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const source = findAccount($('#transfer-source').value);
    const destination = findAccount($('#transfer-destination').value);
    if (!source || !destination) throw new Error('Selecciona las cuentas de origen y destino.');
    bank.transfer(source, destination, requirePositiveAmount($('#transfer-amount').value));
    await persistBankState();
    form.reset();
    renderDashboard();
    showToast('Transferencia de ejemplo realizada.');
  } catch (error) { showToast(error.message, 'error'); }
});

$('#card-purchase-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  try {
    const card = getCurrentCustomer().getProducts().find(product => product.productNumber === $('#credit-card-select').value);
    if (!(card instanceof CreditCard)) throw new Error('Selecciona una tarjeta de crédito.');
    const result = bank.makeCardPurchase(card, requirePositiveAmount($('#purchase-amount').value), Number($('#installments').value));
    await persistBankState();
    $('#purchase-result').textContent = `Cuota mensual estimada: ${currency.format(result.monthlyPayment)}. Tasa mensual: ${(result.rate * 100).toLocaleString('es-CO')}%.`;
    form.reset();
    renderDashboard();
    showToast('Compra de ejemplo registrada.');
  } catch (error) { showToast(error.message, 'error'); }
});

$('#profile-form').addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const customer = getCurrentCustomer();
    bank.editCustomer(customer.username, {
      identification: $('#profile-identification').value,
      fullName: $('#profile-name').value,
      phone: $('#profile-phone').value,
      username: $('#profile-username').value
    });
    await persistBankState();
    renderDashboard();
    showToast('Perfil guardado localmente.');
  } catch (error) { showToast(error.message, 'error'); }
});

$('#password-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const customer = getCurrentCustomer();
  if ($('#password-username').value.trim().toLowerCase() !== customer.username) {
    return showToast('El usuario ingresado no coincide con la sesión.', 'error');
  }
  const currentPassword = $('#current-password').value;
  const newPassword = $('#new-password').value;
  if (newPassword !== $('#confirm-new-password').value) return showToast('Las claves nuevas no coinciden.', 'error');
  try {
    await customer.changePassword(currentPassword, newPassword);
    await persistBankState();
    form.reset();
    showToast('Clave actualizada y protegida en el almacenamiento local.');
  } catch (error) { showToast(error.message, 'error'); }
});

$('#managed-customer').addEventListener('change', () => {
  const customer = bank.findCustomer($('#managed-customer').value);
  if (!customer) return;
  $('#managed-identification').value = customer.identification;
  $('#managed-name').value = customer.fullName;
  $('#managed-phone').value = customer.phone;
  $('#managed-username').value = customer.username;
});

$('#add-customer-btn').addEventListener('click', () => openAuth('register'));

$('#customer-edit-form').addEventListener('submit', async event => {
  event.preventDefault();
  try {
    bank.editCustomer($('#managed-customer').value, {
      identification: $('#managed-identification').value,
      fullName: $('#managed-name').value,
      phone: $('#managed-phone').value,
      username: $('#managed-username').value
    });
    await persistBankState();
    renderDashboard();
    showToast('Datos del cliente actualizados.');
  } catch (error) { showToast(error.message, 'error'); }
});

$('#delete-customer-btn').addEventListener('click', async () => {
  const username = $('#managed-customer').value;
  if (!username) return showToast('Selecciona un cliente para eliminar.', 'error');
  const customer = bank.findCustomer(username);
  if (!window.confirm(`¿Eliminar a ${customer.fullName} de esta sesión de demostración?`)) return;
  const deletingCurrentUser = customer === getCurrentCustomer();
  bank.deleteCustomer(username);
  try {
    await persistBankState();
  } catch (error) {
    showToast(`No se pudieron guardar los cambios: ${error.message}`, 'error');
    return;
  }
  if (deletingCurrentUser) closeDashboard();
  else renderDashboard();
  showToast('Cliente eliminado del almacenamiento local.');
});

$('#add-admin-btn').addEventListener('click', () => {
  if (!getCurrentCustomer()?.hasPermission('manage-users')) return showToast('No tienes permiso para administrar usuarios.', 'error');
  openAuth('admin-create');
});

$('#access-customer').addEventListener('change', syncAccessForm);
$('#access-role').addEventListener('change', () => {
  const isAdmin = $('#access-role').value === 'admin';
  $$('.permission-list input[type="checkbox"]').forEach(input => {
    input.checked = isAdmin || input.value === 'view-own' || input.checked;
    input.disabled = isAdmin || input.value === 'view-own';
  });
  $('#access-form').classList.toggle('is-admin-selected', isAdmin);
});

$('#access-form').addEventListener('submit', async event => {
  event.preventDefault();
  try {
    const permissions = $$('.permission-list input[type="checkbox"]:checked').map(input => input.value);
    bank.assignCustomerAccess($('#access-customer').value, $('#access-role').value, permissions);
    await persistBankState();
    renderDashboard();
    showToast('Rol y permisos guardados localmente.');
  } catch (error) { showToast(error.message, 'error'); }
});

$('#reset-demo-btn').addEventListener('click', resetLocalDemoData);
$('#reset-storage-btn').addEventListener('click', resetLocalDemoData);

for (const input of [$('#credit-amount'), $('#credit-term')]) input.addEventListener('input', calculateLoan);

$$('.accordion-btn').forEach(button => {
  button.addEventListener('click', () => {
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    const isOpen = button.getAttribute('aria-expanded') === 'true';
    $$('.accordion-btn').forEach(other => {
      other.setAttribute('aria-expanded', 'false');
      other.querySelector('span').textContent = '+';
      document.getElementById(other.getAttribute('aria-controls')).hidden = true;
    });
    if (!isOpen) {
      button.setAttribute('aria-expanded', 'true');
      button.querySelector('span').textContent = '−';
      panel.hidden = false;
    }
  });
});

$('#chat-assistant-btn').addEventListener('click', () => {
  const panel = $('#chat-panel');
  panel.hidden = !panel.hidden;
  $('#chat-assistant-btn').setAttribute('aria-expanded', String(!panel.hidden));
});
$('#close-chat-btn').addEventListener('click', () => {
  $('#chat-panel').hidden = true;
  $('#chat-assistant-btn').setAttribute('aria-expanded', 'false');
  $('#chat-assistant-btn').focus();
});
$$('[data-chat-action]').forEach(button => button.addEventListener('click', () => {
  $('#chat-panel').hidden = true;
  if (button.dataset.chatAction === 'register') openAuth('register');
  else if (button.dataset.chatAction === 'login') openAuth('login');
  else document.getElementById(button.dataset.chatAction)?.scrollIntoView({ behavior: 'smooth' });
}));

$('#mobile-menu-toggle').addEventListener('click', () => {
  const navigation = $('#primary-nav');
  const isOpen = navigation.classList.toggle('is-open');
  $('#mobile-menu-toggle').setAttribute('aria-expanded', String(isOpen));
});

$('#login-modal').addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const focusable = $$('button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]', $('#login-modal'))
    .filter(element => !element.hidden && element.offsetParent !== null);
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !$('#login-modal').hidden) closeAuth();
  if (event.key === 'Escape' && !$('#chat-panel').hidden) {
    $('#chat-panel').hidden = true;
    $('#chat-assistant-btn').focus();
  }
});

calculateLoan();