NOTE: Do **NOT** edit this repo. **Click on "Use this Template >> Create a new repository"**


# WhatsApp AI SaaS

🚀 **First Step: Configure Your Bot**
1. Open `src/config/botConfig.js`
2. Update the following settings:
   - AI model configuration (model name, temperature, system prompt)
   - Subscription messages and limits
   - Blocked country codes (if needed)
   - WhatsApp settings
   - Other customization options (see Customization section below)

💎 **Need a Landing Page?**
Use this [free SaaS landing page template](https://webflow.com/made-in-webflow/website/Saas-Landing-page-cloneable-Firefly) to create a beautiful, responsive website in minutes!


### Full YouTube Tutorial here: https://youtu.be/Xr9WUrIAATw?si=KiRMD66SAjvsyube

LET'S SHIP 🚀🚀

### A universal template for creating your own monetizable WhatsApp AI chatbot.
This template provides everything you need to start your AI SaaS business with WhatsApp integration, subscription management, and usage tracking.

## How to fix number on "pending" in Meta

Watch this video for help: https://www.youtube.com/watch?v=62NfZaoZV-g

## How to get new WhatsApp Business number

Get WhatsApp Business number: https://yourbusinessnumber.com/?via=f57391

## Create a Railway account here

Deploy your project on Railway: https://railway.com/?referralCode=5K64n5

## Get My SaaS Marketing Notion Sheet below

SaaS Marketing Notion Sheet: https://www.timonikolai.com/saas-marketing

## Stripe Number Formatter Zapier Template(if users enter their number in a wrong format in the Stripe checkout)
I recommend setting up this simple Zap that checks a users phone number and corrects if necessary.
Of course you can also code this yourself, if you don't want to use Zapier.

- This Zap immedtiately checks the number format of the WhatsApp number entered in Stripe
- https://zapier.com/shared/9891f44aac90c1892d2776b9e0b1100e9383e10c

## Features

- Ready-to-use WhatsApp integration
- GPT-4 powered responses
- Voice message transcription
- Image analysis capability
- Built-in subscription system
- Smart traffic handling
- Usage tracking and limits
- Country blocking capability
- Comprehensive error handling and logging

## Prerequisites

- Node.js >= 18.0.0
- Supabase account (for database)
- OpenAI API key
- WhatsApp Business API access
- Stripe account (for payments)

## Setup

### Just watch this complete Tutorial: https://youtu.be/Xr9WUrIAATw?si=KiRMD66SAjvsyube


1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```
Then edit `.env` with your credentials:

Required variables:
- `OPENAI_API_KEY`: Your OpenAI API key
- `WHATSAPP_ACCESS_TOKEN`: WhatsApp Cloud API access token
- `WHATSAPP_PHONE_NUMBER_ID`: Your WhatsApp phone number ID
- `WHATSAPP_VERIFY_TOKEN`: Custom token for webhook verification
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase anon key
- `STRIPE_SECRET_KEY`: Your Stripe secret key

Optional variables:
- `BLOCKED_COUNTRY_CODES`: Comma-separated list of phone number country codes to block (e.g., "91,92,880")

3. Start the server:
```bash
npm start
```

For development:
```bash
npm run dev
```

## Monetization Features

- Free tier with message limit (default: 10 messages)
- Premium subscription handling via Stripe
- Usage tracking per user
- Automatic subscription status checks
- Payment webhook integration
- Stripe pricing table integration (Embed your pricing table URL in botConfig.js subscription message)

💡: Create a Stripe pricing table and embed it in your landing page. When users exceed their message limit, they'll be directed to a professional pricing page where they can easily upgrade their subscription.

## Stripe
- Make sure you enable "phone number required" in the stripe payment link or pricing table. Like this you will identify if a user is subsrcibed.

## API Endpoints

- `POST /webhook`: WhatsApp webhook endpoint
- `GET /webhook`: WhatsApp webhook verification endpoint

## Customization

All bot settings can be configured in `src/config/botConfig.js`:

### AI Settings
- Model name and parameters
- System prompt and personality
- Image and audio analysis settings
- Context message limit

### Subscription Settings
- Free message limit
- Subscription messages
- Payment link


### Access Control
- Blocked country codes
- Block messages

### WhatsApp Settings
- Rate limiting
- Message expiry
- Retry attempts
- API endpoints

Example customization:

## License

This project is licensed under the ISC License.

## Support

For support, please open an issue in the GitHub repository.
