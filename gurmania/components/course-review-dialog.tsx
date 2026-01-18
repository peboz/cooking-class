'use client';

import { useState } from 'react';
import { Star, Upload, X, Image as ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Image from 'next/image';

interface CourseReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  existingReview?: {
    id: string;
    rating: number;
    comment: string | null;
    photoUrl: string | null;
  } | null;
  onSuccess?: () => void;
}

export function CourseReviewDialog({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  existingReview,
  onSuccess,
}: CourseReviewDialogProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    existingReview?.photoUrl || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Molimo odaberite sliku');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Slika ne smije biti veća od 5MB');
      return;
    }

    setPhoto(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoPreview(existingReview?.photoUrl || null);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Molimo odaberite ocjenu');
      return;
    }

    if (comment.length > 2000) {
      toast.error('Komentar ne smije biti duži od 2000 znakova');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('rating', rating.toString());
      if (comment.trim()) {
        formData.append('comment', comment.trim());
      }
      if (photo) {
        formData.append('photo', photo);
      }

      const response = await fetch(`/api/courses/${courseId}/reviews`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Greška pri spremanju recenzije');
      }

      toast.success(data.message || 'Recenzija je uspješno spremljena');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(
        error instanceof Error ? error.message : 'Greška pri spremanju recenzije'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {existingReview ? 'Uredi recenziju' : 'Ocijeni tečaj'}
          </DialogTitle>
          <DialogDescription>{courseTitle}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Vaša ocjena *</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded"
                  aria-label={`Ocjena ${star} od 5`}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating} od 5
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Vaš komentar (opcionalno)</Label>
            <Textarea
              id="comment"
              placeholder="Podijelite svoje iskustvo s ovim tečajem..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              maxLength={2000}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Podijelite što vam se svidjelo ili što bi moglo biti bolje</span>
              <span>{comment.length}/2000</span>
            </div>
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Fotografija (opcionalno)</Label>
            <p className="text-xs text-muted-foreground">
              Dodajte fotografiju svojeg gotovog jela
            </p>

            {photoPreview ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                <Image
                  src={photoPreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white transition-colors hover:bg-black/70"
                  aria-label="Ukloni fotografiju"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label
                htmlFor="photo-upload"
                className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition-colors hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-900"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <ImageIcon className="h-10 w-10 text-gray-400" />
                  <div className="text-sm">
                    <span className="font-semibold text-orange-600">
                      Kliknite za odabir
                    </span>
                    <span className="text-gray-500"> ili povucite sliku</span>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG do 5MB</p>
                </div>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="sr-only"
                />
              </label>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Odustani
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
          >
            {isSubmitting ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Spremanje...
              </>
            ) : existingReview ? (
              'Ažuriraj recenziju'
            ) : (
              'Objavi recenziju'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
