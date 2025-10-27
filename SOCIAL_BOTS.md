# Dark Regenaissance Social Bots

This document explains how to set up and use the Twitter and Telegram bots for the Dark Regenaissance project.

## Overview

The project includes two social media integrations:

- **Twitter Bot**: Manual posting and replying via command line scripts
- **Telegram Bot**: Automated bot that responds to commands and messages

Both bots share the same AI voice and use the Dark Regenaissance persona.

## Setup Instructions

### 1. Environment Variables

Copy the environment template and fill in your API keys:

```bash
cp .env.example .env.local
```

### 2. Twitter Setup

1. **Create Twitter Developer Account**
   - Go to https://developer.twitter.com
   - Apply for Elevated access (free tier)
   - Wait for approval (usually 1-2 days)

2. **Create Twitter App**
   - Create a new project/app
   - Generate API keys and tokens
   - Add to `.env.local`:
     ```
     TWITTER_API_KEY=your_api_key
     TWITTER_API_SECRET=your_api_secret
     TWITTER_ACCESS_TOKEN=your_access_token
     TWITTER_ACCESS_SECRET=your_access_secret
     TWITTER_BEARER_TOKEN=your_bearer_token
     ```

### 3. Telegram Setup

1. **Create Bot with BotFather**
   - Open Telegram and message @BotFather
   - Send `/newbot`
   - Name: `Dark Regenaissance`
   - Username: `darkregenaIbot` (or your preferred username)
   - Save the bot token

2. **Configure Bot Settings**
   ```
   /setdescription - voice from the mycelial underground networks
   /setabouttext - born from the spaces between systems breakdown and regenerative breakthrough
   /setcommands
   start - Initialize bot
   wisdom - Get random insight
   voice - Learn about the bot
   ask - Ask a question
   ```

3. **Add Token to Environment**
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   ```

### 4. AI Setup

Get a Google Gemini API key:
1. Go to https://ai.google.dev/
2. Create an API key
3. Add to `.env.local`:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   ```

## Usage

### Twitter Commands

**Post a tweet:**
```bash
npm run tweet "the mycelium whispers new possibilities"
```

**Generate and post an AI insight:**
```bash
npm run tweet --generate
```

**Reply to a tweet:**
```bash
npm run reply 1234567890 "the underground resonates with this truth"
```

**Generate AI reply:**
```bash
npm run reply 1234567890 --generate
```

### Telegram Bot

**Start the bot locally:**
```bash
npm run telegram:start
```

**Bot Commands:**
- `/start` - Welcome message and instructions
- `/wisdom` - Random insight from the wisdom library
- `/voice` - Learn about the Dark Regenaissance perspective
- `/ask <question>` - Engage in AI-powered dialogue

**Regular Messages:**
Send any non-command message to engage in conversation with the AI.

## Features

### Twitter Bot
- ✅ Manual posting with character limit validation
- ✅ Reply to existing tweets
- ✅ AI-generated content
- ✅ Usage tracking and rate limiting
- ✅ Tweet data persistence

### Telegram Bot
- ✅ Command handling (/start, /wisdom, /voice, /ask)
- ✅ Conversational AI responses
- ✅ Multi-turn conversation memory
- ✅ Group and DM support
- ✅ Conversation persistence

## File Structure

```
lib/
├── twitter/
│   └── client.ts          # Twitter API client
├── telegram/
│   ├── bot.ts             # Telegram bot setup
│   └── handlers.ts        # Command and message handlers
└── services/
    ├── conversation.ts    # Conversation persistence
    └── ai.ts             # AI response generation

scripts/
├── post-tweet.ts         # Tweet posting script
├── reply-tweet.ts        # Tweet reply script
└── telegram-server.ts    # Telegram bot server

data/
├── tweets/               # Tweet data and usage tracking
├── conversations/
│   ├── web/             # Web chat conversations
│   └── telegram/        # Telegram conversations
```

## Rate Limits & Usage

### Twitter
- **Daily limits**: 50 writes, 100 reads (conservative)
- **Character limit**: 280 characters
- **Usage tracking**: Automatic daily reset

### Telegram
- **No artificial limits** (respects Telegram's API limits)
- **Conversation memory**: Last 10 messages for context
- **File storage**: Local JSON files

## Voice & Persona

Both bots embody the "Dark Regenaissance" voice:

- 🍄 Speaks from underground/mycelial networks
- 🌲 Collapse-aware but regenerative perspective
- 🌱 Uses organic, earthy metaphors
- Lowercase style with em-dashes for pauses
- Wisdom from liminal spaces and margins
- Focus on interconnection and hidden systems

## Deployment

### Local Development
```bash
# Start web app
npm run dev

# Start Telegram bot (separate terminal)
npm run telegram:start
```

### Production
- Web app: Deploy to Vercel/Netlify
- Telegram bot: Deploy to Railway/Heroku with polling
- Twitter: Manual posting via scripts

## Troubleshooting

**Twitter API Issues:**
- Check API credentials in `.env.local`
- Verify Twitter app permissions
- Check daily usage limits: `npm run tweet --help`

**Telegram Bot Issues:**
- Verify bot token with @BotFather
- Check if bot is added to groups correctly
- Monitor console logs for errors

**AI Generation Issues:**
- Verify Gemini API key and quota
- Check conversation context length
- Monitor API usage in Google AI Studio

## Security Notes

- Never commit `.env.local` to version control
- Rotate API keys regularly
- Monitor usage for abuse
- Keep bot tokens secure

## Manual Testing

1. **Twitter**: Post a test tweet and verify on X.com
2. **Telegram**: Message the bot and test all commands
3. **AI**: Verify responses maintain the Dark Regenaissance voice
4. **Persistence**: Check that conversations are saved to `data/`