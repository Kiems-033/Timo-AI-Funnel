const logger = require('../utils/logger');
const botConfig = require('../config/botConfig');

// Track request rate
let requestCount = 0;
const RATE_LIMIT_WINDOW = botConfig.whatsapp.rateLimit.window;
const RATE_LIMIT_THRESHOLD = botConfig.whatsapp.rateLimit.threshold;
const delayedMessages = [];
let processingDelayed = false;

setInterval(() => { 
  requestCount = 0;
  if (delayedMessages.length > 0 && !processingDelayed) {
    processDelayedMessages();
  }
}, RATE_LIMIT_WINDOW);

async function processMessageDirectly(messageData) {
  const { message, from, messageType, handlers } = messageData;
  const {
    checkSubscription,
    findOrCreateUser,
    updateSubscription,
    incrementMessageCount,
    getConversationContext,
    generateAIResponse,
    sendWhatsAppMessage,
    saveMessage
  } = handlers;

  try {
    // Check subscription and user status first
    const [isSubscribed, user] = await Promise.all([
      checkSubscription(from),
      findOrCreateUser(from)
    ]);

    // Update subscription status if needed
    if (isSubscribed !== user.is_subscribed) {
      await updateSubscription(from, isSubscribed);
    }

    // Get message count and check limits
    const messageCount = await incrementMessageCount(from);
    
    const isTester = ['31612345678', '31636505705', '31681883910'].includes(from);

// If user has exceeded free messages and is not subscribed, send subscription message and return
    if (messageCount <= 10 || isSubscribed) {
      const subscriptionMessage = botConfig.subscription.messages.expired;
      await sendWhatsAppMessage(from, subscriptionMessage);
      return { status: 'subscription_required', message: subscriptionMessage };
    }

    // Process the message normally for subscribed users or users within free limit
    const contextMessages = await getConversationContext(from);
    const context = contextMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    const prompt = messageType === 'image' ? message.messageForAI : 
      [{ type: "text", text: `Previous conversation:\n${context}\n\nUser: ${message.messageContent}\nAssistant:` }];

    const aiResponse = await generateAIResponse(prompt);
    await Promise.all([
      sendWhatsAppMessage(from, aiResponse),
      saveMessage(from, message.messageContent, aiResponse)
    ]);
    
    return { status: 'success', message: aiResponse };
  } catch (error) {
    logger.error(`Error in direct processing: ${error.message}`);
    throw error;
  }
}

async function processDelayedMessages() {
  if (delayedMessages.length === 0) return;
  
  processingDelayed = true;
  logger.info(`Processing ${delayedMessages.length} delayed messages`);

  try {
    while (delayedMessages.length > 0) {
      const messageData = delayedMessages.shift();
      await processMessageDirectly(messageData);
      // Add a small delay between processing messages
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error) {
    logger.error('Error processing delayed messages:', error);
  } finally {
    processingDelayed = false;
  }
}

async function handleMessage(messageData) {
  try {
    requestCount++;
    
    if (requestCount > RATE_LIMIT_THRESHOLD) {
      logger.info(`High traffic detected (${requestCount} req/s). Delaying message processing.`);
      delayedMessages.push(messageData);
      return { delayed: true };
    } else {
      logger.info('Processing message directly.');
      return await processMessageDirectly(messageData);
    }
  } catch (error) {
    logger.error('Error handling message:', error);
    throw error;
  }
}

module.exports = { handleMessage }; 
