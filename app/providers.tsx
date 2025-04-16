'use client';

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/components/auth-provider';
import { CampaignProvider } from '@/lib/context/campaign-context';
import { ZoneProvider } from '@/lib/context/zone-context';
import { StatsProvider } from '@/lib/context/stats-context';
import { StatsPageProvider } from '@/lib/context/stats-page-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <CampaignProvider>
          <ZoneProvider>
            <StatsProvider>
              <StatsPageProvider>
                {children}
              </StatsPageProvider>
            </StatsProvider>
          </ZoneProvider>
        </CampaignProvider>
      </AuthProvider>
    </ThemeProvider>
  );
} 