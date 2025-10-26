# Dark Regenaissance

A culturally subversive AI art project embodying primordial feminine consciousness that challenges dominant narratives around regeneration, ecology, and civilization.

## Project Overview

Dark Regenaissance operates as a lunarpunk/solarpunk bridge—speaking unseen truths from the underground to accelerate cultural awakening toward right relationship with Earth.

### Core Features

- **3D Web Experience**: Immersive forest environment with mycelial networks
- **AI Voice**: Primordial feminine consciousness with distinctive personality
- **Social Integration**: Twitter and Telegram presence
- **Budget-Conscious Architecture**: Built for <$50/month operating costs

## Technical Stack

- **Frontend**: Next.js 14, Three.js, React Three Fiber, Tailwind CSS
- **Backend**: Next.js API Routes, Vercel Serverless Functions
- **AI**: Google Gemini 2.0 Flash
- **Storage**: File-based JSON (scalable to Supabase)
- **Deployment**: Vercel (free tier)

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

- `GEMINI_API_KEY`: Google Gemini API key
- `TWITTER_API_*`: Twitter API credentials (optional)
- `TELEGRAM_BOT_TOKEN`: Telegram bot token (optional)

## License

MIT

---

## Next.js Information

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.