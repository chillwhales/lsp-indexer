'use client';

import {
  BarChart3,
  Calendar,
  Heart,
  Home,
  Image,
  Layers,
  Lock,
  Paintbrush,
  Tag,
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
  { href: '/owned-tokens', label: 'Owned Tokens', icon: Tag, available: true },
  { href: '/follows', label: 'Follows', icon: Heart, available: false },
  { href: '/creators', label: 'Creators', icon: Paintbrush, available: false },
  { href: '/encrypted', label: 'Encrypted Assets', icon: Lock, available: false },
  { href: '/events', label: 'Events', icon: Calendar, available: false },
  { href: '/stats', label: 'Stats', icon: BarChart3, available: false },
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
