// Import BankingSystem, Customer, SavingsAccount, CheckingAccount, and CreditCard
// Initialize BankingSystem and register/login a Customer
// Create one instance of each product and add them to the Customer
// Test specific rules: deposit in savings, overdraft in checking, purchase in credit card
// Print the Customer's products array to the console

import BankingSystem from './models/BankingSystem.js';
import Customer from './models/Customer.js';
import SavingsAccount from './models/SavingsAccount.js';
import CheckingAccount from './models/CheckingAccount.js';
import CreditCard from './models/CreditCard.js';

const bank = new BankingSystem();
const customer1 = new Customer('123456', 'Juan', '555-0000', 'juanp', 'pass123');

bank.registerUser(customer1);
bank.login('juanp', 'pass123');

const savings = new SavingsAccount('A-001', 500);
const checking = new CheckingAccount('C-001', 1000);
const card = new CreditCard('TC-001', 5000);

customer1.addProduct(savings);
customer1.addProduct(checking);
customer1.addProduct(card);

savings.deposit(1500);
checking.withdraw(1100); 
card.makePurchase(2000, 1);

console.log("All Customer Products:", customer1.getProducts());

// Update customer1 phone number using editProfile
// Print the credit card's monthly fee and rate for 3 installments

customer1.editProfile({ phoneNumber: '555-9999' });

console.log("Customer after updates:", customer1);
console.log("Credit Card Monthly Fee:", card.calculateMonthlyFee());
console.log("Credit Card Rate for 3 installments:", card.calculateRate(3));

if (typeof document !== 'undefined') {
const loginForm = document.querySelector('#login-form');
const loginView = document.querySelector('.login-view');
const dashboardView = document.querySelector('.dashboard-view');
const usernameInput = document.querySelector('#username');
const feedback = document.querySelector('#form-feedback');
const helpDialog = document.querySelector('#help-dialog');
const helpLink = document.querySelector('#help-link');
const closeHelpButtons = document.querySelectorAll('[data-help-close]');

loginForm.addEventListener('submit', (event) => {
	event.preventDefault();

	try {
		bank.login(usernameInput.value.trim(), document.querySelector('#password').value);
		loginView.hidden = true;
		dashboardView.hidden = false;
		dashboardView.querySelector('#dashboard-title').textContent = `Buenos días, ${customer1.getUsername()}.`;
	} catch (error) {
		feedback.textContent = error.message === 'Invalid password'
			? 'La contraseña no es correcta. Revisa tus datos e inténtalo de nuevo.'
			: error.message === 'Account is blocked'
				? 'La cuenta está bloqueada por seguridad.'
				: 'No encontramos ese usuario. Verifica la información ingresada.';
		feedback.classList.add('is-error');
	}
});

const setHelpVisibility = (isVisible) => {
	helpDialog.hidden = !isVisible;
	document.body.classList.toggle('dialog-open', isVisible);

	if (isVisible) {
		helpDialog.querySelector('.close-button').focus();
	} else {
		helpLink.focus();
	}
};

helpLink.addEventListener('click', () => setHelpVisibility(true));
closeHelpButtons.forEach((button) => {
	button.addEventListener('click', () => setHelpVisibility(false));
});

document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && !helpDialog.hidden) {
		setHelpVisibility(false);
	}
});
}