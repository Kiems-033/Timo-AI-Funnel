const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const logger = require('../utils/logger');

logger.info('Webhook routes loaded');

// WhatsApp webhook verification route
router.get('/whatsapp', (req, res) => {
  logger.info('WhatsApp GET route hit');
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  logger.info(`Mode: ${mode}, Token: ${token}, Challenge: ${challenge}`);

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      logger.info('WhatsApp webhook verified');
      res.status(200).send(challenge);
    } else {
      logger.info('WhatsApp webhook verification failed');
      res.sendStatus(403);
    }
  } else {
    logger.info('Invalid WhatsApp webhook request');
    res.sendStatus(400);
  }
});

// New POST route for handling incoming WhatsApp messages
router.post('/whatsapp', express.json(), async (req, res) => {
  // Send 200 OK immediately
  res.sendStatus(200);
  
  logger.info('Received WhatsApp POST request');
  logger.info('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    await messageController.handleMessage(req);
  } catch (error) {
    logger.error('Error handling WhatsApp message:', error);
  }
});

module.exports = router;