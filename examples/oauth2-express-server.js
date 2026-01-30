/**
 * Express.js OAuth 2.0 Integration Example
 * 
 * This example shows how to integrate the Vybit OAuth2 SDK 
 * into an Express.js web application, mirroring the exact
 * functionality from the developer portal test buttons.
 */

const express = require('express');
const { VybitOAuth2Client } = require('@vybit/oauth2-sdk');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize OAuth2 client
const oauthClient = new VybitOAuth2Client({
  clientId: process.env.VYBIT_CLIENT_ID || 'your-client-id',
  clientSecret: process.env.VYBIT_CLIENT_SECRET || 'your-client-secret',
  redirectUri: process.env.VYBIT_REDIRECT_URI || 'http://localhost:3000/oauth/callback',
  environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
});

// Store user sessions (use Redis/database in production)
const userSessions = new Map();

// Step 1 & 2: Authorization Request and Grant
app.get('/auth/vybit', (req, res) => {
  const state = 'auth_' + Math.random().toString(36).substring(2, 15);
  
  // Store state for CSRF protection
  req.session = { state };
  userSessions.set(state, { state, timestamp: Date.now() });
  
  const authUrl = oauthClient.getAuthorizationUrl({ state });
  
  console.log('🔐 Redirecting user to Vybit authorization:', authUrl);
  res.redirect(authUrl);
});

// Step 3: Handle OAuth callback and exchange code for token
app.get('/oauth/callback', async (req, res) => {
  const { code, state, error } = req.query;
  
  if (error) {
    console.error('❌ OAuth authorization denied:', error);
    return res.status(400).send('Authorization denied');
  }
  
  if (!code || !state) {
    console.error('❌ Missing code or state parameter');
    return res.status(400).send('Invalid callback parameters');
  }
  
  // Verify state for CSRF protection
  const session = userSessions.get(state);
  if (!session || session.state !== state) {
    console.error('❌ Invalid state parameter - possible CSRF attack');
    return res.status(400).send('Invalid state parameter');
  }
  
  try {
    console.log('🔄 Exchanging authorization code for access token...');
    
    // Step 3: Exchange code for token
    const tokenResponse = await oauthClient.exchangeCodeForToken(code);
    console.log('✅ Access token acquired');
    
    // Store token in session
    session.accessToken = tokenResponse.access_token;
    userSessions.set(state, session);
    
    // Step 4: Verify the token works
    const isValid = await oauthClient.verifyToken(tokenResponse.access_token);
    console.log('✅ Token verification:', isValid ? 'valid' : 'invalid');
    
    res.redirect('/dashboard?session=' + state);
    
  } catch (error) {
    console.error('❌ Token exchange failed:', error.message);
    res.status(500).send('Authentication failed: ' + error.message);
  }
});

// Dashboard page showing user's vybits
app.get('/dashboard', async (req, res) => {
  const sessionId = req.query.session;
  const session = userSessions.get(sessionId);
  
  if (!session || !session.accessToken) {
    return res.redirect('/auth/vybit');
  }
  
  try {
    // Step 5: Get user's vybit list
    const vybits = await oauthClient.getVybitList(session.accessToken);
    console.log('📋 Retrieved', vybits.length, 'vybits for user');
    
    // Simple HTML dashboard
    const vybitOptions = vybits.map(vybit => 
      `<option value="${vybit.triggerKey}">${vybit.name}</option>`
    ).join('');
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Vybit Dashboard</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .form-group { margin: 15px 0; }
          label { display: block; margin-bottom: 5px; font-weight: bold; }
          input, textarea, select { width: 100%; padding: 8px; margin-bottom: 10px; }
          button { background: #007cba; color: white; padding: 10px 20px; border: none; cursor: pointer; }
          button:hover { background: #005a8b; }
          .result { margin-top: 20px; padding: 10px; background: #f0f0f0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>🔔 Vybit Dashboard</h1>
        <p>Successfully authenticated! You can now trigger your vybits.</p>
        
        <form id="triggerForm">
          <div class="form-group">
            <label>Select Vybit:</label>
            <select id="vybitSelect" required>
              <option value="">Choose a vybit...</option>
              ${vybitOptions}
            </select>
          </div>
          
          <h3>Optional Parameters:</h3>
          
          <div class="form-group">
            <label>Message:</label>
            <input type="text" id="message" placeholder="Optional message to display with notification">
          </div>
          
          <div class="form-group">
            <label>Image URL:</label>
            <input type="url" id="imageUrl" placeholder="Optional image URL to attach to notification">
          </div>
          
          <div class="form-group">
            <label>Link URL:</label>
            <input type="url" id="linkUrl" placeholder="Optional redirect URL when notification is tapped">
          </div>
          
          <div class="form-group">
            <label>Log:</label>
            <textarea id="log" rows="3" placeholder="Optional content to append to the Vybit log&#10;(supports HTML links)"></textarea>
          </div>
          
          <button type="submit">🚀 Send Vybit Notification</button>
        </form>
        
        <div id="result" class="result" style="display: none;"></div>
        
        <script>
          document.getElementById('triggerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const triggerKey = document.getElementById('vybitSelect').value;
            if (!triggerKey) {
              alert('Please select a vybit first');
              return;
            }
            
            const payload = {};
            const message = document.getElementById('message').value;
            const imageUrl = document.getElementById('imageUrl').value;
            const linkUrl = document.getElementById('linkUrl').value;
            const log = document.getElementById('log').value;
            
            if (message) payload.message = message;
            if (imageUrl) payload.imageUrl = imageUrl;
            if (linkUrl) payload.linkUrl = linkUrl;
            if (log) payload.log = log;
            
            try {
              const response = await fetch('/api/trigger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId: '${sessionId}',
                  triggerKey,
                  payload
                })
              });

              const result = await response.json();

              // Safe DOM manipulation to prevent XSS
              const resultDiv = document.getElementById('result');
              resultDiv.innerHTML = ''; // Clear previous content

              if (result.success) {
                const heading = document.createElement('h3');
                heading.textContent = '✅ Notification Sent!';
                const pre = document.createElement('pre');
                pre.textContent = JSON.stringify(result.data, null, 2);
                resultDiv.appendChild(heading);
                resultDiv.appendChild(pre);
              } else {
                const heading = document.createElement('h3');
                heading.textContent = '❌ Failed';
                const para = document.createElement('p');
                para.textContent = result.error || 'Unknown error';
                resultDiv.appendChild(heading);
                resultDiv.appendChild(para);
              }

              resultDiv.style.display = 'block';

            } catch (error) {
              // Safe DOM manipulation to prevent XSS
              const resultDiv = document.getElementById('result');
              resultDiv.innerHTML = ''; // Clear previous content

              const heading = document.createElement('h3');
              heading.textContent = '❌ Error';
              const para = document.createElement('p');
              para.textContent = error.message || 'Unknown error';
              resultDiv.appendChild(heading);
              resultDiv.appendChild(para);
              resultDiv.style.display = 'block';
            }
          });
        </script>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('❌ Failed to load dashboard:', error.message);
    res.status(500).send('Failed to load dashboard: ' + error.message);
  }
});

// API endpoint for triggering vybits
app.post('/api/trigger', async (req, res) => {
  const { sessionId, triggerKey, payload } = req.body;
  const session = userSessions.get(sessionId);
  
  if (!session || !session.accessToken) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  
  try {
    console.log('🚀 Triggering vybit:', triggerKey, 'with payload:', payload);
    
    // Step 6: Send vybit notification
    const result = await oauthClient.sendVybitNotification(
      triggerKey, 
      payload, 
      session.accessToken
    );
    
    console.log('✅ Vybit triggered successfully:', result);
    res.json({ success: true, data: result });
    
  } catch (error) {
    console.error('❌ Failed to trigger vybit:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      code: error.code 
    });
  }
});

// Home page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Vybit OAuth2 Demo</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 100px auto; text-align: center; }
        .btn { display: inline-block; padding: 15px 30px; background: #007cba; color: white; text-decoration: none; border-radius: 5px; margin: 20px; }
        .btn:hover { background: #005a8b; }
      </style>
    </head>
    <body>
      <h1>🔔 Vybit OAuth2 Demo</h1>
      <p>This demo shows the complete OAuth 2.0 integration flow from the developer portal.</p>
      <a href="/auth/vybit" class="btn">🔐 Connect with Vybit</a>
      <p><small>You'll be redirected to Vybit to authorize this application</small></p>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('🚀 Vybit OAuth2 demo server running on http://localhost:' + PORT);
  console.log('📖 Visit http://localhost:' + PORT + ' to start the OAuth flow');
  console.log('🔧 Make sure to set your environment variables:');
  console.log('   VYBIT_CLIENT_ID=your-client-id');
  console.log('   VYBIT_CLIENT_SECRET=your-client-secret');
  console.log('   VYBIT_REDIRECT_URI=http://localhost:3000/oauth/callback');
});

module.exports = app;