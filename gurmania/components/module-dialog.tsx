"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';

interface ModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  courseId: string;
  module?: {
    id: string;
    title: string;
    description: string | null;
  } | null;
}

export function ModuleDialog({ open, onOpenChange, onSuccess, courseId, module }: ModuleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  // Reset form when dialog opens - this is safe because we only update when open changes
  useEffect(() => {
    if (open) {
      // Use queueMicrotask to defer state update until after render
      queueMicrotask(() => {
        setFormData(
          module
            ? { title: module.title, description: module.description || '' }
            : { title: '', description: '' }
        );
        setError('');
      });
    }
  }, [open, module]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = module
        ? `/api/instructor/courses/${courseId}/modules/${module.id}`
        : `/api/instructor/courses/${courseId}/modules`;
      
      const method = module ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Došlo je do greške');
        setLoading(false);
        return;
      }

      // Success
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError('Došlo je do greške. Molimo pokušajte ponovno.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{module ? 'Uredi modul' : 'Kreiraj modul'}</DialogTitle>
            <DialogDescription>
              {module ? 'Ažurirajte informacije o modulu.' : 'Dodajte novi modul u tečaj.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="module-title">Naziv modula *</Label>
              <Input
                id="module-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="npr. Osnove talijanskog tijesta"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="module-description">Opis</Label>
              <Textarea
                id="module-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Kratki opis modula..."
                rows={3}
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Odustani
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {module ? 'Spremi' : 'Kreiraj modul'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
