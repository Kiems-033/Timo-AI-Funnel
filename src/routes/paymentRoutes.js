const express = require('express');
const router = express.Router();
const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');

// Debug endpoint for checking customer information
router.get('/debug/:phoneNumber', async (req, res) => {
  try {
    const phoneNumber = req.params.phoneNumber;
    logger.info(`Debugging customer with phone number: ${phoneNumber}`);
    
    await paymentService.debugStripeCustomer(phoneNumber);
    
    // Also check subscription directly
    const isSubscribed = await paymentService.checkStripeSubscription(phoneNumber);
    
    res.json({
      success: true,
      message: 'Debug information logged',
      isSubscribed
    });
  } catch (error) {
    logger.error(`Error debugging customer: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 