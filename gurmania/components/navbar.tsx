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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ProfileSettingsDialog } from "@/components/profile-settings-dialog"
import { Search, Settings, LogOut, ChefHat, ShoppingCart, Trash2 } from "lucide-react"
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

interface ShoppingListItem {
  id: string;
  ingredientId: string;
  quantity: number | null;
  unit: string | null;
  purchased: boolean;
  ingredient: {
    name: string;
  };
}

export function Navbar({ user, isInstructor }: NavbarProps) {
  const [open, setOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [shoppingListOpen, setShoppingListOpen] = useState(false)
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([])
  const [loadingList, setLoadingList] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Fetch shopping list on mount if user is logged in
    if (mounted && user) {
      fetchShoppingList()
    }
  }, [mounted, user])

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

  const fetchShoppingList = async () => {
    setLoadingList(true)
    try {
      const response = await fetch('/api/shopping-lists')
      if (response.ok) {
        const data = await response.json()
        // Get the most recent shopping list or create empty array
        if (data.lists && data.lists.length > 0) {
          setShoppingList(data.lists[0].items || [])
        } else {
          setShoppingList([])
        }
      }
    } catch (error) {
      console.error('Error fetching shopping list:', error)
    } finally {
      setLoadingList(false)
    }
  }

  const toggleItemPurchased = async (itemId: string, purchased: boolean) => {
    try {
      const response = await fetch(`/api/shopping-lists/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purchased }),
      })
      
      if (response.ok) {
        setShoppingList(prev => 
          prev.map(item => 
            item.id === itemId ? { ...item, purchased } : item
          )
        )
      }
    } catch (error) {
      console.error('Error updating item:', error)
    }
  }

  const deleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/shopping-lists/items/${itemId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setShoppingList(prev => prev.filter(item => item.id !== itemId))
      }
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  useEffect(() => {
    if (shoppingListOpen) {
      fetchShoppingList()
    }
  }, [shoppingListOpen])

  useEffect(() => {
    // Listen for shopping list updates from other components
    const handleShoppingListUpdate = () => {
      fetchShoppingList()
    }

    window.addEventListener('shopping-list-updated', handleShoppingListUpdate)
    return () => window.removeEventListener('shopping-list-updated', handleShoppingListUpdate)
  }, [])

  return (
    <>
      <nav className="border-b bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex h-16 items-center px-4 container mx-auto">
          {/* Left - Logo/Brand */}
          <Link href="/app" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ChefHat className="w-8 h-8 text-orange-600" />
            <span className="text-2xl font-bold">Gurmania</span>
          </Link>

          {/* Middle - Navigation Links & Search */}
          <div className="flex-1 flex items-center justify-center gap-6 px-8">
            <Link 
              href="/app/courses" 
              className="hidden md:inline-block text-sm font-medium hover:text-orange-600 transition-colors"
            >
              Pregledaj tečajeve
            </Link>
            <Link 
              href="/app/workshops" 
              className="hidden md:inline-block text-sm font-medium hover:text-orange-600 transition-colors"
            >
              Live radionice
            </Link>
          </div>

          {/* Right - Shopping List & User Profile */}
          <div className="flex items-center gap-2">
            {mounted && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShoppingListOpen(true)}
                  className="relative"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {shoppingList.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center">
                      {shoppingList.filter(item => !item.purchased).length}
                    </span>
                  )}
                </Button>
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
                <DropdownMenuItem asChild>
                  <Link href="/app">
                    <ChefHat className="mr-2 h-4 w-4" />
                    <span>Moji tečajevi</span>
                  </Link>
                </DropdownMenuItem>
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
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Command Dialog for Search */}
      {mounted && (
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
      )}

      {/* Profile Settings Dialog */}
      {mounted && (
        <>
          <ProfileSettingsDialog
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            user={user}
          />

          {/* Shopping List Dialog */}
          <Dialog open={shoppingListOpen} onOpenChange={setShoppingListOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Lista za kupovinu
            </DialogTitle>
            <DialogDescription>
              Ovdje možete vidjeti i urediti svoju listu za kupovinu
            </DialogDescription>
          </DialogHeader>
          
          {loadingList ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : shoppingList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Vaša lista za kupovinu je prazna</p>
              <p className="text-sm mt-1">Dodajte sastojke iz lekcija da biste započeli</p>
            </div>
          ) : (
            <div className="space-y-2">
              {shoppingList.map((item) => (
                <Card key={item.id} className={item.purchased ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={item.purchased}
                        onCheckedChange={(checked) => 
                          toggleItemPurchased(item.id, checked as boolean)
                        }
                      />
                      <div className="flex-1">
                        <span className={item.purchased ? 'line-through' : ''}>
                          {item.quantity && item.unit && (
                            <span className="font-medium">
                              {item.quantity} {item.unit}{' '}
                            </span>
                          )}
                          {item.ingredient.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {shoppingList.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Ukupno stavki:</span>
                <span className="font-medium">{shoppingList.length}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>Kupljeno:</span>
                <span className="font-medium">
                  {shoppingList.filter(item => item.purchased).length}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </>
      )}
    </>
  )
}
