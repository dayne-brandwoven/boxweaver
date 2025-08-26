
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'build')));

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  const validUsername = process.env.LOGIN_USERNAME;
  const validPassword = process.env.LOGIN_PASSWORD;

  console.log('Login attempt:', { username, hasValidUsername: !!validUsername, hasValidPassword: !!validPassword });

  if (username === validUsername && password === validPassword) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
