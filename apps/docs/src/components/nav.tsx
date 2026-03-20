'use client';

/** Sidebar navigation with docs, domain playground links, and theme switcher. */
import {
  ArrowDownFromLine,
  Book,
  Calendar,
  ChevronDown,
  Database,
  FileOutput,
  Hash,
  Heart,
  Home,
  Image,
  Layers,
  Lock,
  Monitor,
  Moon,
  Package,
  Paintbrush,
  Rocket,
  Sun,
  Tag,
  User,
  UsersRound,
  Wallet,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const docsLinks = [
  { href: '/docs/quickstart', label: 'Quickstart', icon: Rocket },
  { href: '/docs/indexer', label: '@lsp-indexer/indexer', icon: Database },
  { href: '/docs/node', label: '@lsp-indexer/node', icon: Package },
  { href: '/docs/react', label: '@lsp-indexer/react', icon: Package },
  { href: '/docs/next', label: '@lsp-indexer/next', icon: Package },
] as const;

const playgroundLinks = [
  { href: '/profiles', label: 'Profiles', icon: User, available: true },
  { href: '/digital-assets', label: 'Digital Assets', icon: Image, available: true },
  { href: '/nfts', label: 'NFTs', icon: Layers, available: true },
  { href: '/owned-assets', label: 'Owned Assets', icon: Wallet, available: true },
  { href: '/owned-tokens', label: 'Owned Tokens', icon: Tag, available: true },
  { href: '/follows', label: 'Follows', icon: Heart, available: true },
  { href: '/mutual-follows', label: 'Mutual Follows', icon: UsersRound, available: true },
  { href: '/creators', label: 'Creators', icon: Paintbrush, available: true },
  { href: '/issued-assets', label: 'Issued Assets', icon: FileOutput, available: true },
  { href: '/encrypted-assets', label: 'Encrypted Assets', icon: Lock, available: true },
  { href: '/data-changed-events', label: 'Data Changed Events', icon: Calendar, available: true },
  {
    href: '/token-id-data-changed-events',
    label: 'Token ID Data Changed',
    icon: Hash,
    available: true,
  },
  {
    href: '/universal-receiver-events',
    label: 'Universal Receiver',
    icon: ArrowDownFromLine,
    available: true,
  },
] as const;

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

export function AppSidebar(): React.ReactNode {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3">
        <h2 className="text-lg font-semibold tracking-tight">LSP Indexer</h2>
        <p className="text-xs text-muted-foreground">React Dev Playground</p>
      </SidebarHeader>
      <SidebarContent>
        {/* Home — always first */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/'}>
                <Link href="/">
                  <Home />
                  <span>Home</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Documentation */}
        <SidebarGroup>
          <SidebarGroupLabel>
            <Book className="mr-1 size-3" />
            Documentation
          </SidebarGroupLabel>
          <SidebarMenu>
            {docsLinks.map((link) => (
              <SidebarMenuItem key={link.href}>
                <SidebarMenuButton asChild isActive={pathname === link.href}>
                  <Link href={link.href}>
                    <link.icon />
                    <span>{link.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Domain Playgrounds */}
        <SidebarGroup>
          <SidebarGroupLabel>Domain Playgrounds</SidebarGroupLabel>
          <SidebarMenu>
            {playgroundLinks.map((link) => (
              <SidebarMenuItem key={link.href}>
                {link.available ? (
                  <SidebarMenuButton asChild isActive={pathname === link.href}>
                    <Link href={link.href}>
                      <link.icon />
                      <span>{link.label}</span>
                    </Link>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton disabled>
                    <link.icon />
                    <span>{link.label}</span>
                    <Badge variant="secondary" className="ml-auto text-[10px]">
                      Soon
                    </Badge>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-1.5 text-muted-foreground"
            >
              <Sun className="size-3.5" />
              Theme
              <ChevronDown className="size-3.5 ml-auto" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 space-y-0.5 px-1">
            {themeOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={theme === opt.value ? 'secondary' : 'ghost'}
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => setTheme(opt.value)}
              >
                <opt.icon className="size-3.5" />
                {opt.label}
              </Button>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </SidebarFooter>
    </Sidebar>
  );
}
