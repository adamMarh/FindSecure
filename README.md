# FindSecure

Modern web application to help users create secure inquiries and find matching opportunities with strong privacy & security focus.

## Overview

FindSecure lets users submit inquiries that are matched intelligently with relevant results or partners — all while prioritizing data security, user privacy, and clean matching logic.

The application combines:

- A modern React + TypeScript + Tailwind frontend
- Supabase for authentication, PostgreSQL database, storage and edge functions
- Custom server-side matching logic

## Features

- Secure user authentication & session management (Supabase Auth)
- Inquiry creation and submission
- Automatic intelligent matching of inquiries (via edge function)
- Clean, responsive UI with shadcn/ui components
- Type-safe Supabase client & strong TypeScript usage throughout
- Database schema migrations
- Basic testing setup (Vitest)

## Tech Stack

| Layer          | Technologies                              |
|----------------|-------------------------------------------|
| Frontend       | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend / DB   | Supabase (Auth + PostgreSQL + Edge Functions) |
| Styling        | Tailwind CSS + PostCSS                    |
| Testing        | Vitest                                    |
| Linting/Formatting | ESLint + Prettier                     |
| Package Manager| npm / bun                                 |

## Prerequisites

- Node.js ≥ 18
- npm
- Supabase account & project

## Quick Start (Local Development)

1. Clone the repository

2. Install dependencies
```bash
#npm
npm install
```

3. Create .env file
```code
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

5. Start development server
```bash
#npm
npm run dev
```


## Supabase Setup (must do once)

1. Create Supabase project

2. Enable Email authentication

3. Apply migrations
```bash
# Recommended: use Supabase CLI
supabase login
supabase link --project-ref your-project-ref
supabase migration up
```

4. Deploy the matching edge function
```bash
supabase functions deploy match-inquiry
```

5. (Recommended) Enable Row Level Security (RLS) on relevant tables

## Available Scripts

```bash
npm run dev      # start dev server
npm run build    # build for production
npm run preview  # preview production build
npm run test     # run tests with Vitest
npm run lint     # run ESLint
```

## Project Structure (important folders)
```text
FindSecure/
├── public/                     # static files
├── src/
│   ├── components/             # shadcn + custom UI components
│   ├── hooks/                  # custom React hooks
│   ├── integrations/
│   │   └── supabase/           # client, types, queries
│   ├── lib/                    # utilities
│   ├── pages/                  # main views / routes
│   ├── test/                   # test helpers
│   ├── types/                  # global types
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── functions/
│   │   └── match-inquiry/      # core matching logic (Deno)
│   ├── migrations/             # SQL schema + RLS
│   └── config.toml
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```
## Contributing

1. Fork & create branch:
```bash
git checkout -b feature/your-feature
```

2. Commit:
```bash
git commit -m "Add your feature"
```

3. Push & open Pull Request

Please run npm run lint before submitting.
```bash
git clone https://github.com/adamMarh/FindSecure.git
cd FindSecure
