# Vigilans

Vigilans is a modern security and incident management platform built with React, Node.js / Express, and Supabase.

## Project Structure

- `client/` - React frontend powered by Vite, Tailwind CSS, and Lucide icons.
- `server/` - Express.js backend API with real-time WebSocket support and Supabase integration.
- `supabase/` - Database schemas, migrations, and seed scripts.

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### 1. Backend Setup
```bash
cd server
npm install
# Set up environment variables (.env)
npm start
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```

### 3. Database
Run Supabase migrations in `supabase/` or sync with:
```bash
cd server
npm run sync-supabase
```
