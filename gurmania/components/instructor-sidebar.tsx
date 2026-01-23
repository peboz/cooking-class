"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Video,
  Calendar,
  MessageSquare,
  BarChart3,
  Settings,
  Home,
  ChefHat,
  Users,
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
      items: [
        {
          title: "Dashboard",
          url: "/app/instructor",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Sadržaj",
      items: [
        {
          title: "Tečajevi",
          url: "/app/instructor/courses",
          icon: BookOpen,
        },
        {
          title: "Live radionice",
          url: "/app/instructor/workshops",
          icon: Video,
        },
        {
          title: "Raspored",
          url: "/app/instructor/schedule",
          icon: Calendar,
        },
      ],
    },
    {
      title: "Interakcija",
      items: [
        {
          title: "Polaznici",
          url: "/app/instructor/students",
          icon: Users,
        },
        {
          title: "Recenzije",
          url: "/app/instructor/reviews",
          icon: MessageSquare,
        },
      ],
    },
    {
      title: "Postavke",
      items: [
        {
          title: "Instruktorski profil",
          url: "/app/instructor/settings",
          icon: Settings,
        },
      ],
    },
  ],
};

export function InstructorSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/app/instructor">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-orange-600 text-white">
                  <ChefHat className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Gurmania</span>
                  <span className="text-xs text-muted-foreground">Instruktorski Panel</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {data.navMain.map((section, index) => (
          <SidebarGroup key={section.title || `section-${index}`}>
            {section.title && <SidebarGroupLabel>{section.title}</SidebarGroupLabel>}
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
