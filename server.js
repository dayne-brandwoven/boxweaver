const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Serve static files from build directory
app.use(express.static(path.join(__dirname, 'build')));

// Login endpoint
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Hardcoded credentials for testing
  const validUsername = 'team123';
  const validPassword = 'password123';

  console.log('Login attempt:', {
    username,
    password: password ? '[HIDDEN]' : undefined
  });

  if (username === validUsername && password === validPassword) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Serve React app for all other routes (Express 5 compatible)
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
