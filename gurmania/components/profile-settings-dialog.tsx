"use client"

import * as React from "react"
import { User } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const data = {
  nav: [
    { name: "Profil", icon: User },
  ],
}

interface ProfileSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export function ProfileSettingsDialog({ open, onOpenChange, user }: ProfileSettingsDialogProps) {
  const [activeTab, setActiveTab] = React.useState("Profil")

  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return "U"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 md:max-h-[600px] md:max-w-[700px] lg:max-w-[900px]">
        <DialogTitle className="sr-only">Postavke profila</DialogTitle>
        <DialogDescription className="sr-only">
          Uredite svoje podatke profila ovdje.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {data.nav.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          asChild
                          isActive={item.name === activeTab}
                        >
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              setActiveTab(item.name)
                            }}
                          >
                            <item.icon />
                            <span>{item.name}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[550px] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">Postavke</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{activeTab}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
              <div className="max-w-2xl space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">Profil</h2>
                  <p className="text-sm text-muted-foreground">
                    Upravljajte postavkama svog profila i osobnim podacima.
                  </p>
                </div>

                {/* Profile Picture Section */}
                <div className="space-y-2">
                  <Label>Profilna slika</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user?.image || undefined} alt={user?.name || "User"} />
                      <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm">
                        Promijeni sliku
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        JPG, GIF ili PNG. Maksimalna veličina 2MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name">Ime</Label>
                  <Input
                    id="name"
                    placeholder="Vaše ime"
                    defaultValue={user?.name || ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Ovo je ime koje će se prikazivati na vašem profilu.
                  </p>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="vasa@email.com"
                    defaultValue={user?.email || ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Email adresa koja se koristi za prijavu i notifikacije.
                  </p>
                </div>

                {/* Save Button */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button>
                    Spremi promjene
                  </Button>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Odustani
                  </Button>
                </div>
              </div>
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}

