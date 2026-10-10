# CIVIC-AI — CivicAI Issue Reporting Platform

Hackathon prototype. Not affiliated with any government body or Microsoft. No government integration exists.

## Project Setup

### Requirements

* Node.js 18+
* MongoDB local installation or MongoDB Atlas

### Backend Setup

1. Open the project folder in a terminal.
2. Navigate to the backend directory:

   ```bash
   cd backend
   npm install
   ```
3. Create a `.env` file using `.env.example` as a reference.
4. Configure `PORT`, `MONGO_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `.env`.
5. Optionally configure `AI_API_KEY` and `AI_MODEL` for AI-powered analysis.
6. Start the backend:

   ```bash
   npm run dev
   ```

Check the backend health endpoint at `GET /api/health`.

### Demo Analysis

AI analysis requires a configured API key. If no key is configured, use Demo Analysis Mode if supported by the client.

Supported demo scenarios: `pothole`, `garbage`, `streetlight`, and `water`.

### API Endpoints

* `POST /api/auth/login`
* `POST /api/issues/analyze`
* `GET /api/issues/nearby?lat&lng&category`
* `POST /api/issues`
* `GET /api/issues`
* `GET /api/issues/:id`
* `PATCH /api/issues/:id`
* `PATCH /api/issues/:id/status`
* `GET /api/issues/:id/duplicates`
* `PATCH /api/duplicates/:id`
* `POST /api/issues/:id/support`
* `GET /api/map/issues`
* `GET /api/analytics`
* `GET /api/health`

Citizens can report issues anonymously. Admin access uses JWT authentication.

## Duplicate Issue Detection

Open issues in the same category within 150 metres are treated as potentially related. Image similarity is not computed. An administrator must confirm duplicate grouping.

## Known Limitations

* AI analysis depends on API configuration.
* Duplicate detection uses a heuristic.
* MongoDB and external AI integration require configuration.
* The project is a hackathon prototype and is not an official government service.

## Security

Keep secrets and credentials in `.env`. Never commit `.env` or expose API keys in the repository.
