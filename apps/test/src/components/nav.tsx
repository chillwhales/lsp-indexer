'use client';

import {
  Bell,
  Calendar,
  Heart,
  Home,
  Image,
  Layers,
  Lock,
  Paintbrush,
  Rss,
  User,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import {
  Sidebar,
  SidebarContent,
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
  { href: '/follows', label: 'Follows', icon: Heart, available: true },
  { href: '/creators', label: 'Creators', icon: Paintbrush, available: true },
  { href: '/encrypted-assets', label: 'Encrypted Assets', icon: Lock, available: true },
  { href: '/feed', label: 'Encrypted Feed', icon: Rss, available: true },
  { href: '/data-changed', label: 'Data Changed', icon: Calendar, available: true },
  { href: '/universal-receiver', label: 'Universal Receiver', icon: Bell, available: true },
];

export function AppSidebar() {
  const pathname = usePathname();

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
    </Sidebar>
  );
}
