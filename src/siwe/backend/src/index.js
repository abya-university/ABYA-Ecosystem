// backend/src/index.js
import cors from 'cors';
import express from 'express';
import Session from 'express-session';
import { generateNonce, SiweMessage } from 'siwe';

const app = express(); // Create an Express application.
app.use(express.json()); // Middleware to parse JSON request bodies.
app.use(cors({ // Configure CORS to allow requests from the specified origin with credentials.
    origin: 'http://localhost:8080',
    credentials: true, // Allow credentials (e.g., cookies, authorization headers).
}))

// Configure the session middleware to manage user sessions.
app.use(Session({
    name: 'siwe-quickstart', // Name of the session cookie.
    secret: "siwe-quickstart-secret", // Secret key to sign the session ID.
    resave: true, // Force the session to be saved back to the store even if it wasn't modified.
    saveUninitialized: true, // Save uninitialized sessions (new but not modified).
    cookie: { secure: false, sameSite: true } // Cookie settings (not secure for local development).
}));

// Endpoint to generate a nonce for SIWE authentication.
app.get('/nonce', async function (req, res) {
    req.session.nonce = generateNonce(); // Generate a new nonce and store it in the session.
    res.setHeader('Content-Type', 'text/plain'); // Set response content type to plain text.
    res.status(200).send(req.session.nonce); // Send the nonce to the client.
});

// Endpoint to verify the SIWE message and signature.
app.post('/verify', async function (req, res) {
    try {
        if (!req.body.message) {
            // Return error if the message is missing from the request body.
            res.status(422).json({ message: 'Expected prepareMessage object as body.' });
            return;
        }

        // Create a SiweMessage object from the received message.
        let SIWEObject = new SiweMessage(req.body.message);

        // Verify the SIWE message using the signature and nonce from the session.
        const { data: message } = await SIWEObject.verify({ signature: req.body.signature, nonce: req.session.nonce }); 

        req.session.siwe = message; // Save the verified message in the session.
        req.session.cookie.expires = new Date(message.expirationTime); // Set the session cookie expiration to the message's expiration time.
        req.session.save(() => res.status(200).send(true)); // Save the session and send a success response.
    } catch (e) {
        // Handle errors during verification.
        req.session.siwe = null; // Clear the SIWE message from the session.
        req.session.nonce = null; // Clear the nonce from the session.
        console.error(e); // Log the error for debugging.

        // Respond with appropriate status and message based on the error type.
        switch (e) {
            case ErrorTypes.EXPIRED_MESSAGE: {
                req.session.save(() => res.status(440).json({ message: e.message }));
                break;
            }
            case ErrorTypes.INVALID_SIGNATURE: {
                req.session.save(() => res.status(422).json({ message: e.message }));
                break;
            }
            default: {
                req.session.save(() => res.status(500).json({ message: e.message }));
                break;
            }
        }
    }
});

// Endpoint to access personal information of the authenticated user.
app.get('/personal_information', function (req, res) {
    if (!req.session.siwe) {
        res.status(401).json({ message: 'You have to first sign_in' }); // Return error if the user is not authenticated.
        return;
    }

    // Log authentication success and respond with user information.
    console.log("User is authenticated!");
    res.setHeader('Content-Type', 'text/plain'); // Set response content type to plain text.
    res.send(`You are authenticated and your address is: ${req.session.siwe.address}`);
});

// Start the server on port 3000.
app.listen(3000);
