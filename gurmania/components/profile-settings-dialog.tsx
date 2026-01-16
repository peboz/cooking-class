"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { User, ChefHat, AlertCircle, Database, Download, Trash2 } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { SKILL_LEVELS, DIETARY_PREFERENCES, ALLERGENS, CUISINE_TYPES } from "@/lib/constants"

const data = {
  nav: [
    { name: "Profil", icon: User },
    { name: "Personalizacija", icon: ChefHat },
    { name: "Postani instruktor", icon: ChefHat },
    { name: "Moji podaci", icon: Database },
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
  const router = useRouter()
  const [activeTab, setActiveTab] = React.useState("Profil")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")
  const [success, setSuccess] = React.useState("")

  // Profile state
  const [name, setName] = React.useState(user?.name || "")
  const [imageUrl, setImageUrl] = React.useState(user?.image || "")
  const [uploadingImage, setUploadingImage] = React.useState(false)

  // Form state
  const [skillLevel, setSkillLevel] = React.useState<string>("")
  const [dietaryPreferences, setDietaryPreferences] = React.useState<string[]>([])
  const [allergies, setAllergies] = React.useState<string[]>([])
  const [favoriteCuisines, setFavoriteCuisines] = React.useState<string[]>([])
  
  // Instructor request state
  const [instructorBio, setInstructorBio] = React.useState("")
  const [instructorSpecializations, setInstructorSpecializations] = React.useState<string[]>([])
  const [verificationDocumentUrl, setVerificationDocumentUrl] = React.useState("")
  const [uploadingDocument, setUploadingDocument] = React.useState(false)
  const [instructorStatus, setInstructorStatus] = React.useState<{
    exists: boolean
    verified?: boolean
    verificationStatus?: string
    verificationReason?: string | null
  } | null>(null)

  // Data management state
  const [exportingData, setExportingData] = React.useState(false)
  const [deletingAccount, setDeletingAccount] = React.useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = React.useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)

  // Load profile data when dialog opens
  React.useEffect(() => {
    if (open) {
      loadProfileData()
      loadInstructorStatus()
    }
  }, [open])

  const loadProfileData = async () => {
    try {
      const response = await fetch("/api/profile/student")
      if (response.ok) {
        const data = await response.json()
        setSkillLevel(data.profile.skillLevel || "")
        setDietaryPreferences(data.profile.dietaryPreferences || [])
        setAllergies(data.profile.allergies || [])
        setFavoriteCuisines(data.profile.favoriteCuisines || [])
      }
    } catch {
      console.error("Error loading profile")
    }
  }

  const loadInstructorStatus = async () => {
    try {
      const response = await fetch("/api/profile/instructor")
      if (response.ok) {
        const data = await response.json()
        setInstructorStatus({
          exists: true,
          verified: data.profile.verified,
          verificationStatus: data.profile.verificationStatus,
          verificationReason: data.profile.verificationReason,
        })
      } else {
        setInstructorStatus({ exists: false })
      }
    } catch {
      console.error("Error loading instructor status")
      setInstructorStatus({ exists: false })
    }
  }

  const toggleSelection = (value: string, currentArray: string[], setter: (arr: string[]) => void) => {
    if (currentArray.includes(value)) {
      setter(currentArray.filter((item) => item !== value))
    } else {
      setter([...currentArray, value])
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError("Nevažeći tip datoteke. Dozvoljeni su JPG, PNG, GIF i WebP.")
      return
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Datoteka je prevelika. Maksimalna veličina je 2MB.")
      return
    }

    setUploadingImage(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/profile/upload-image', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Greška pri uploadu slike")
        return
      }

      setImageUrl(data.imageUrl)
      setSuccess("Slika uspješno uploadana!")
      
      // Refresh server components to update navbar and other places
      router.refresh()
      
      // Close dialog after short delay to show success message
      setTimeout(() => {
        setSuccess("")
        onOpenChange(false)
      }, 1500)
    } catch {
      setError("Greška pri uploadu slike. Molimo pokušajte ponovno.")
    } finally {
      setUploadingImage(false)
    }
  }

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setError("Nevažeći tip datoteke. Dozvoljeni su JPG, PNG, WebP i PDF.")
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Datoteka je prevelika. Maksimalna veličina je 5MB.")
      return
    }

    setUploadingDocument(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/profile/upload-verification-doc', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Greška pri uploadu dokumenta")
        return
      }

      setVerificationDocumentUrl(data.documentUrl)
      setSuccess("Dokument uspješno uploadan!")
      setTimeout(() => setSuccess(""), 3000)
    } catch {
      setError("Greška pri uploadu dokumenta. Molimo pokušajte ponovno.")
    } finally {
      setUploadingDocument(false)
    }
  }

  const handleInstructorRequest = async () => {
    if (!instructorBio || instructorSpecializations.length === 0) {
      setError("Molimo unesite biografiju i barem jednu specijalizaciju")
      return
    }

    if (!verificationDocumentUrl) {
      setError("Molimo uploadajte verifikacijski dokument (ID)")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch('/api/profile/instructor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: instructorBio,
          specializations: instructorSpecializations,
          verificationDocumentUrl,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Došlo je do greške")
        return
      }

      setSuccess("Zahtjev uspješno poslan! Čekajte odobrenje administratora.")
      
      // Reload instructor status
      await loadInstructorStatus()
      
      // Reset form
      setInstructorBio("")
      setInstructorSpecializations([])
      setVerificationDocumentUrl("")
      
      setTimeout(() => setSuccess(""), 5000)
    } catch (err) {
      setError("Došlo je do greške. Molimo pokušajte ponovno.")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // TODO: Implement API call to update user name
      // For now, just show success message
      setSuccess("Profil uspješno spremljen!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Došlo je do greške. Molimo pokušajte ponovno.")
    } finally {
      setLoading(false)
    }
  }

  const handleSavePersonalization = async () => {
    if (!skillLevel) {
      setError("Molimo odaberite razinu vještine")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/profile/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skillLevel,
          dietaryPreferences,
          allergies,
          favoriteCuisines,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Došlo je do greške")
      } else {
        setSuccess("Profil uspješno spremljen!")
        setTimeout(() => setSuccess(""), 3000)
      }
    } catch (err) {
      setError("Došlo je do greške. Molimo pokušajte ponovno.")
    } finally {
      setLoading(false)
    }
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

  const handleExportData = async () => {
    setExportingData(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch('/api/profile/export-data', {
        method: 'GET',
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Greška pri izvozul podataka")
        return
      }

      // Get the blob and create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="?(.+)"?/)
      const filename = filenameMatch ? filenameMatch[1] : `gurmania-data-export-${new Date().toISOString().split('T')[0]}.json`
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccess("Vaši podaci su uspješno preuzeti!")
      setTimeout(() => setSuccess(""), 5000)
    } catch (err) {
      setError("Došlo je do greške prilikom izvoza podataka. Molimo pokušajte ponovno.")
    } finally {
      setExportingData(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'IZBRIŠI MOJ RAČUN') {
      setError('Molimo upišite točnu potvrdnu frazu: IZBRIŠI MOJ RAČUN')
      return
    }

    setDeletingAccount(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch('/api/profile/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmationPhrase: deleteConfirmation,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Došlo je do greške")
        return
      }

      // Account deleted successfully
      setSuccess(data.message)
      
      // Sign out and redirect to home page
      setTimeout(() => {
        window.location.href = '/api/auth/signout'
      }, 2000)
    } catch (err) {
      setError("Došlo je do greške. Molimo pokušajte ponovno.")
    } finally {
      setDeletingAccount(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 md:max-h-[700px] md:max-w-[800px] lg:max-w-[1000px]">
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
                              setError("")
                              setSuccess("")
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
          <main className="flex h-[650px] flex-1 flex-col overflow-hidden">
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
              {/* Profile Tab */}
              {activeTab === "Profil" && (
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
                        <AvatarImage src={imageUrl || user?.image || undefined} alt={user?.name || "User"} />
                        <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <input
                          type="file"
                          id="profile-image-upload"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('profile-image-upload')?.click()}
                          disabled={uploadingImage}
                        >
                          {uploadingImage ? "Uploadanje..." : "Promijeni sliku"}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG, GIF ili WebP. Maksimalna veličina 2MB.
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
                      value={name}
                      onChange={(e) => setName(e.target.value)}
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
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Email adresa koja se koristi za prijavu i notifikacije.
                    </p>
                  </div>

                  {/* Error/Success Messages */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/15 text-destructive rounded-md text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-md text-sm">
                      {success}
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {loading ? "Spremanje..." : "Spremi promjene"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Personalization Tab */}
              {activeTab === "Personalizacija" && (
                <div className="max-w-2xl space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Personalizacija</h2>
                    <p className="text-sm text-muted-foreground">
                      Prilagodite platformu prema svojim preferencijama.
                    </p>
                  </div>

                  {/* Skill Level */}
                  <div className="space-y-3">
                    <Label className="text-base">Razina vještine</Label>
                    <div className="grid gap-3">
                      {SKILL_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          onClick={() => setSkillLevel(level.value)}
                          className={`p-4 border-2 rounded-lg text-left transition-all hover:border-orange-300 ${
                            skillLevel === level.value
                              ? "border-orange-600 bg-orange-50 dark:bg-orange-950/20"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          <div className="font-semibold">{level.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dietary Preferences */}
                  <div className="space-y-3">
                    <Label className="text-base">Prehrambene preferencije</Label>
                    <div className="flex flex-wrap gap-2">
                      {DIETARY_PREFERENCES.map((pref) => (
                        <Badge
                          key={pref}
                          variant={dietaryPreferences.includes(pref) ? "default" : "outline"}
                          className={`cursor-pointer text-sm ${
                            dietaryPreferences.includes(pref)
                              ? "bg-orange-600 hover:bg-orange-700"
                              : "hover:border-orange-300"
                          }`}
                          onClick={() => toggleSelection(pref, dietaryPreferences, setDietaryPreferences)}
                        >
                          {pref}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Allergens */}
                  <div className="space-y-3">
                    <Label className="text-base">Alergeni</Label>
                    <div className="flex flex-wrap gap-2">
                      {ALLERGENS.map((allergen) => (
                        <Badge
                          key={allergen}
                          variant={allergies.includes(allergen) ? "default" : "outline"}
                          className={`cursor-pointer text-sm ${
                            allergies.includes(allergen)
                              ? "bg-orange-600 hover:bg-orange-700"
                              : "hover:border-orange-300"
                          }`}
                          onClick={() => toggleSelection(allergen, allergies, setAllergies)}
                        >
                          {allergen}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Favorite Cuisines */}
                  <div className="space-y-3">
                    <Label className="text-base">Omiljene kuhinje</Label>
                    <div className="flex flex-wrap gap-2">
                      {CUISINE_TYPES.map((cuisine) => (
                        <Badge
                          key={cuisine}
                          variant={favoriteCuisines.includes(cuisine) ? "default" : "outline"}
                          className={`cursor-pointer text-sm ${
                            favoriteCuisines.includes(cuisine)
                              ? "bg-orange-600 hover:bg-orange-700"
                              : "hover:border-orange-300"
                          }`}
                          onClick={() => toggleSelection(cuisine, favoriteCuisines, setFavoriteCuisines)}
                        >
                          {cuisine}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Error/Success Messages */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/15 text-destructive rounded-md text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-md text-sm">
                      {success}
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSavePersonalization}
                      disabled={loading}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      {loading ? "Spremanje..." : "Spremi promjene"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Become Instructor Tab */}
              {activeTab === "Postani instruktor" && (
                <div className="max-w-2xl space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Postani instruktor</h2>
                    <p className="text-sm text-muted-foreground">
                      Podijelite svoje znanje i poučavajte druge kuharske vještine.
                    </p>
                  </div>

                  {/* Show status if already requested */}
                  {instructorStatus?.exists && (
                    <div className={`border rounded-lg p-4 ${
                      instructorStatus.verified 
                        ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                        : instructorStatus.verificationStatus === 'REJECTED'
                        ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                        : 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                    }`}>
                      <div className="flex items-start gap-3">
                        <ChefHat className={`w-5 h-5 mt-0.5 ${
                          instructorStatus.verified 
                            ? 'text-green-600'
                            : instructorStatus.verificationStatus === 'REJECTED'
                            ? 'text-red-600'
                            : 'text-blue-600'
                        }`} />
                        <div className="flex-1 space-y-2">
                          <h3 className="font-semibold">Status zahtjeva</h3>
                          <p className="text-sm text-muted-foreground">
                            {instructorStatus.verified ? (
                              <span className="text-green-600 font-medium">✓ Vaš instruktorski profil je verificiran!</span>
                            ) : instructorStatus.verificationStatus === 'PENDING' ? (
                              <span className="text-orange-600 font-medium">⏳ Vaš zahtjev je na čekanju. Administrator će ga uskoro pregledati.</span>
                            ) : instructorStatus.verificationStatus === 'REJECTED' ? (
                              <span className="text-red-600 font-medium">✗ Vaš zahtjev je odbijen.</span>
                            ) : (
                              <span className="text-gray-600 font-medium">Vaš zahtjev se trenutno obrađuje.</span>
                            )}
                          </p>
                          {instructorStatus.verificationReason && (
                            <div className="mt-2 p-3 rounded-md bg-background/50 border">
                              <p className="text-sm font-medium mb-1">
                                {instructorStatus.verificationStatus === 'REJECTED' ? 'Razlog odbijanja:' : 'Napomena:'}
                              </p>
                              <p className="text-sm">{instructorStatus.verificationReason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show form only if no request exists */}
                  {!instructorStatus?.exists && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Biografija *</Label>
                        <Textarea
                          id="bio"
                          placeholder="Opišite svoje iskustvo i stručnost u kuhanju..."
                          value={instructorBio}
                          onChange={(e) => setInstructorBio(e.target.value)}
                          rows={6}
                        />
                        <p className="text-xs text-muted-foreground">
                          Podijelite svoje kuharsko iskustvo, certifikate, i zašto želite poučavati.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Specijalizacije * (odaberite barem jednu)</Label>
                        <div className="flex flex-wrap gap-2">
                          {CUISINE_TYPES.map((cuisine) => (
                            <Badge
                              key={cuisine}
                              variant={instructorSpecializations.includes(cuisine) ? "default" : "outline"}
                              className={`cursor-pointer text-sm ${
                                instructorSpecializations.includes(cuisine)
                                  ? "bg-orange-600 hover:bg-orange-700"
                                  : "hover:border-orange-300"
                              }`}
                              onClick={() => toggleSelection(cuisine, instructorSpecializations, setInstructorSpecializations)}
                            >
                              {cuisine}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Odabrano: {instructorSpecializations.length} {instructorSpecializations.length === 1 ? 'specijalizacija' : 'specijalizacija'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Verifikacijski dokument (ID) *</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            id="verification-doc-upload"
                            accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                            onChange={handleDocumentUpload}
                            disabled={uploadingDocument}
                            className="hidden"
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('verification-doc-upload')?.click()}
                            disabled={uploadingDocument}
                          >
                            {uploadingDocument ? "Uploadanje..." : verificationDocumentUrl ? "Promijeni dokument" : "Upload dokumenta"}
                          </Button>
                          {verificationDocumentUrl && (
                            <span className="text-sm text-green-600">✓ Dokument uploadan</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Uploadajte svoj ID ili drugu identifikacijsku ispravu. Dozvoljeni formati: JPG, PNG, WebP, PDF (max 5MB).
                        </p>
                      </div>
                    </>
                  )}

                  {/* Error/Success Messages */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/15 text-destructive rounded-md text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-md text-sm">
                      {success}
                    </div>
                  )}

                  {/* Submit Button - only show if no request exists */}
                  {!instructorStatus?.exists && (
                    <div className="flex justify-end">
                      <Button
                        onClick={handleInstructorRequest}
                        disabled={loading || uploadingDocument}
                        className="bg-orange-600 hover:bg-orange-700 gap-2"
                      >
                        <ChefHat className="w-4 h-4" />
                        {loading ? "Slanje..." : "Pošalji zahtjev"}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Moji podaci Tab */}
              {activeTab === "Moji podaci" && (
                <div className="max-w-2xl space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Moji podaci</h2>
                    <p className="text-sm text-muted-foreground">
                      Preuzmite sve svoje podatke ili trajno izbrišite svoj račun.
                    </p>
                  </div>

                  {/* Export Data Section */}
                  <div className="border rounded-lg p-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <Download className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-semibold">Preuzmi moje podatke</h3>
                        <p className="text-sm text-muted-foreground">
                          Preuzmite sva vaša osobna podatka u JSON formatu. To uključuje vaš profil, 
                          tečajeve, napredak, komentare, recenzije i sve ostale podatke povezane s 
                          vašim računom.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Izvoz podataka je u skladu s GDPR propisima i omogućava vam da pregledate 
                          sve podatke koje čuvamo o vama.
                        </p>
                        <Button
                          onClick={handleExportData}
                          disabled={exportingData}
                          variant="outline"
                          className="mt-3 gap-2"
                        >
                          <Download className="w-4 h-4" />
                          {exportingData ? "Priprema izvoza..." : "Preuzmi podatke (JSON)"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Delete Account Section */}
                  <div className="border border-red-200 dark:border-red-800 rounded-lg p-6 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <Trash2 className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                          Izbriši račun
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Trajno izbrišite svoj račun i sve povezane podatke. Ova radnja je 
                          <strong className="text-red-600"> nepovratna</strong>.
                        </p>
                        
                        {!showDeleteConfirm ? (
                          <Button
                            onClick={() => setShowDeleteConfirm(true)}
                            variant="destructive"
                            className="mt-3 gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Izbriši moj račun
                          </Button>
                        ) : (
                          <div className="mt-4 space-y-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-red-600 dark:text-red-400">
                                ⚠️ Upozorenje - Ova radnja je nepovratna!
                              </h4>
                              <p className="text-sm">
                                Brisanjem računa bit će trajno izbrisani:
                              </p>
                              <ul className="text-sm list-disc pl-6 space-y-1">
                                <li>Vaš profil i svi osobni podaci</li>
                                <li>Svi tečajevi koje ste kreirali (ako ste instruktor)</li>
                                <li>Svi vaši komentari i recenzije</li>
                                <li>Vaš napredak u tečajevima</li>
                                <li>Svi certifikati</li>
                                <li>Sve kupovne liste</li>
                                <li>Sve notifikacije</li>
                                <li>Svi ostali podaci povezani s vašim računom</li>
                              </ul>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="delete-confirmation" className="text-sm font-semibold">
                                Za potvrdu, upišite: <span className="text-red-600 font-mono">IZBRIŠI MOJ RAČUN</span>
                              </Label>
                              <Input
                                id="delete-confirmation"
                                type="text"
                                placeholder="Upišite: IZBRIŠI MOJ RAČUN"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                className="font-mono"
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={() => {
                                  setShowDeleteConfirm(false)
                                  setDeleteConfirmation("")
                                  setError("")
                                }}
                                variant="outline"
                                disabled={deletingAccount}
                              >
                                Odustani
                              </Button>
                              <Button
                                onClick={handleDeleteAccount}
                                variant="destructive"
                                disabled={deletingAccount || deleteConfirmation !== 'IZBRIŠI MOJ RAČUN'}
                                className="gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                {deletingAccount ? "Brisanje..." : "Potvrdi brisanje"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Error/Success Messages */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-destructive/15 text-destructive rounded-md text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-md text-sm">
                      {success}
                    </div>
                  )}

                  {/* Privacy Policy Link */}
                  <div className="border-t pt-4 text-sm text-muted-foreground">
                    <p>
                      Za više informacija o tome kako postupamo s vašim podacima, 
                      pročitajte našu{" "}
                      <a 
                        href="/privacy-policy" 
                        target="_blank"
                        className="text-orange-600 hover:text-orange-700 underline"
                      >
                        Politiku privatnosti
                      </a>
                      .
                    </p>
                  </div>
                </div>
              )}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}
