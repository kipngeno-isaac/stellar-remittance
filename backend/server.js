// server.js - Backend for Stellar Remittance MVP

// --- Dependencies ---
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const StellarSdk = require("stellar-sdk");

// --- Server Setup ---
const app = express();
const PORT = 3000;
app.use(cors());
app.use(bodyParser.json());

// --- Stellar Configuration ---
// IMPORTANT: This uses the Stellar Testnet.
// const server = new Server('https://horizon-testnet.stellar.org');
// const networkPassphrase = Networks.TESTNET;
const server = new StellarSdk.Horizon.Server(
  "https://horizon-testnet.stellar.org"
);
// NOTE: In a real app, these keys would be stored securely (e.g., environment variables)
// and not hardcoded. These are for demonstration on the testnet ONLY.

// This represents the platform's main account that holds the funds.
const PLATFORM_SECRET_KEY = 'SDG34QNFIZSUU3TKQUUGGYWYEN2XPJOHAY34TZPK2IQ6VMY7BGAMI4GU'; // Secret key for GCN...
const platformKeypair = StellarSdk.Keypair.fromSecret(PLATFORM_SECRET_KEY);
// Public Key: GCNQSHZ2DWLSRT755YJ4LIN7FR3GEQG5G7M4O22CZ5L3VZG2IA5XVO7D

// This represents the Kenyan anchor's account that receives the funds for off-ramping.
const ANCHOR_PUBLIC_KEY = 'GDCBIBKKOXOQ537LMUEDHWTWVKVZTUKLCR5KFIFKMXNXSD4ST7MHS5GD';

// --- In-Memory Database (for MVP) ---
// This simulates a user database for the proof of concept.
let users = [];

// --- API Endpoints (based on user stories) ---

/**
 * Epic 1: Sender Account and Verification
 * Story 1 & 3: Basic Registration & Simplified KYC
 */
app.post('/register', (req, res) => {
    const { email, password, fullName, country } = req.body;
    if (!email || !password || !fullName || !country) {
        return res.status(400).json({ message: "All fields are required." });
    }
    if (users.find(user => user.email === email)) {
        return res.status(400).json({ message: "User with this email already exists." });
    }
    const newUser = { email, password, fullName, country, verified: true };
    users.push(newUser);
    console.log("New user registered:", newUser);
    res.status(201).json({ message: "Registration successful. You can now log in." });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        if (user.verified) {
            res.status(200).json({ message: "Login successful.", user: { email: user.email, fullName: user.fullName } });
        } else {
            res.status(403).json({ message: "Account not verified." });
        }
    } else {
        res.status(401).json({ message: "Invalid credentials." });
    }
});


app.post('/transactions', async (req, res) => {
    const { sendAmountUsd, recipientMpesa, recipientName } = req.body;

    if (!sendAmountUsd || !recipientMpesa || !recipientName) {
        return res.status(400).json({ message: "Missing transaction details." });
    }

    console.log(`Initiating transaction: ${sendAmountUsd} USD to ${recipientName} at ${recipientMpesa}`);

    try {
        const sourceAccount = await server.loadAccount(platformKeypair.publicKey());
        const amountToSend = (parseFloat(sendAmountUsd) / 50).toFixed(7).toString();

        // CORRECTED: Use the destructured components
        const transaction = new TransactionBuilder(sourceAccount, {
            fee: BASE_FEE,
            networkPassphrase,
        })
        .addOperation(Operation.payment({
            destination: ANCHOR_PUBLIC_KEY,
            asset: Asset.native(),
            amount: amountToSend,
        }))
        .addMemo(Memo.text(`To:${recipientMpesa}`))
        .setTimeout(30)
        .build();

        transaction.sign(platformKeypair);

        console.log("Submitting transaction to Stellar network...");
        const result = await server.submitTransaction(transaction);
        console.log("Stellar transaction successful!", result.hash);

        const kshAmount = parseFloat(sendAmountUsd) * 125.50;
        console.log("--------------------------------------------------");
        console.log("✅ PAYOUT NOTIFICATION FOR ADMIN ✅");
        console.log(`Please send ${kshAmount.toFixed(2)} KES to M-Pesa number: ${recipientMpesa}`);
        console.log("--------------------------------------------------");

        res.status(200).json({
            message: "Transaction sent successfully!",
            transactionHash: result.hash
        });

    } catch (error) {
        console.error("Stellar transaction failed:", error);
        res.status(500).json({ message: "Transaction failed. See backend console for details." });
    }
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log("Make sure to fund the platform account on the Stellar testnet if it's new.");
    console.log(`Platform Public Key: ${platformKeypair.publicKey()}`);
});
