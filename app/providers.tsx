'use client';

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/components/auth-provider';
import { CampaignProvider } from '@/lib/context/campaign-context';
import { ZoneProvider } from '@/lib/context/zone-context';
import { StatsProvider } from '@/lib/context/stats-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <CampaignProvider>
          <ZoneProvider>
            <StatsProvider>
              {children}
            </StatsProvider>
          </ZoneProvider>
        </CampaignProvider>
      </AuthProvider>
    </ThemeProvider>
  );
} 