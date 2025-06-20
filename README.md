# Lite Adserver Dashboard

A modern, responsive dashboard UI for managing the [Lite Adserver platform](https://github.com/serz/lite-adserver). Built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui.

## Features

- **Modern UI**: Clean, responsive interface built with Tailwind CSS and shadcn/ui components
- **Server Components**: Leverages Next.js App Router and React Server Components
- **Type Safety**: Full TypeScript support with strict typing
- **Dark/Light Mode**: Theme toggle with system preference detection
- **Mobile Friendly**: Responsive design works on all device sizes

## TODO

- [x] Zone edit functionality
- [x] Activate/deactivate zone toggle
- [x] Campaign creation
- [x] Campaign edit functionality 
- [x] Start/pause campaign controls
- [x] Fix targeting rules editing (adserver api dependency)
- [ ] Add total and average metrics to statistics
- [ ] View raw ad_events data
- [ ] SyncStateResponse last_updated show in UI

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Access to a [Lite Adserver](https://github.com/serz/lite-adserver) instance (e.g., [lite-adserver.affset.com](https://lite-adserver.affset.com))

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/lite-adserver-ui.git
cd lite-adserver-ui
```

2. Install dependencies
```bash
npm install
# or
yarn
```

3. Environment variables setup

Environment variables are pre-configured in `wrangler.toml` and work automatically for:
- **Local development**: `wrangler pages dev`
- **Preview deployments**: Cloudflare Pages preview branches  
- **Production deployments**: Cloudflare Pages production branch

No `.env.local` file needed! The configuration is managed centrally in `wrangler.toml`.

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
/app                  # Next.js App Router pages and layouts
  /dashboard          # Dashboard pages
  /login              # Authentication pages
/components           # React components
  /ui                 # UI components based on shadcn/ui
/hooks                # Custom React hooks
/lib                  # Utility functions and shared code
/types                # TypeScript type definitions
/utils                # Helper functions
```

## API Integration

The dashboard integrates with the [Lite Adserver API](https://github.com/serz/lite-adserver/blob/main/docs/api.md). The API client is located in `lib/api.ts`. Authentication is handled via API keys.

### Backend Connection

This UI dashboard connects to the [Lite Adserver](https://github.com/serz/lite-adserver) backend at [lite-adserver.affset.com](https://lite-adserver.affset.com). The API client automatically handles authentication and communication with the ad server.

## Authentication

The dashboard uses a simple API key-based authentication:

1. Enter your API key in the login screen
2. The API key is stored securely and used for all API requests
3. The dashboard will automatically redirect unauthenticated users to the login page
4. Use the "Sign out" button to clear the API key and log out

## Testing

Run tests using:

```bash
npm test
# or
yarn test
```

## Deployment

This project is configured for deployment on Cloudflare Pages with automatic GitHub integration.

### Manual Deployment

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Login to Cloudflare:
```bash
wrangler login
```

3. Build and deploy:
```bash
npm run build:cf
wrangler pages publish .next
```

### Automatic Deployment

The project includes GitHub Actions for automatic deployment. Set up the following secrets in your repository:
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token with Pages:Edit permissions
- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID

### Environment Variables

Production environment variables are pre-configured in `wrangler.toml`:
- `NEXT_PUBLIC_AD_SERVER_URL`: https://lite-adserver.affset.com
- `NEXT_PUBLIC_TIMEZONE`: UTC

For custom deployments, you can override these in the Cloudflare Pages dashboard or modify the `wrangler.toml` file.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License