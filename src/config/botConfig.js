const botConfig = {
  /*=============================
    AI MODEL CONFIGURATION
  ==============================*/
  ai: {
    // Core model settings
    model: {
      name: "gpt-4o-mini",          // OpenAI model to use
      temperature: 0.2,             // Lower = more focused, Higher = more creative
      maxTokens: 2000,              // Maximum length of response
      systemPrompt: `Your name is Megan. Give helpful and concise answers and sound like a human.`,
      audioTranscriptionModel: "whisper-1"  // Model for voice messages
    },

    // Message prompts and templates
    prompts: {
      // Image analysis prompts
      image: {
        withCaption: (caption) => 
          `Please analyze this image and its caption: "${caption}" in {context}.`,
        withoutCaption: 
          "Please analyze this image in {context}.",
        defaultContext: "no specific context"  // Bot's context setting
      },

      // Audio-related messages
      audio: {
        transcriptionError: 
          "Sorry, I had trouble understanding your voice message. Could you please try sending it again or type your message?"
      }
    },

    contextMessageLimit: 10  // Number of previous messages to maintain context
  },

  /*=============================
    SUBSCRIPTION SETTINGS
  ==============================*/
  subscription: {
    messages: {
      expired: 
        "You're out of wishes. Click here to upgrade and receive unlimited wishes every day 🙏 www.askjinni.ai/subscribe"
    },
    limits: {
      freeMessages: 10  // Messages allowed before requiring subscription
    }
  },

  /*=============================
    ERROR MESSAGES
  ==============================*/
  errors: {
    general: 
      "I apologize, but I'm having trouble processing your message right now. Please try again in a moment. 🙏",
    unsupportedType: 
      "I'm sorry, I can only process text, audio, and image messages at the moment. 🙏"
  },

  /*=============================
    ACCESS CONTROL
  ==============================*/
  access: {
    blockedCountries: {
      codes: ["91", "92", "880"],  // CHANGE THIS: Array of country codes to block
      message: 
        "Hi there, we are sorry but this service is not available in your country."
    }
  },

  /*=============================
    WHATSAPP SETTINGS
  ==============================*/
  whatsapp: {
    supportedTypes: ["text", "audio", "image"],
    messageExpiry: 5 * 60 * 1000,  // 5 minutes in milliseconds
    rateLimit: {
      window: 1000,    // 1 second
      threshold: 50    // Max requests per window before queuing
    },
    endpoints: {
      mediaUrl: "https://graph.facebook.com/v20.0"
    },
    retryAttempts: 3,
    retryDelay: 1000  // milliseconds between retries
  },

  /*=============================
    DATABASE SETTINGS
  ==============================*/
  database: {
    messageTableName: 'messages',
    userTableName: 'users',
    maxContextMessages: 10
  },

  /*=============================
    FILE HANDLING
  ==============================*/
  files: {
    tempDir: 'temp',
    audioFormat: 'ogg',
    cleanupDelay: 1000  // milliseconds
  }
};

module.exports = botConfig;
