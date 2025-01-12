const express = require('express');
const bodyParser = require('body-parser');
const OAuthClient = require('intuit-oauth');

const app = express();
app.use(bodyParser.json());

// Initialize OAuthClient
const oauthClient = new OAuthClient({
  clientId: 'Enter your clientId', // Replace with your clientId
  clientSecret: 'Enter your clientSecret', // Replace with your clientSecret
  environment: 'sandbox', // Use 'sandbox' or 'production'
  redirectUri: 'Enter your callback URL', // Replace with your redirect URI
  logging: true, // Enable logging for debug purposes
});

// Endpoint to check if the access token is valid
app.get('/is-access-token-valid', (req, res) => {
  if (oauthClient.isAccessTokenValid()) {
    res.json({ message: 'The access token is valid' });
  } else {
    oauthClient
      .refresh()
      .then((authResponse) => {
        res.json({ message: 'Token refreshed', data: authResponse.getJson() });
      })
      .catch((error) => {
        res.status(500).json({
          message: 'Failed to refresh the token',
          error: error.originalMessage,
          intuit_tid: error.intuit_tid,
        });
      });
  }
});

// Endpoint to refresh the access token explicitly
app.post('/refresh-token', (req, res) => {
  oauthClient
    .refresh()
    .then((authResponse) => {
      res.json({ message: 'Token refreshed', data: authResponse.getJson() });
    })
    .catch((error) => {
      res.status(500).json({
        message: 'Failed to refresh the token',
        error: error.originalMessage,
        intuit_tid: error.intuit_tid,
      });
    });
});

// Endpoint to revoke the access token
app.post('/revoke-token', (req, res) => {
  oauthClient
    .revoke()
    .then((authResponse) => {
      res.json({ message: 'Token revoked', data: authResponse.getJson() });
    })
    .catch((error) => {
      res.status(500).json({
        message: 'Failed to revoke the token',
        error: error.originalMessage,
        intuit_tid: error.intuit_tid,
      });
    });
});

// Endpoint to get the current token details
app.get('/get-token', (req, res) => {
  const token = oauthClient.getToken().getToken();
  res.json({ token });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
