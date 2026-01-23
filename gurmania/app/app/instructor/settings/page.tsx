'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, AlertCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { SPECIALIZATIONS } from '@/lib/constants';

interface InstructorProfile {
  id: string;
  bio: string | null;
  specializations: string[];
  verified: boolean;
  verificationStatus: string;
}

export default function InstructorSettingsPage() {
  const [bio, setBio] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setError('');
      const response = await fetch('/api/profile/instructor');
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Greška prilikom učitavanja profila');
      }

      const data = await response.json();
      const profile: InstructorProfile = data.profile;

      setBio(profile.bio || '');
      setSpecializations(profile.specializations || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Greška prilikom učitavanja profila';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setError('');

      if (specializations.length === 0) {
        setError('Potrebna je barem jedna specijalizacija');
        return;
      }

      setSaving(true);

      const response = await fetch('/api/profile/instructor', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bio: bio.trim() || null,
          specializations,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška prilikom spremanja profila');
      }

      toast.success('Profil uspješno spremljen!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Greška prilikom spremanja profila';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleSpecialization = (spec: string) => {
    if (specializations.includes(spec)) {
      setSpecializations(specializations.filter((s) => s !== spec));
    } else {
      setSpecializations([...specializations, spec]);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-32 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {[...Array(9)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            </div>
            <Skeleton className="h-10 w-40" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Instruktorski profil</CardTitle>
          <CardDescription>
            Uredite svoju biografiju i specijalizacije koje će biti prikazane na vašem javnom profilu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Biografija */}
          <div className="space-y-2">
            <Label htmlFor="bio">Biografija</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Opišite svoje iskustvo u kuharstvu, edukaciju, postignuća i stručnost..."
              rows={8}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              Biografija će biti prikazana polaznicima na vašem javnom profilu
            </p>
          </div>

          {/* Specijalizacije */}
          <div className="space-y-3">
            <div>
              <Label>Specijalizacije *</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Odaberite područja kuhanja u kojima ste specijalizirani
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {SPECIALIZATIONS.map((spec) => (
                <div key={spec} className="flex items-center space-x-2">
                  <Checkbox
                    id={spec}
                    checked={specializations.includes(spec)}
                    onCheckedChange={() => toggleSpecialization(spec)}
                  />
                  <label
                    htmlFor={spec}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {spec}
                  </label>
                </div>
              ))}
            </div>

            {/* Selected specializations badges */}
            {specializations.length > 0 && (
              <div className="pt-2">
                <p className="text-sm font-medium mb-2">Odabrane specijalizacije:</p>
                <div className="flex flex-wrap gap-2">
                  {specializations.map((spec) => (
                    <Badge key={spec} variant="secondary">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {specializations.length === 0 && (
              <p className="text-sm text-destructive">
                Potrebna je barem jedna specijalizacija
              </p>
            )}
          </div>

          {/* Save button */}
          <div className="flex items-center gap-4">
            <Button
              onClick={handleSave}
              disabled={saving || specializations.length === 0}
              className="min-w-[150px]"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Spremam...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Spremi promjene
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
