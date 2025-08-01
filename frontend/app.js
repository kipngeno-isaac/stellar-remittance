// app.js - Frontend Logic for Stellar Remittance MVP

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const API_BASE_URL = 'http://localhost:3000';

    // --- Element Selectors ---
    const authView = document.getElementById('auth-view');
    const appView = document.getElementById('app-view');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const transactionForm = document.getElementById('transaction-form');
    const messageArea = document.getElementById('message-area');

    // --- View Toggles ---
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const registerFormContainer = document.getElementById('register-form-container');
    const loginFormContainer = document.getElementById('login-form-container');

    // --- Event Listeners ---

    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormContainer.classList.add('hidden');
        registerFormContainer.classList.remove('hidden');
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerFormContainer.classList.add('hidden');
        loginFormContainer.classList.remove('hidden');
    });

    // --- UI Logic ---

    // Function to display messages to the user
    const showMessage = (message, isError = false) => {
        messageArea.textContent = message;
        messageArea.className = isError ? 'message-error' : 'message-success';
        setTimeout(() => messageArea.textContent = '', 4000);
    };

    // Function to switch between login/register and the main app
    const showAppView = (user) => {
        authView.classList.add('hidden');
        appView.classList.remove('hidden');
        document.getElementById('welcome-message').textContent = `Welcome, ${user.fullName}!`;
    };

    const showAuthView = () => {
        authView.classList.remove('hidden');
        appView.classList.add('hidden');
        localStorage.removeItem('user');
    };

    // --- User Story Implementations ---

    /**
     * Epic 1: Registration (Story 1 & 3)
     */
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const country = document.getElementById('register-country').value;

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, password, country }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            showMessage(data.message);
            registerForm.reset();
            showLoginLink.click(); // Switch to login view
        } catch (error) {
            showMessage(error.message, true);
        }
    });

    /**
     * Epic 1: Login (Story 2)
     */
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            showMessage(data.message);
            localStorage.setItem('user', JSON.stringify(data.user));
            showAppView(data.user);
        } catch (error) {
            showMessage(error.message, true);
        }
    });

    /**
     * Epic 2: Initiate and Confirm Transaction (Story 4, 5, 6, 7)
     */
    transactionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const sendAmountUsd = document.getElementById('send-amount').value;
        const recipientName = document.getElementById('recipient-name').value;
        const recipientMpesa = document.getElementById('recipient-mpesa').value;
        
        const button = e.target.querySelector('button');
        button.disabled = true;
        button.textContent = 'Sending...';

        try {
            const response = await fetch(`${API_BASE_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sendAmountUsd, recipientName, recipientMpesa }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            showMessage(`Success! Tx Hash: ${data.transactionHash.substring(0, 20)}...`);
            transactionForm.reset();
            document.getElementById('kes-amount').textContent = '0.00 KES';

        } catch (error) {
            showMessage(error.message, true);
        } finally {
            button.disabled = false;
            button.textContent = 'Send Money';
        }
    });

    // Live update for KES amount
    document.getElementById('send-amount').addEventListener('input', (e) => {
        const usdAmount = parseFloat(e.target.value) || 0;
        const kshAmount = (usdAmount * 125.50).toFixed(2);
        document.getElementById('kes-amount').textContent = `${kshAmount} KES`;
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        showAuthView();
    });

    // Check if user is already logged in on page load
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
        showAppView(JSON.parse(loggedInUser));
    }
});
