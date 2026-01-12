'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HelpCircle, MessageSquare, MoreVertical, Pencil, Trash2, Reply } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { hr } from 'date-fns/locale';

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

interface CommentCardProps {
  comment: Comment;
  courseId: string;
  lessonId: string;
  currentUserId: string;
  courseInstructorId: string;
  onUpdate: () => void;
}

export function CommentCard({
  comment,
  courseId,
  lessonId,
  currentUserId,
  courseInstructorId,
  onUpdate,
}: CommentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === comment.content) {
      setIsEditing(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/courses/${courseId}/lessons/${lessonId}/comments/${comment.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: editContent.trim() }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Greška pri ažuriranju komentara');
      }

      setIsEditing(false);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri ažuriranju komentara');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Jeste li sigurni da želite izbrisati ovaj komentar?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/courses/${courseId}/lessons/${lessonId}/comments/${comment.id}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Greška pri brisanju komentara');
      }

      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri brisanju komentara');
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (status: 'APPROVED' | 'REJECTED') => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/courses/${courseId}/lessons/${lessonId}/comments/${comment.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Greška pri moderiranju komentara');
      }

      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri moderiranju komentara');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/courses/${courseId}/lessons/${lessonId}/comments/${comment.id}/replies`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: replyContent.trim() }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Greška pri stvaranju odgovora');
      }

      setReplyContent('');
      setIsReplying(false);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri stvaranju odgovora');
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const isCommentAuthor = comment.user.id === currentUserId;

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={comment.user.image || undefined} />
          <AvatarFallback>{getUserInitials(comment.user.name)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{comment.user.name || 'Nepoznat korisnik'}</span>
              {comment.isInstructor && (
                <Badge variant="secondary" className="text-xs">
                  Instruktor
                </Badge>
              )}
              {comment.isQuestion && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <HelpCircle className="h-3 w-3" />
                  Pitanje
                </Badge>
              )}
              {comment.status === 'PENDING' && (
                <Badge variant="outline" className="text-xs text-yellow-600">
                  Na čekanju
                </Badge>
              )}
              {comment.status === 'REJECTED' && (
                <Badge variant="destructive" className="text-xs">
                  Odbijeno
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), {
                  addSuffix: true,
                  locale: hr,
                })}
              </span>
            </div>

            {(comment.canEdit || comment.canDelete || comment.canModerate) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {comment.canEdit && (
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Uredi
                    </DropdownMenuItem>
                  )}
                  {comment.canDelete && (
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Izbriši
                    </DropdownMenuItem>
                  )}
                  {comment.canModerate && comment.status === 'PENDING' && (
                    <>
                      <DropdownMenuItem onClick={() => handleModerate('APPROVED')}>
                        Odobri
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleModerate('REJECTED')}>
                        Odbij
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Uredite svoj komentar..."
                maxLength={2000}
                rows={3}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {editContent.length}/2000
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(comment.content);
                      setError(null);
                    }}
                    disabled={loading}
                  >
                    Odustani
                  </Button>
                  <Button size="sm" onClick={handleEdit} disabled={loading}>
                    Spremi
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
          )}

          {!isEditing && comment.status === 'APPROVED' && (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying(!isReplying)}
                className="h-8 gap-1"
              >
                <Reply className="h-3.5 w-3.5" />
                Odgovori
              </Button>
              {comment.replies.length > 0 && (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" />
                  {comment.replies.length}
                </span>
              )}
            </div>
          )}

          {isReplying && (
            <div className="space-y-2 pt-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Napišite odgovor..."
                maxLength={2000}
                rows={2}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {replyContent.length}/2000
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsReplying(false);
                      setReplyContent('');
                      setError(null);
                    }}
                    disabled={loading}
                  >
                    Odustani
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleReply}
                    disabled={loading || !replyContent.trim()}
                  >
                    Odgovori
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Replies */}
          {comment.replies.length > 0 && (
            <div className="mt-4 space-y-4 border-l-2 pl-4">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={reply.user.image || undefined} />
                    <AvatarFallback>{getUserInitials(reply.user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">
                        {reply.user.name || 'Nepoznat korisnik'}
                      </span>
                      {reply.user.id === courseInstructorId && (
                        <Badge variant="secondary" className="text-xs">
                          Instruktor
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(reply.createdAt), {
                          addSuffix: true,
                          locale: hr,
                        })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">{reply.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
