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

// Route to initiate the OAuth flow
router.get('/auth', (req, res) => {
    // Generate the authorization URL for QuickBooks
    const authUri = oauthClient.authorizeUri({
        scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
        state: 'Init' // State to protect against CSRF attacks
    });
    // Redirect user to the QuickBooks authorization page
    res.redirect(authUri);
});

// Callback route for handling the response from QuickBooks
router.get('/callback', async (req, res) => {
    const parseRedirect = req.url;

    try {
        // Create an OAuth token using the callback URL
        const authResponse = await oauthClient.createToken(parseRedirect);
        // Redirect to the payments route after successful authentication
        res.redirect('/quickbooks/accounting');
    } catch (e) {
        console.error('Error', e);
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
            url: `https://quickbooks.api.intuit.com/v3/company/9341453637872618/reports/CustomerSales?customer=customer&start_date=2015-08-01&end_date=2025-01-13&minorversion=73`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${oauthClient.getToken().access_token}`
            }
        });

        // Log the full response (status, headers, body)
        console.log('QuickBooks API Response:', {
            status: response?.status,
            headers: response?.headers,
            body: response?.body
        });

        if (!response || !response.body || !response.body.QueryResponse) {
            console.error('API call failed:', response);
            throw new Error('Failed to fetch payments, empty QueryResponse');
        }

        console.log('QueryResponse:', response.body.QueryResponse);

        res.json(response.body.QueryResponse);

    } catch (e) {
        console.error('Error fetching payments:', e);
        res.status(500).send('Error fetching payments');
    }
});


module.exports = router;