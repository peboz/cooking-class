"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Eye, Clock, FileText } from "lucide-react";

interface VerificationRequest {
  id: string;
  bio: string;
  specializations: string[];
  verificationStatus: string;
  verificationReason: string | null;
  verificationDocumentUrl: string | null;
  verified: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

export default function VerificationRequestsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [action, setAction] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [reason, setReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [filter]);

  const loadRequests = async () => {
    try {
      const url = filter === 'all' 
        ? '/api/admin/verification-requests'
        : `/api/admin/verification-requests?status=${filter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setRequests(data.requests);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (request: VerificationRequest, actionType: 'APPROVE' | 'REJECT') => {
    setSelectedRequest(request);
    setAction(actionType);
    setReason("");
    setActionDialogOpen(true);
  };

  const submitAction = async () => {
    if (!selectedRequest || !action) return;

    setProcessing(true);

    try {
      const response = await fetch(`/api/admin/verification-requests/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reason: reason.trim() || null,
        }),
      });

      if (response.ok) {
        setActionDialogOpen(false);
        loadRequests(); // Reload the list
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="gap-1"><Clock className="w-3 h-3" /> Na čekanju</Badge>;
      case 'APPROVED':
        return <Badge className="gap-1 bg-green-600"><CheckCircle className="w-3 h-3" /> Odobreno</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Odbijeno</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const pendingCount = requests.filter(r => r.verificationStatus === 'PENDING').length;

  if (loading) {
    return <div>Učitavanje...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Zahtjevi za verifikaciju</h1>
          <p className="text-muted-foreground">
            Pregledajte i odobrite zahtjeve korisnika za status instruktora.
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {pendingCount} na čekanju
        </Badge>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={filter === 'PENDING' ? 'default' : 'ghost'}
          onClick={() => setFilter('PENDING')}
          className={filter === 'PENDING' ? 'bg-orange-600 hover:bg-orange-700' : ''}
        >
          Na čekanju
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'ghost'}
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'bg-orange-600 hover:bg-orange-700' : ''}
        >
          Svi
        </Button>
        <Button
          variant={filter === 'APPROVED' ? 'default' : 'ghost'}
          onClick={() => setFilter('APPROVED')}
          className={filter === 'APPROVED' ? 'bg-orange-600 hover:bg-orange-700' : ''}
        >
          Odobreni
        </Button>
        <Button
          variant={filter === 'REJECTED' ? 'default' : 'ghost'}
          onClick={() => setFilter('REJECTED')}
          className={filter === 'REJECTED' ? 'bg-orange-600 hover:bg-orange-700' : ''}
        >
          Odbijeni
        </Button>
      </div>

      {/* Requests list */}
      {requests.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">Nema zahtjeva za prikaz.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="rounded-lg border bg-card p-6">
              <div className="flex items-start gap-4">
                {/* User avatar */}
                <Avatar className="h-16 w-16">
                  <AvatarImage src={request.user.image || undefined} />
                  <AvatarFallback>
                    {request.user.name?.charAt(0) || request.user.email.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-3">
                  {/* User info */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">{request.user.name || request.user.email}</h3>
                      {getStatusBadge(request.verificationStatus)}
                    </div>
                    <p className="text-sm text-muted-foreground">{request.user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Poslano: {new Date(request.createdAt).toLocaleDateString('hr-HR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Bio */}
                  <div>
                    <Label className="text-sm font-medium">Biografija</Label>
                    <p className="text-sm mt-1">{request.bio}</p>
                  </div>

                  {/* Specializations */}
                  <div>
                    <Label className="text-sm font-medium">Specijalizacije</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {request.specializations.map((spec) => (
                        <Badge key={spec} variant="secondary">{spec}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Verification document */}
                  {request.verificationDocumentUrl && (
                    <div>
                      <a
                        href={request.verificationDocumentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline"
                      >
                        <FileText className="w-4 h-4" />
                        Pregled verifikacijskog dokumenta
                      </a>
                    </div>
                  )}

                  {/* Reason (if rejected or approved with reason) */}
                  {request.verificationReason && (
                    <div className="rounded-md bg-muted p-3">
                      <Label className="text-sm font-medium">
                        {request.verificationStatus === 'REJECTED' ? 'Razlog odbijanja' : 'Napomena'}
                      </Label>
                      <p className="text-sm mt-1">{request.verificationReason}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {request.verificationStatus === 'PENDING' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => handleAction(request, 'APPROVE')}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Odobri
                      </Button>
                      <Button
                        onClick={() => handleAction(request, 'REJECT')}
                        variant="destructive"
                        className="gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Odbij
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'APPROVE' ? 'Odobri zahtjev' : 'Odbij zahtjev'}
            </DialogTitle>
            <DialogDescription>
              {action === 'APPROVE'
                ? 'Korisnik će dobiti status instruktora i moći će kreirati tečajeve.'
                : 'Korisnik neće dobiti status instruktora.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedRequest && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  {selectedRequest.user.name || selectedRequest.user.email}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest.user.email}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="reason">
                Razlog {action === 'APPROVE' ? '(opcionalno)' : '(preporučeno)'}
              </Label>
              <Textarea
                id="reason"
                placeholder={
                  action === 'APPROVE'
                    ? 'Npr: Odobreno na temelju iskustva i kvalifikacija.'
                    : 'Npr: Dokumentacija nije potpuna ili nije jasna.'
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                {action === 'REJECT' && 'Korisnik će vidjeti ovaj razlog.'}
              </p>
            </div>
          </div>

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
              className={
                action === 'APPROVE'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-destructive hover:bg-destructive/90'
              }
            >
              {processing
                ? 'Procesuiranje...'
                : action === 'APPROVE'
                ? 'Odobri zahtjev'
                : 'Odbij zahtjev'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
