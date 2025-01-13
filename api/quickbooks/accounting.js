// Load environment variables from .env file
require('dotenv').config();
const express = require('express');
const OAuthClient = require('intuit-oauth');

const router = express.Router();

// Configure the OAuthClient with credentials and environment
const oauthClient = new OAuthClient({
    clientId: process.env.CLIENT_ID, // QuickBooks OAuth2 Client ID
    clientSecret: process.env.CLIENT_SECRET, // QuickBooks OAuth2 Client Secret
    environment: 'production', // 'sandbox' or 'production'
    redirectUri: process.env.REDIRECT_URL // Redirect URI for OAuth callbacks
});

router.get('/auth', (req, res) => {
    const authUri = oauthClient.authorizeUri({
        scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
        state: 'CSRF_12345' // Dynamically generate or securely define this
    });
    res.redirect(authUri);
});


router.get('/callback', async (req, res) => {
    try {
        if (req.query.state !== 'CSRF_12345') {
            throw new Error('Invalid state parameter');
        }

        const authResponse = await oauthClient.createToken(req.originalUrl);

        // Persist the token for future API calls
        const tokenData = authResponse.getJson();
        console.log('OAuth Token:', tokenData);
        // Save tokenData securely here

        res.redirect('/quickbooks/accounting');
    } catch (e) {
        console.error('Authentication error:', e);
        res.status(500).send('Authentication failed');
    }
});


router.get('/accounting', async (req, res) => {
    console.log("Querying payments...");
    try {
        // Ensure token is valid before making API call
        if (!oauthClient.isAccessTokenValid()) {
            throw new Error('OAuth token expired or invalid');
        }

        const response = await oauthClient.makeApiCall({
            url: `https://quickbooks.api.intuit.com/v3/company/123145770036639/query?query=select * from Payment&minorversion=73`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${oauthClient.getToken().access_token}`
            }
        });

        console.log('QuickBooks API Response:', {
            status: response.status,
            headers: response.headers,
            body: response.body
        });

        if (!response || !response.body) {
            console.error('API call failed:', response);
            throw new Error('Failed to fetch payments, empty response body');
        }
    } catch (e) {
        console.error('Error fetching payments:', e);
        res.status(500).send('Error fetching payments');
    }
});



module.exports = router;