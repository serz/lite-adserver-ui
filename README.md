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
- [ ] Fix targeting rules editing (adserver api dependency)
- [ ] Add total and average metrics to statistics
- [ ] View raw ad_events data

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- [Lite Adserver](https://github.com/serz/lite-adserver) backend running

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

3. Copy the environment variables example file and edit it
```bash
cp .env.example .env.local
```

Edit the `.env.local` file with your specific configuration:
```
NEXT_PUBLIC_AD_SERVER_URL=https://your-api-url.com
NEXT_PUBLIC_TIMEZONE=your-region/country-timezone
```

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

This UI dashboard is designed to work with the [Lite Adserver](https://github.com/serz/lite-adserver) backend. Make sure you have the backend running and properly configured before using this dashboard.

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

This project is configured for easy deployment on Vercel. Just connect your repository to Vercel for automatic deployments.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License