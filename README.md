# RCE Frontend

Rules Configuration Engine - Frontend Application (TypeScript + React)

This is the standalone frontend application, separated from the monorepo. It connects to a separate backend API server.

Built with TypeScript for enhanced type safety and developer experience.

## Prerequisites

- Node.js 18+ and npm
- Backend API server running (separate repository)

## Environment Setup

1. Copy the environment example file:
```bash
cp .env.example .env
```

2. Update the `.env` file with your backend API URL:
```
VITE_API_URL=http://localhost:8080
```

For production, set this to your backend server URL (e.g., `https://api.yourdomain.com`)

## Development

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## TypeScript Type Checking

Run TypeScript type checking without emitting files:
```bash
npm run type-check
```

This is useful for checking types before committing or in CI/CD pipelines.

## Production Build

Build the application (includes TypeScript compilation):
```bash
npm run build
```

The production-ready files will be in the `dist` folder.

Preview the production build locally:
```bash
npm run preview
```

## Docker Deployment

### Development Mode

Build and run the development container:
```bash
docker build -f Dockerfile.dev -t rce-frontend:dev .
docker run -p 3000:3000 -v $(pwd):/app -v /app/node_modules rce-frontend:dev
```

### Production Mode

Build the production image:
```bash
docker build -t rce-frontend:prod .
```

Run the container:
```bash
docker run -p 80:80 -e BACKEND_URL=http://your-backend-url:8080 rce-frontend:prod
```

Note: The BACKEND_URL environment variable is used by nginx to proxy API requests.

## Project Structure

```
rce-frontend/
├── src/
│   ├── api/          # API client configuration
│   ├── components/   # React components
│   ├── pages/        # Page components
│   ├── store/        # State management (Zustand)
│   ├── utils/        # Utility functions (includes subfunctions module)
│   ├── constants/    # Constants and static data (subfunctions data)
│   ├── types/        # TypeScript type definitions
│   ├── lib/          # Library configurations
│   ├── App.tsx       # Main App component
│   ├── main.tsx      # Entry point
│   └── vite-env.d.ts # Vite environment type definitions
├── public/           # Static assets
├── tsconfig.json     # TypeScript configuration
├── tsconfig.app.json # TypeScript app-specific config
├── tsconfig.node.json# TypeScript Node config
├── Dockerfile        # Production Docker image
├── Dockerfile.dev    # Development Docker image
├── nginx.conf        # Nginx configuration for production
└── vite.config.ts    # Vite configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Type check and build for production
- `npm run preview` - Preview production build
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## Tech Stack

- **TypeScript** - Type-safe JavaScript
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Zustand** - State management
- **Ant Design** - UI component library
- **Tailwind CSS** - Utility-first CSS
- **Monaco Editor** - Code editor
- **React Hook Form** - Form management

## API Configuration

The frontend communicates with the backend through the API base URL configured in environment variables.

In development, Vite's proxy (configured in `vite.config.ts`) forwards `/api` requests to the backend.

In production, nginx (configured in `nginx.conf`) handles the API proxy.

## TypeScript Configuration

The project uses three TypeScript configuration files:

- `tsconfig.json` - Base configuration with references
- `tsconfig.app.json` - Configuration for application source code
- `tsconfig.node.json` - Configuration for Node.js scripts (like Vite config)

Type definitions are automatically included for:
- React and React DOM
- Node.js APIs
- Vite environment variables
- React Beautiful DnD

## Subfunctions Module

The project includes a complete subfunctions module for the rules engine with **50 predefined functions** organized by category:

- **String Functions (20)**: Replace All, Substring, Uppercase, Lowercase, Trim, Contains, Length, Pad Left, Pad Right, Regex Replace, Split, Starts With, Ends With, Index Of, Concat, Repeat, Reverse, Match Regex, Capitalize, Remove Whitespace
- **Number Functions (15)**: Add, Subtract, Multiply, Divide, Modulo, Power, Square Root, Absolute, Round, Floor, Ceiling, Max, Min, Random, To Fixed
- **Date Functions (11)**: Add Months, Add Days, Add Years, Format Date, Format Chinese Date, Get Year, Get Month, Get Day, Date Difference, Current Date, Is Valid Date
- **Utility Functions (16)**: Is Empty, Is Null, Is Number, Is String, Is Boolean, To String, To Number, To Boolean, Default Value, Equals, Not Equals, Greater Than, Less Than, AND, OR, NOT

See [SUBFUNCTIONS_USAGE.md](SUBFUNCTIONS_USAGE.md) for detailed documentation and [SUBFUNCTIONS_LIST.md](SUBFUNCTIONS_LIST.md) for complete function list.

Quick example:
```typescript
import { getSubfunctionsByCategory } from '@/utils/subfunctions';

// Get functions grouped by category
const grouped = getSubfunctionsByCategory();
// Returns: { "STR": [...], "NUM": [...], "DATE": [...], "UTIL": [...] }
```

## Notes

- This frontend is designed to work with a separate backend server
- Make sure your backend API is running before starting the frontend (default port: 8080)
- Update CORS settings on your backend to allow requests from the frontend origin
- TypeScript strict mode is enabled for better type safety
- Use `npm run type-check` before commits to catch type errors early
