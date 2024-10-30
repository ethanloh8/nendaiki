import express from 'express';
import cors from 'cors';
import session from 'express-session';
import keytar from 'keytar';

const app = express();
const port = 8000;
const client_id = 18725;

app.use(cors());
app.use(express.json()); // Make sure to parse JSON

// Configure session middleware with secure settings
app.use(session({
  secret: 'your_secret_key',  // Replace this with an environment variable in production
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',  // Only secure cookies in production
    httpOnly: true,
    maxAge: 31536000
  }
}));

// Endpoint to handle AniList OAuth callback
app.get('/anilist', async (req, res) => {
  try {
    // This endpoint may not be necessary anymore unless you want to handle specific logic
    console.log(req)
    // const hash = window.location.hash.substring(1);
    return res.status(200).json({ success: 'Redirected to OAuth' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Endpoint to save access token
app.post('/auth-anilist', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is missing' });
  }

  try {
    req.session.token = token;
    await keytar.setPassword('anilist', 'oauth_token', token);

    return res.status(200).json({ success: 'Token saved successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});


// Route to get stored token if it exists
app.get('/get-token', async (req, res) => {
  if (req.session.token) {
    return res.status(200).json({ token: req.session.token });
  }

  // Try retrieving from keytar if the session token doesn't exist
  const storedToken = await keytar.getPassword('anilist', 'oauth_token');
  if (storedToken) {
    req.session.token = storedToken;  // Restore to session if found
    return res.status(200).json({ token: storedToken });
  }

  return res.status(401).json({ error: 'No token found. Please log in.' });
});

// Logout route to clear token
app.post('/logout', async (req, res) => {
  // Clear token from session and keytar
  req.session.destroy();
  await keytar.deletePassword('anilist', 'oauth_token');
  res.status(200).json({ success: 'Logged out successfully' });
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    error: 'Not Found',
  });
});

// Start server
app.listen(port, '127.0.0.1', () => {
  console.log('Auth server listening on port %d in %s mode', port, app.settings.env);
});
