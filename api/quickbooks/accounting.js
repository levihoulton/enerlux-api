// Load environment variables from .env file
require('dotenv').config();
const express = require('express');
const OAuthClient = require('intuit-oauth');
const { insertPaymentsToDatabase, getLatestPaymentsFromDatabase } = require('../../utils/payments');

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
    try {
        // Get the latest payment update time from the database
        const latestUpdateTime = await getLatestPaymentsFromDatabase();

        let startPosition = 1; // Starting position for pagination
        const pageSize = 100; // QuickBooks API fetches 100 records at a time
        let allPayments = [];

        // Loop to handle pagination and fetch payments in chunks
        while (true) {
            const query = 
                "select * from Payment "+
                "Where Metadata.LastUpdatedTime > '" +latestUpdateTime +
                "' Order By Metadata.LastUpdatedTime DESC " +
                "STARTPOSITION " +startPosition + " MAXRESULTS " + pageSize
            // const query = "select * from Payment Where Metadata.LastUpdatedTime> '2015-01-16'"

            const response = await oauthClient.makeApiCall({
                url: `${baseURL}/v3/company/${companyID}/query?query=${encodeURIComponent(query)}`,
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const parsedResponse = response.data ? JSON.parse(response.data) : null;

            if (parsedResponse && parsedResponse.status !== 200) {
                console.error('Failed to fetch data:', parsedResponse.statusText);
                return res.status(400).json({ error: 'Failed to fetch data', details: parsedResponse.statusText });
            }

            const payments = response?.json?.QueryResponse?.Payment || [];

            if (payments.length === 0) {
                break; // Exit loop if no more payments to fetch
            }

            const paymentObjects = payments.map((payment, index) => {
                // Find the OrderNumber dynamically by filtering based on the scope
                const orderNumber = payment.Line?.[0]?.LineEx?.any?.find(
                  (item) => item.scope === "javax.xml.bind.JAXBElement$GlobalScope" && item.value?.Name === "txnReferenceNumber"
                )?.value?.Value || null;
            
                // Only return the payment if the orderNumber is found
                if (!orderNumber) {
                  return null; // Return null if OrderNumber is not found
                }
            
                return {
                  index: index,
                  PaymentKey: payment.Id,
                  OrderNumber: orderNumber,
                  CustomerRef: payment.CustomerRef?.name || null,
                  PaymentDate: payment.TxnDate || null,
                  PaymentAmount: parseFloat(payment.TotalAmt) || 0,
                  PaymentNote: payment.PrivateNote || '',
                  LastUpdatedTime: payment.MetaData?.LastUpdatedTime || null
                };
              })
              .filter(payment => payment !== null);  // Filter out null entries
            
            console.log(paymentObjects);

            allPayments = allPayments.concat(paymentObjects);

            // Increment startPosition for the next page of results
            startPosition += pageSize;
        }

        // Insert all fetched payments into the database
        await insertPaymentsToDatabase(allPayments);

        res.status(200).json({ message: 'Payments successfully imported into the database.' });
    } catch (e) {
        console.error('Error in payments API call or database operation:', e);
        res.status(500).json({ error: 'Error processing payments', details: e.message });
    }
});

module.exports = router;