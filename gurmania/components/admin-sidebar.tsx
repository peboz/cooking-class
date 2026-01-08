"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ChefHat,
  BookOpen,
  Video,
  MessageSquare,
  Settings,
  FileText,
  ShieldAlert,
  BarChart3,
  Home,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    {
      title: "Pregled",
      items: [
        {
          title: "Dashboard",
          url: "/admin",
          icon: LayoutDashboard,
        },
        {
          title: "Analitika",
          url: "/admin/analytics",
          icon: BarChart3,
        },
      ],
    },
    {
      title: "Korisnici",
      items: [
        {
          title: "Svi korisnici",
          url: "/admin/users",
          icon: Users,
        },
        {
          title: "Instruktori",
          url: "/admin/instructors",
          icon: ChefHat,
        },
        {
          title: "Zahtjevi za verifikaciju",
          url: "/admin/verification-requests",
          icon: ShieldAlert,
        },
      ],
    },
    {
      title: "Sadržaj",
      items: [
        {
          title: "Tečajevi",
          url: "/admin/courses",
          icon: BookOpen,
        },
        {
          title: "Live radionice",
          url: "/admin/workshops",
          icon: Video,
        },
        {
          title: "Recenzije",
          url: "/admin/reviews",
          icon: MessageSquare,
        },
      ],
    },
    {
      title: "Sustav",
      items: [
        {
          title: "Audit log",
          url: "/admin/audit-log",
          icon: FileText,
        },
        {
          title: "Postavke",
          url: "/admin/settings",
          icon: Settings,
        },
      ],
    },
  ],
};

export function AdminSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-orange-600 text-white">
                  <ChefHat className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Gurmania</span>
                  <span className="text-xs text-muted-foreground">Admin Panel</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {data.navMain.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/app">
                <Home className="size-4" />
                <span>Nazad na aplikaciju</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
