"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { ProfileSettingsDialog } from "@/components/profile-settings-dialog"
import { Search, Settings, LogOut, ChefHat } from "lucide-react"
import { signOut } from "next-auth/react"
import Link from "next/link"

interface NavbarProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  isInstructor?: boolean
}

export function Navbar({ user, isInstructor }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" })
  }

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
    <>
      <nav className="border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex h-16 items-center px-4 container mx-auto">
          {/* Left - Logo/Brand */}
          <div className="flex items-center gap-2">
            <ChefHat className="w-8 h-8 text-orange-600" />
            <span className="text-2xl font-bold">Gurmania</span>
          </div>

          {/* Middle - Search */}
          <div className="flex-1 flex justify-center px-8">
            <Button
              variant="outline"
              className="relative w-full max-w-sm justify-start text-sm text-muted-foreground"
              onClick={() => setOpen(true)}
            >
              <Search className="mr-2 h-4 w-4" />
              <span>Pretražite...</span>
              <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          </div>

          {/* Right - User Profile */}
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.image || undefined} alt={user?.name || "User"} />
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline-block">{user?.name || user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Postavke profila</span>
                </DropdownMenuItem>
                {isInstructor && (
                  <DropdownMenuItem asChild>
                    <Link href="/app/instructor">
                      <ChefHat className="mr-2 h-4 w-4" />
                      <span>Instruktorski panel</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Odjava</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Command Dialog for Search */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Pretražite..." />
        <CommandList>
          <CommandEmpty>Nema rezultata.</CommandEmpty>
          <CommandGroup heading="Tečajevi">
            <CommandItem>
              <span>Osnove kuhinje</span>
            </CommandItem>
            <CommandItem>
              <span>Osnove peciva i kolača</span>
            </CommandItem>
            <CommandItem>
              <span>Napredne vještine noža</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Recepti">
            <CommandItem>
              <span>Klasična carbonara</span>
            </CommandItem>
            <CommandItem>
              <span>Čokoladni soufflé</span>
            </CommandItem>
            <CommandItem>
              <span>Savršeni risotto</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Instruktori">
            <CommandItem>
              <span>Chef Marco Rossi</span>
            </CommandItem>
            <CommandItem>
              <span>Chef Sophie Laurent</span>
            </CommandItem>
            <CommandItem>
              <span>Chef David Chen</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Profile Settings Dialog */}
      <ProfileSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        user={user}
      />
    </>
  )
}
