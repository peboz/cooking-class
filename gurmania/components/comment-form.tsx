'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

interface CommentFormProps {
  courseId: string;
  lessonId: string;
  onSuccess: () => void;
}

export function CommentForm({ courseId, lessonId, onSuccess }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isQuestion, setIsQuestion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/courses/${courseId}/lessons/${lessonId}/comments`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: content.trim(),
            isQuestion,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Greška pri stvaranju komentara');
      }

      setContent('');
      setIsQuestion(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri stvaranju komentara');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Napišite komentar ili postavite pitanje..."
          maxLength={2000}
          rows={4}
          disabled={loading}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="is-question"
              checked={isQuestion}
              onCheckedChange={(checked) => setIsQuestion(checked === true)}
              disabled={loading}
            />
            <Label
              htmlFor="is-question"
              className="text-sm font-normal cursor-pointer"
            >
              Označi kao pitanje
            </Label>
          </div>
          <span className="text-sm text-muted-foreground">
            {content.length}/2000
          </span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading || !content.trim()}>
          {loading ? 'Slanje...' : 'Objavi'}
        </Button>
      </div>
    </form>
  );
}
