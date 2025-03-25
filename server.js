require('dotenv').config();
const express = require('express');
const webhookRoutes = require('./src/routes/webhookRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');

const app = express();
const port = process.env.PORT || 3001;

// This line should come before the routes
app.use(express.json());

app.use((req, res, next) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  next();
});

// Use the webhook routes
app.use('/webhooks', webhookRoutes);

// Use payment routes
app.use('/payment', paymentRoutes);

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.use((req, res, next) => {
  console.log(`No route found for ${req.method} ${req.url}`);
  next();
});

app.use((req, res) => {
  console.log(`Unhandled request: ${req.method} ${req.url}`);
  res.status(404).send('Not Found');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});