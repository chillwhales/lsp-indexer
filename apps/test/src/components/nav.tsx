'use client';

import {
  BarChart3,
  Calendar,
  ChevronDown,
  FileOutput,
  Heart,
  Home,
  Image,
  Layers,
  Lock,
  Monitor,
  Moon,
  Paintbrush,
  Sun,
  Tag,
  User,
  Wallet,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

const navLinks = [
  { href: '/', label: 'Home', icon: Home, available: true },
  { href: '/profiles', label: 'Profiles', icon: User, available: true },
  { href: '/digital-assets', label: 'Digital Assets', icon: Image, available: true },
  { href: '/nfts', label: 'NFTs', icon: Layers, available: true },
  { href: '/owned-assets', label: 'Owned Assets', icon: Wallet, available: true },
  { href: '/owned-tokens', label: 'Owned Tokens', icon: Tag, available: true },
  { href: '/follows', label: 'Follows', icon: Heart, available: true },
  { href: '/creators', label: 'Creators', icon: Paintbrush, available: true },
  { href: '/issued-assets', label: 'Issued Assets', icon: FileOutput, available: true },
  { href: '/encrypted-assets', label: 'Encrypted Assets', icon: Lock, available: true },
  { href: '/data-changed-events', label: 'Data Changed Events', icon: Calendar, available: true },
  { href: '/stats', label: 'Stats', icon: BarChart3, available: false },
];

const themeOptions = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3">
        <h2 className="text-lg font-semibold tracking-tight">LSP Indexer</h2>
        <p className="text-xs text-muted-foreground">React Dev Playground</p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Domain Playgrounds</SidebarGroupLabel>
          <SidebarMenu>
            {navLinks.map((link) => (
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
