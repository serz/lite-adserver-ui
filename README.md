# Lite Adserver Dashboard

A modern, responsive dashboard UI for managing the [Lite Adserver platform](https://github.com/serz/lite-adserver). Built with Next.js 14, TypeScript, Tailwind CSS, and shadcn/ui.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Core Modules](#core-modules)
- [API Integration](#api-integration)
- [Authentication](#authentication)
- [State Management](#state-management)
- [Design](#design)
- [Deployment](#deployment)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Overview

Lite Adserver Dashboard is the frontend interface for managing ad campaigns, zones, and viewing statistics for the Lite Adserver platform. It provides a clean, intuitive interface for advertisers and publishers to manage their advertising operations.

### Key Capabilities

- **Campaign Management**: Create, edit, and manage advertising campaigns with advanced targeting rules
- **Zone Management**: Configure ad placement zones with traffic back URLs
- **Statistics Dashboard**: View impressions, clicks, and performance metrics with flexible date ranges
- **Real-time Sync**: Automatic synchronization with the Lite Adserver backend KV storage

## Features

### UI/UX
- **Modern UI**: Clean, responsive interface built with Tailwind CSS and shadcn/ui components
- **Dark/Light Mode**: Theme toggle with system preference detection
- **Mobile Friendly**: Fully responsive design works on all device sizes
- **Loading States**: Skeleton loaders and progress indicators for better UX

### Functionality
- **Campaign CRUD**: Full create, read, update operations for campaigns
- **Targeting Rules**: Configure country, browser, OS, and zone targeting with whitelist/blacklist support
- **Zone Management**: Create and manage ad zones with status toggle
- **Statistics Filtering**: Filter stats by date range, group by date/campaign/zone/country/sub_id
- **Pagination**: Paginated lists for campaigns and zones
- **Real-time Status**: Start/pause campaigns and activate/deactivate zones

### Technical
- **Server Components**: Leverages Next.js App Router and React Server Components
- **Type Safety**: Full TypeScript support with strict typing
- **Caching**: In-memory caching for API responses with configurable TTL
- **Error Handling**: Comprehensive error handling with user-friendly messages

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Lite Adserver Dashboard                       │
│                    (Next.js 14 + React 18)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Pages     │  │ Components  │  │   State Management      │  │
│  │             │  │             │  │                         │  │
│  │ - Dashboard │  │ - Layout    │  │ - Auth Context          │  │
│  │ - Campaigns │  │ - Tables    │  │ - Stats Context         │  │
│  │ - Zones     │  │ - Forms     │  │ - Campaign Context      │  │
│  │ - Stats     │  │ - Dialogs   │  │ - Zone Context          │  │
│  │ - Login     │  │ - UI Kit    │  │ - Stats Page Context    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Services Layer                        │    │
│  │                                                          │    │
│  │  campaigns.ts │ zones.ts │ stats.ts │ sync.ts │ auth.ts │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    API Client (lib/api.ts)               │    │
│  │           Bearer Token Authentication + Caching          │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Lite Adserver Backend                         │
│              (Cloudflare Workers + D1 + KV)                      │
│                  api.affset.com                        │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2.28 | React framework with App Router |
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.3.x | Styling |
| shadcn/ui | Latest | UI component library |
| Radix UI | Various | Accessible UI primitives |
| date-fns | 3.6.x | Date manipulation |
| Zod | 3.24.x | Schema validation |
| React Hook Form | 7.55.x | Form handling |
| Lucide React | 0.309.x | Icons |

### Deployment
| Technology | Purpose |
|------------|---------|
| Cloudflare Workers | Edge runtime for serving the app |
| Cloudflare Pages | Static asset hosting |
| Wrangler | Cloudflare deployment CLI |
| GitHub Actions | CI/CD pipeline |

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Access to a [Lite Adserver](https://github.com/serz/lite-adserver) instance

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/serz/lite-adserver-ui.git
   cd lite-adserver-ui
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open the app**
   
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Configuration

Environment variables are managed in `wrangler.toml` and work automatically for all environments:

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_AD_SERVER_URL` | Backend API URL | `http://localhost:8787` (dev) |
| `NEXT_PUBLIC_TIMEZONE` | Display timezone | `UTC` |

**No `.env.local` file needed!** The configuration is centrally managed in `wrangler.toml`.

## Project Structure

```
lite-adserver-ui/
├── app/                          # Next.js App Router pages
│   ├── dashboard/                # Dashboard pages (protected)
│   │   ├── campaigns/            # Campaign management
│   │   │   ├── create/           # Create new campaign
│   │   │   └── edit/[id]/        # Edit existing campaign
│   │   ├── zones/                # Zone management
│   │   └── stats/                # Statistics page
│   ├── login/                    # Authentication page
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Home page (redirects to dashboard)
│   ├── providers.tsx             # Context providers wrapper
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── date-range-picker.tsx
│   │   └── ...
│   ├── auth-provider.tsx         # Authentication context
│   ├── dashboard-layout.tsx      # Main layout with sidebar
│   ├── stats-table.tsx           # Statistics table component
│   ├── zone-dialog.tsx           # Zone create/edit dialog
│   ├── country-selector.tsx      # Country targeting selector
│   ├── browser-selector.tsx      # Browser targeting selector
│   ├── os-selector.tsx           # OS targeting selector
│   └── zone-selector.tsx         # Zone targeting selector
│
├── lib/                          # Core library code
│   ├── api.ts                    # API client with auth
│   ├── auth.ts                   # Authentication utilities
│   ├── date-utils.ts             # Date formatting utilities
│   ├── timezone.ts               # Timezone utilities
│   ├── utils.ts                  # General utilities
│   ├── context/                  # React contexts
│   │   ├── stats-context.tsx     # Dashboard stats state
│   │   ├── stats-page-context.tsx # Stats page state
│   │   ├── campaign-context.tsx  # Campaign state
│   │   └── zone-context.tsx      # Zone state
│   ├── services/                 # API service modules
│   │   ├── campaigns.ts          # Campaign API operations
│   │   ├── zones.ts              # Zone API operations
│   │   ├── stats.ts              # Statistics API operations
│   │   ├── sync.ts               # KV sync operations
│   │   └── targeting-rule-types.ts
│   └── constants/
│       └── countries.ts          # Country codes list
│
├── types/                        # TypeScript type definitions
│   └── api.ts                    # API response types
│
├── hooks/                        # Custom React hooks
│   └── use-toast.ts              # Toast notification hook
│
├── scripts/                      # Build/deploy scripts
│   └── prepare-cf-deploy.js      # Cloudflare deployment prep
│
├── worker.js                     # Cloudflare Worker entry point
├── wrangler.toml                 # Cloudflare configuration
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
└── tsconfig.json                 # TypeScript configuration
```

## Core Modules

### API Client (`lib/api.ts`)

The API client handles all communication with the Lite Adserver backend:

```typescript
// Create client with API key
const client = new ApiClient({ apiKey: 'your-api-key' });

// Make requests
const campaigns = await client.get<CampaignsResponse>('/api/campaigns');
const newCampaign = await client.post<Campaign>('/api/campaigns', data);
const updated = await client.put<Campaign>('/api/campaigns/1', data);
await client.delete('/api/campaigns/1');
```

**Features:**
- Bearer token authentication
- Automatic timestamp conversion for dates
- Network error handling with descriptive messages
- Request/response logging

### Services Layer

Each service module provides typed functions for API operations with built-in caching:

#### Campaigns Service (`lib/services/campaigns.ts`)
```typescript
getCampaigns(options)           // List campaigns with filtering
getCampaign(id)                 // Get single campaign
createCampaign(data)            // Create new campaign
updateCampaign(id, data)        // Update campaign
getCampaignTargetingRules(id)   // Get targeting rules
```

#### Zones Service (`lib/services/zones.ts`)
```typescript
getZones(options)    // List zones with filtering
getZone(id)          // Get single zone
createZone(data)     // Create new zone
updateZone(id, data) // Update zone
```

#### Stats Service (`lib/services/stats.ts`)
```typescript
getStats(options)            // Get stats with filtering
getStatsForPeriod(options)   // Get stats for date range
getLast7DaysStats()          // Get last 7 days stats
getLast7DaysImpressions()    // Get impression count
getLast7DaysClicks()         // Get click count
getSyncState()               // Get system state (campaign/zone counts)
```

### Authentication (`lib/auth.ts`)

Simple API key-based authentication stored in localStorage:

```typescript
setApiKey(apiKey)   // Store API key
getApiKey()         // Retrieve API key
clearApiKey()       // Remove API key (logout)
isLoggedIn()        // Check authentication status
```

### Type Definitions (`types/api.ts`)

Core TypeScript interfaces:

```typescript
interface Campaign {
  id: number;
  name: string;
  redirect_url: string;
  start_date: number;           // Timestamp in ms
  end_date: number | null;
  status: 'active' | 'paused' | 'completed';
  targeting_rules?: TargetingRule[];
  created_at: number;
  updated_at: number;
}

interface Zone {
  id: number;
  name: string;
  site_url: string;
  traffic_back_url: string;
  status: 'active' | 'inactive';
  created_at: number;
  updated_at: number;
}

interface TargetingRule {
  targeting_rule_type_id: number;
  targeting_method: 'whitelist' | 'blacklist';
  rule: string;  // Comma-separated values
}

interface CampaignStats {
  campaign_id: number;
  impressions: number;
  clicks: number;
  unsold: number;
  fallbacks: number;
}
```

## API Integration

The dashboard communicates with the Lite Adserver backend API. See the [API documentation](https://github.com/serz/lite-adserver/blob/main/docs/api.md) for complete endpoint details.

### Key Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/campaigns` | GET, POST | List/create campaigns |
| `/api/campaigns/:id` | GET, PUT | Get/update campaign |
| `/api/campaigns/:id/targeting_rules` | GET | Get campaign targeting rules |
| `/api/zones` | GET, POST | List/create zones |
| `/api/zones/:id` | GET, PUT | Get/update zone |
| `/api/stats` | GET | Query statistics |
| `/api/sync/state` | GET | Get system state |
| `/api/sync/campaigns/:id` | POST | Sync campaign to KV |
| `/api/sync/zones/:id` | POST | Sync zone to KV |
| `/api/targeting-rule-types` | GET | List targeting rule types |

### Backend Connection

By default, the UI connects to `https://api.affset.com`. For local development, configure `NEXT_PUBLIC_AD_SERVER_URL` in `wrangler.toml` to point to your local backend instance.

## Authentication

The dashboard uses API key-based authentication:

1. **Login**: Enter your API key on the login screen
2. **Storage**: API key is stored in localStorage
3. **Requests**: All API requests include `Authorization: Bearer <api-key>` header
4. **Namespace**: Requests include `x-namespace` header for multi-tenant support
5. **Logout**: Click "Sign out" to clear the API key

### Auth Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Login Page │────►│ AuthProvider│────►│  Dashboard  │
│             │     │             │     │             │
│ Enter API   │     │ Store key   │     │ Protected   │
│ Key         │     │ Init client │     │ Routes      │
└─────────────┘     └─────────────┘     └─────────────┘
```

The `AuthProvider` component:
- Checks authentication status on mount
- Initializes the API client with stored key
- Redirects unauthenticated users to login
- Provides `login()` and `logout()` functions via context

## State Management

The application uses React Context for state management:

### StatsContext
Global dashboard statistics (impressions, clicks, counts):
```typescript
const { impressions, clicks, campaignsCount, zonesCount, isLoading, error } = useStats();
```

### StatsPageContext
Statistics page state (date range, grouping, filtered results):
```typescript
const { stats, dateRange, setDateRange, groupBy, setGroupBy, refetch } = useStatsPage();
```

### CampaignContext
Campaign list and operations state.

### ZoneContext
Zone list and operations state.

## Design

Primary palette and UI tokens are documented in [docs/DESIGN.md](docs/DESIGN.md): **Electric violet** primary (`#7C3AED`), hover (`#6D28D9`), and subtle violet glow. Use `bg-primary`, `hover:bg-primary-hover`, and `shadow-glow-primary` in components.

## Deployment

### Cloudflare Workers (Recommended)

The project deploys to Cloudflare Workers with Static Assets:

1. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Build and deploy**
   ```bash
   npm run build:cf
   npm run deploy
   ```

### GitHub Actions (CI/CD)

Automatic deployment on push to `main` branch:

1. Set up GitHub Secrets:
   - `CLOUDFLARE_API_TOKEN` - Cloudflare API token with Workers:Edit permissions
   - `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

2. Push to main branch - deployment is automatic to `lite-adserver-ui-production`

> **Note**: Pull requests trigger the build job only (tests + build verification). Deployment only runs on pushes to `main`.

## Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run dev:worker` | Test with Cloudflare Worker locally |
| `npm run build` | Build for production |
| `npm run build:cf` | Build for Cloudflare deployment |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
| `npm run type-check` | TypeScript type checking |
| `npm run deploy` | Deploy to Cloudflare Workers |
| `npm run deploy:cf` | Deploy to Cloudflare Pages |

### Local Development with Backend

1. Run the Lite Adserver backend locally (default: `http://localhost:8787`)
2. The UI automatically connects to localhost in development mode
3. Start the UI: `npm run dev`

### Code Style

- TypeScript strict mode enabled
- ESLint with Next.js config
- Prettier for formatting (configure your editor)

## Testing

Run the test suite:

```bash
npm test
```

Tests use:
- Jest as the test runner
- React Testing Library for component tests
- jsdom for DOM simulation

## Roadmap

- [x] Zone edit functionality
- [x] Activate/deactivate zone toggle
- [x] Campaign creation
- [x] Campaign edit functionality
- [x] Start/pause campaign controls
- [x] Fix targeting rules editing
- [ ] Add total and average metrics to statistics
- [ ] View raw ad_events data
- [ ] SyncStateResponse last_updated show in UI

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add TypeScript types for all new code
- Write tests for new functionality
- Update documentation as needed

## License

This project is licensed under the MIT License.

---

## Related Projects

- [Lite Adserver](https://github.com/serz/lite-adserver) - The backend ad serving platform
- [Lite Adserver API Docs](https://github.com/serz/lite-adserver/blob/main/docs/api.md) - API documentation
