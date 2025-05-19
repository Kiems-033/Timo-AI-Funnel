const whatsapp = require('../services/whatsappService');
const { generateResponse } = require('../ai/model');
const databaseService = require('../services/databaseService');
const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');
const { isBlockedCountry } = require('../utils/countryBlocker');
const { transcribeAudio } = require('../services/transcriptionService');
const { downloadImageFromWhatsApp } = require('../services/imageService');
const { handleMessage: queueHandler } = require('../services/queueService');
const botConfig = require('../config/botConfig');

const SUBSCRTIPTION_MESSAGE = "You're out of messages. Click here to upgrade and receive unlimited messages!🙏 https://plantvisionai.com/subscribe";
const ERROR_MESSAGE = "I apologixe, but I'm having trouble processing your message right now. Please try again in a moment.🙏";

async function handleMessage(req) {
  try {
    logger.info('Processing incoming message:', req.body);
    
    // Extract the message data
    const data = req.body;
    if (!data.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      logger.info('No message in webhook payload');
      return;
    }

    const message = data.entry[0].changes[0].value.messages[0];
    const from = message.from;
    
    // Check for blocked country
    if (isBlockedCountry(from)) {
      logger.info(`Blocked message from country: ${from}`);
      await whatsapp.sendText(from, botConfig.access.blockedCountries.message);
      return;
    }

    let messageContent = '';
    let messageType = message.type;
    let messageForAI = '';

    if (messageType === 'text') {
      messageContent = message.text.body;
      messageForAI = [{ type: "text", text: messageContent }];
      logger.info(`Prepared text message: ${messageContent}`);
    } else if (messageType === 'audio') {
      const mediaId = message.audio.id;
      messageContent = await transcribeAudio(mediaId);
      messageForAI = [{ type: "text", text: messageContent }];
      logger.info(`Transcribed audio message: ${messageContent}`);
    } else if (messageType === 'image') {
      const imageUrl = await downloadImageFromWhatsApp(message.image.id);
      const caption = message.image.caption || '';
      messageContent = caption ? `Image with caption: ${caption}` : "Image sent by user";
      
      const promptTemplate = caption 
        ? botConfig.ai.prompts.image.withCaption(caption)
        : botConfig.ai.prompts.image.withoutCaption;
        
      messageForAI = [
        { 
          type: "text", 
          text: promptTemplate.replace('{context}', botConfig.ai.prompts.defaultContext)
        },
        {
          type: "image_url",
          image_url: { url: imageUrl }
        }
      ];
      logger.info(`Prepared image message with caption: ${caption}`);
    } else {
      logger.info(`Unsupported message type: ${messageType}`);
      await whatsapp.sendText(from, botConfig.errors.unsupportedType);
      return;
    }

    // Pass all handlers to the queue service
    const handlers = {
      checkSubscription: paymentService.checkStripeSubscription,
      findOrCreateUser: databaseService.findOrCreateUser,
      updateSubscription: databaseService.updateSubscription,
      incrementMessageCount: databaseService.incrementMessageCount,
      getConversationContext: databaseService.getConversationContext,
      generateAIResponse: generateResponse,
      sendWhatsAppMessage: whatsapp.sendText,
      saveMessage: databaseService.saveMessage
    };

    logger.info(`Processing message from ${from} with type ${messageType}`);

    // Let the queue service handle the message
    const result = await queueHandler({
      message: {
        messageContent,
        messageForAI
      },
      from,
      messageType,
      handlers
    });

    logger.info(`Message processed with status: ${result.status}`);
    return result;

  } catch (error) {
    logger.error(`Error processing message: ${error.message}`);
    logger.error(error.stack);
    if (from) {
      try {
        await whatsapp.sendText(from, botConfig.errors.general);
      } catch (sendError) {
        logger.error(`Failed to send error message: ${sendError.message}`);
      }
    }
  }
}

module.exports = { handleMessage };
