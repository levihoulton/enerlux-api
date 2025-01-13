// Load environment variables from .env file
require('dotenv').config();
const express = require('express');
const OAuthClient = require('intuit-oauth');

const router = express.Router();
const baseURL = (process.env.ENVIRONMENT === 'sandbox' ? 'https://sandbox-quickbooks.api.intuit.com' : 'https://quickbooks.api.intuit.com');
const companyID = (process.env.ENVIRONMENT === 'sandbox' ? '9341453637872618' : '123145770036639')

// Configure the OAuthClient with credentials and environment
const oauthClient = new OAuthClient({
    clientId: process.env.CLIENT_ID, // QuickBooks OAuth2 Client ID
    clientSecret: process.env.CLIENT_SECRET, // QuickBooks OAuth2 Client Secret
    environment: process.env.ENVIRONMENT, // 'sandbox' or 'production'
    redirectUri: process.env.REDIRECT_URL // Redirect URI for OAuth callbacks
});

// Route to initiate the OAuth flow
router.get('/auth', (req, res) => {
    console.log("starting auth")
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
    console.log("callback received")
    const parseRedirect = req.url;

    try {
        // Create an OAuth token using the callback URL
        const authResponse = await oauthClient.createToken(parseRedirect);
        // Redirect to the payments route after successful authentication
        console.log("making payments call")
        res.redirect('/quickbooks/payments');
    } catch (e) {
        console.error('Error', e);
    }
});

router.get('/payments', async (req, res) => {
    console.log(baseURL + companyID)
    console.log("making fetch to get payments")
    try {
        const response = await oauthClient.makeApiCall({
            url: baseURL + `/v3/company/` + companyID + `/query?query=select * from Payment&minorversion=40`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        // Send the fetched data as JSON response
        console.log(response?.response)
        res.json(JSON.parse(response?.response));
    } catch (e) {
        console.error(e);
        res.json(JSON.parse(e));
    }
});


module.exports = router;