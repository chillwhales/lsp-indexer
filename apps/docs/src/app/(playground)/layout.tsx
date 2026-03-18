import type { ReactNode } from 'react';

import { EnvProvider } from '@/components/env-provider';
import { AppSidebar } from '@/components/nav';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { getEnvAvailability } from '@/lib/env-config';

/** Playground layout — sidebar navigation for all 12 domain playground pages. */
export default function PlaygroundLayout({ children }: { children: ReactNode }): ReactNode {
  const envAvailability = getEnvAvailability();

  return (
    <EnvProvider value={envAvailability}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <span className="text-sm text-muted-foreground">@lsp-indexer/react playground</span>
          </header>
          <main className="flex-1 min-w-0 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </EnvProvider>
  );
}
