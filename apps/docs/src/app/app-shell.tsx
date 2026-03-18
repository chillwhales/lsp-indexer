'use client';

import { LargeSearchToggle } from 'fumadocs-ui/components/layout/search-toggle';
import type { ReactNode } from 'react';

import { EnvProvider } from '@/components/env-provider';
import { AppSidebar } from '@/components/nav';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

interface EnvAvailability {
  hasClientUrl: boolean;
  hasServerUrl: boolean;
}

interface AppShellProps {
  children: ReactNode;
  envAvailability: EnvAvailability;
}

export function AppShell({ children, envAvailability }: AppShellProps): ReactNode {
  return (
    <EnvProvider value={envAvailability}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <span className="text-sm font-medium">@lsp-indexer</span>
            <div className="ml-auto">
              <LargeSearchToggle />
            </div>
          </header>
          <main className="flex-1 min-w-0">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </EnvProvider>
  );
}
