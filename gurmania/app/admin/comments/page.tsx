'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  HelpCircle,
  MessageSquare,
  Search,
} from 'lucide-react';
import Link from 'next/link';

interface CommentUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Comment {
  id: string;
  content: string;
  isQuestion: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  user: CommentUser;
  lesson: {
    id: string;
    title: string;
    module: {
      course: {
        id: string;
        title: string;
      };
    };
  };
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [action, setAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadComments();
  }, [filter]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const url = filter === 'all'
        ? '/api/admin/comments'
        : `/api/admin/comments?status=${filter}`;

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (comment: Comment, actionType: 'APPROVE' | 'REJECT') => {
    setSelectedComment(comment);
    setAction(actionType);
    setActionDialogOpen(true);
  };

  const submitAction = async () => {
    if (!selectedComment || !action) return;

    setProcessing(true);

    try {
      const response = await fetch(`/api/admin/comments/${selectedComment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        }),
      });

      if (response.ok) {
        setActionDialogOpen(false);
        loadComments();
      } else {
        const data = await response.json();
        alert(data.error || 'Došlo je do greške');
      }
    } catch (error) {
      console.error('Error processing action:', error);
      alert('Došlo je do greške');
    } finally {
      setProcessing(false);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Na čekanju
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Odobreno
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Odbijeno
          </Badge>
        );
      default:
        return null;
    }
  };

  const filteredComments = comments.filter((comment) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      comment.content.toLowerCase().includes(query) ||
      comment.user.name?.toLowerCase().includes(query) ||
      comment.user.email.toLowerCase().includes(query) ||
      comment.lesson.title.toLowerCase().includes(query) ||
      comment.lesson.module.course.title.toLowerCase().includes(query)
    );
  });

  const pendingCount = comments.filter((c) => c.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Moderacija komentara</h1>
        <p className="text-muted-foreground">
          Upravljajte komentarima i pitanjima na lekcijama
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            Svi
          </Button>
          <Button
            variant={filter === 'PENDING' ? 'default' : 'outline'}
            onClick={() => setFilter('PENDING')}
            className="gap-2"
          >
            Na čekanju
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={filter === 'APPROVED' ? 'default' : 'outline'}
            onClick={() => setFilter('APPROVED')}
          >
            Odobreni
          </Button>
          <Button
            variant={filter === 'REJECTED' ? 'default' : 'outline'}
            onClick={() => setFilter('REJECTED')}
          >
            Odbijeni
          </Button>
        </div>

        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pretraži komentare, korisnike, lekcije..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Učitavanje...</p>
        </div>
      ) : filteredComments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium">Nema komentara</p>
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? 'Pokušajte s drugim pojmom za pretraživanje'
                : 'Komentari će se pojaviti ovdje'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredComments.map((comment) => (
            <Card key={comment.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={comment.user.image || undefined} />
                      <AvatarFallback>{getUserInitials(comment.user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {comment.user.name || 'Nepoznat korisnik'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {comment.user.email}
                        </span>
                        {getStatusBadge(comment.status)}
                        {comment.isQuestion && (
                          <Badge variant="outline" className="gap-1">
                            <HelpCircle className="h-3 w-3" />
                            Pitanje
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        <Link
                          href={`/app/courses/${comment.lesson.module.course.id}/lessons/${comment.lesson.id}`}
                          className="hover:underline"
                        >
                          {comment.lesson.module.course.title} → {comment.lesson.title}
                        </Link>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(comment.createdAt).toLocaleString('hr-HR')}
                      </p>
                    </div>
                  </div>
                  {comment.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleAction(comment, 'APPROVE')}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Odobri
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleAction(comment, 'REJECT')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Odbij
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap break-words">{comment.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'APPROVE' ? 'Odobri komentar' : 'Odbij komentar'}
            </DialogTitle>
            <DialogDescription>
              {action === 'APPROVE'
                ? 'Komentar će biti vidljiv svim korisnicima.'
                : 'Komentar će biti odbijen i vidljiv samo autoru.'}
            </DialogDescription>
          </DialogHeader>

          {selectedComment && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium mb-1">
                  {selectedComment.user.name || 'Nepoznat korisnik'}
                </p>
                <p className="text-sm whitespace-pre-wrap break-words">
                  {selectedComment.content}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionDialogOpen(false)}
              disabled={processing}
            >
              Odustani
            </Button>
            <Button
              onClick={submitAction}
              disabled={processing}
              variant={action === 'APPROVE' ? 'default' : 'destructive'}
            >
              {processing
                ? 'Obrada...'
                : action === 'APPROVE'
                ? 'Odobri'
                : 'Odbij'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
