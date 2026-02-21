# AgriSmart

Climate-smart agriculture web app with:
- Live weather insights
- Crop recommendations
- Crop problem solver
- Daily farm planner
- Admin data management

## Tech Stack
- React + TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query

## Local Setup
```bash
npm install
npm run dev
```

## Optional AI Photo Diagnosis Setup
Create a `.env` file in project root:

```bash
VITE_OPENAI_API_KEY=your_openai_api_key
# Optional (default shown)
VITE_OPENAI_VISION_MODEL=gpt-4.1-mini
VITE_OPENAI_BASE_URL=https://api.openai.com/v1
```

If API key is missing/unavailable, the app automatically uses local image heuristics as fallback.
For strict crop detection from photo (for example cotton image should not return rice issues), keep `VITE_OPENAI_API_KEY` configured.

## Build
```bash
npm run build
npm run preview
```

## Test
```bash
npm run test
```
