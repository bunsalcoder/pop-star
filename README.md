# Pop Star Game with API Integration

A vanilla JavaScript game with Vite build tool for environment variable support and API integration.

## Features

- Pop Star game with API integration
- Environment variable support using Vite
- Score and level persistence
- Modern development setup

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp env.example .env
```

Edit the `.env` file with your API configuration:

```env
# API Configuration
VITE_API_BASE_URL=https://your-api-server.com
VITE_API_VERSION=v1
VITE_GAME_ID=pop-star-game

# Game Configuration
VITE_DEFAULT_TARGET_SCORE=2000
VITE_MAX_LEVEL=10
```

### 3. Development

Start the development server:

```bash
npm run dev
```

This will start the development server at `http://localhost:3000`

### 4. Build for Production

Build the project for production:

```bash
npm run build
```

This creates a `dist` folder with optimized files.

### 5. Preview Production Build

Preview the production build:

```bash
npm run preview
```

## API Integration

The game integrates with a backend API for:

- **Score Management**: Save and retrieve high scores
- **Level Progress**: Save and load current level
- **Game State**: Persist game progress

### API Endpoints Expected

The backend should provide these endpoints:

- `POST /api/v1/scores` - Save score
- `GET /api/v1/scores/high?gameId={gameId}` - Get high score
- `POST /api/v1/levels` - Save level
- `GET /api/v1/levels/current?gameId={gameId}` - Get current level

### API Request/Response Format

**Save Score:**
```json
POST /api/v1/scores
{
  "gameId": "pop-star-game",
  "score": 1500,
  "level": 2,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Get High Score:**
```json
GET /api/v1/scores/high?gameId=pop-star-game
Response: { "score": 5000 }
```

**Save Level:**
```json
POST /api/v1/levels
{
  "gameId": "pop-star-game",
  "level": 3,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Get Current Level:**
```json
GET /api/v1/levels/current?gameId=pop-star-game
Response: { "level": 3 }
```

## Project Structure

```
pop-star/
├── index.html          # Main HTML file
├── game.js             # Game logic with API integration
├── api.js              # API service layer
├── config.js           # Configuration using environment variables
├── index.css           # Styles
├── package.json        # Dependencies and scripts
├── vite.config.js      # Vite configuration
├── env.example         # Environment variables template
├── .env                # Environment variables (create this)
├── pic/                # Game images
└── sound/              # Game sounds
```

## Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the frontend code.

### Available Variables

- `VITE_API_BASE_URL`: Base URL for your API server
- `VITE_API_VERSION`: API version (e.g., "v1")
- `VITE_GAME_ID`: Unique identifier for this game
- `VITE_DEFAULT_TARGET_SCORE`: Default target score for level 1
- `VITE_MAX_LEVEL`: Maximum level in the game

## Development Notes

- The game automatically loads saved progress on startup
- Game data is saved when the game ends or level is completed
- API errors are handled gracefully with fallback to default values
- The build process optimizes and bundles all assets

## Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure your API server allows requests from your development domain (`http://localhost:3000`).

### API Connection Issues
Check that your `.env` file has the correct API URL and that the backend server is running.

### Build Issues
Make sure all environment variables are properly set in your `.env` file before building. 