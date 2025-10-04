# Feeling Machines - Setup Guide

## Phase 1 Implementation Complete! 🎉

All the code is in place. Here's how to get it running:

## Prerequisites

- Node.js 18+ installed
- OpenAI API key (get one at https://platform.openai.com/api-keys)
- Convex account (sign up at https://convex.dev)

## Setup Steps

### 1. Install dependencies (already done)
```bash
npm install
```

### 2. Set up Convex

Run Convex in development mode - this will prompt you to log in and create a project:

```bash
npx convex dev
```

This will:
- Ask you to log in to Convex (or create an account)
- Create a new Convex project
- Auto-generate `.env.local` with `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL`
- Watch for changes and sync your functions

### 3. Add your OpenAI API key

Edit `.env.local` (created by Convex) and add:

```bash
OPENAI_API_KEY=sk-your-key-here
```

### 4. Set the OpenAI key in Convex environment

Convex functions need access to your OpenAI key:

```bash
npx convex env set OPENAI_API_KEY sk-your-key-here
```

### 5. Start the Next.js dev server

In a new terminal window:

```bash
npm run dev
```

### 6. Open your browser

Navigate to http://localhost:3000

Click "Generate new artwork" to create your first AI artist statement + image!

## Project Structure

```
feeling-machines/
├── app/                    # Next.js app
│   ├── page.tsx           # Gallery UI
│   ├── layout.tsx         # Root layout with providers
│   ├── providers.tsx      # Convex provider setup
│   └── globals.css        # Tailwind styles
├── convex/                # Convex backend
│   ├── schema.ts          # Database schema (Phase 2 ready)
│   ├── generate.ts        # Main generation mutation
│   ├── runs.ts            # Query for listing runs
│   ├── prompts.ts         # V2_NEUTRAL prompt constant
│   └── artists.ts         # Artist/Brush registries
└── docs/                  # Documentation
    ├── phase1.md          # This phase
    └── phase2.md          # Next phase (multi-Artist)
```

## How It Works

1. **Click "Generate"** → Calls `api.generate.generate()` mutation
2. **Artist step** → GPT-4o-mini creates an artist statement + image prompt
3. **Brush step** → DALL-E 3 generates the image from that prompt
4. **Storage** → Run saved to Convex with all metadata
5. **Display** → Gallery auto-updates with the new artwork

## Troubleshooting

### "Cannot find module '@/convex/_generated/api'"

Run `npx convex dev` first - it generates the API types.

### "process.env.OPENAI_API_KEY is undefined"

Make sure you've set it in both:
- `.env.local` (for local Next.js)
- Convex environment (`npx convex env set OPENAI_API_KEY ...`)

### Image generation fails

Check that you're using the correct model name. The code uses `dall-e-3` - verify this is correct in OpenAI's current API docs.

## Next Steps

Once Phase 1 is working:
- See `docs/phase2.md` for adding multiple Artists
- The schema already supports run groups and metadata for Phase 2
- Just add more entries to `convex/artists.ts` and loop over them!

## Deployment

### Deploy Convex

```bash
npx convex deploy
```

### Deploy Next.js (Vercel)

```bash
npx vercel
```

Make sure to:
1. Link your Convex deployment in Vercel dashboard
2. Add `OPENAI_API_KEY` to Vercel environment variables

That's it! Phase 1 complete. 🚀
