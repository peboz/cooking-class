'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CommentCard } from './comment-card';
import { CommentForm } from './comment-form';
import { MessageSquare, HelpCircle, RefreshCw } from 'lucide-react';

interface CommentUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface CommentReply {
  id: string;
  content: string;
  createdAt: string;
  user: CommentUser;
}

interface Comment {
  id: string;
  content: string;
  isQuestion: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  user: CommentUser;
  replies: CommentReply[];
  canEdit: boolean;
  canDelete: boolean;
  canModerate: boolean;
  isInstructor: boolean;
}

interface CommentsMeta {
  isInstructor: boolean;
  isAdmin: boolean;
  courseInstructorId: string;
}

interface CommentsSectionProps {
  courseId: string;
  lessonId: string;
  currentUserId: string;
}

export function CommentsSection({ courseId, lessonId, currentUserId }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [meta, setMeta] = useState<CommentsMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'questions'>('all');

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/courses/${courseId}/lessons/${lessonId}/comments`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Greška pri dohvaćanju komentara');
      }

      const data = await response.json();
      setComments(data.comments);
      setMeta(data.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri dohvaćanju komentara');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [courseId, lessonId]);

  const filteredComments = comments.filter((comment) => {
    if (filter === 'questions') {
      return comment.isQuestion;
    }
    return true;
  });

  const questionsCount = comments.filter((c) => c.isQuestion).length;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Komentari i pitanja
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Komentari i pitanja
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={fetchComments}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Svi ({comments.length})
          </Button>
          <Button
            variant={filter === 'questions' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('questions')}
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Pitanja ({questionsCount})
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* New Comment Form */}
        <div>
          <h3 className="mb-3 text-sm font-medium">Dodaj komentar</h3>
          <CommentForm
            courseId={courseId}
            lessonId={lessonId}
            onSuccess={fetchComments}
          />
        </div>

        <Separator />

        {/* Comments List */}
        {filteredComments.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            {filter === 'questions' ? (
              <div className="flex flex-col items-center gap-2">
                <HelpCircle className="h-12 w-12 opacity-20" />
                <p>Još nema pitanja</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <MessageSquare className="h-12 w-12 opacity-20" />
                <p>Još nema komentara</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredComments.map((comment) => (
              <div key={comment.id}>
                <CommentCard
                  comment={comment}
                  courseId={courseId}
                  lessonId={lessonId}
                  currentUserId={currentUserId}
                  courseInstructorId={meta?.courseInstructorId || ''}
                  onUpdate={fetchComments}
                />
                <Separator className="mt-6" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
