# Tally

Tally is a self financial control app.

## Development Setup

### Prerequisites
- Node.js (v18 or higher)
- Backend API running on `http://localhost:3000`

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```
For local development, leave `VITE_API_URL` empty - the app will use Vite's proxy to connect to `localhost:3000`.

4. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### API Configuration

**Local Development:**
- Leave `VITE_API_URL` empty in your `.env` file
- The Vite dev server will proxy all `/api/*` requests to `http://localhost:3000`
- This avoids CORS issues during development

**Production/Remote Backend:**
- Set `VITE_API_URL` to your backend URL (e.g., `https://your-api.example.com`)
- The app will make direct requests to that URL

## Build

```bash
npm run build
```

## Linting

```bash
npm run lint
```
