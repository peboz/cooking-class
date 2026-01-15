"use client";

import { useEffect, useState, useRef, useCallback, Fragment } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronDown, ChevronUp, ExternalLink, Filter, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type AuditLog = {
  id: string;
  userId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
  } | null;
};

const ACTION_TYPES = [
  { value: "all", label: "Sve akcije" },
  { value: "USER_CREATED", label: "Kreiran korisnik" },
  { value: "USER_ROLE_CHANGED", label: "Promjena uloge" },
  { value: "USER_SUSPENDED", label: "Suspenzija korisnika" },
  { value: "USER_ACTIVATED", label: "Aktivacija korisnika" },
  { value: "USER_DEACTIVATED", label: "Deaktivacija korisnika" },
  { value: "INSTRUCTOR_VERIFIED", label: "Verifikacija instruktora" },
  { value: "INSTRUCTOR_COURSES_HIDDEN", label: "Skriveni tečajevi instruktora" },
  { value: "COURSE_CREATED", label: "Kreiran tečaj" },
  { value: "COURSE_PUBLISHED", label: "Objavljen tečaj" },
  { value: "COURSE_UNPUBLISHED", label: "Povučen tečaj" },
  { value: "COURSE_DELETED", label: "Obrisan tečaj" },
  { value: "COMMENT_APPROVED", label: "Odobren komentar" },
  { value: "COMMENT_REJECTED", label: "Odbijen komentar" },
  { value: "VERIFICATION_APPROVED", label: "Odobrena verifikacija" },
  { value: "VERIFICATION_REJECTED", label: "Odbijena verifikacija" },
];

const ENTITY_TYPES = [
  { value: "all", label: "Svi tipovi" },
  { value: "User", label: "Korisnik" },
  { value: "Course", label: "Tečaj" },
  { value: "Lesson", label: "Lekcija" },
  { value: "Comment", label: "Komentar" },
  { value: "InstructorProfile", label: "Profil instruktora" },
  { value: "Workshop", label: "Radionica" },
];

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [metadataDialog, setMetadataDialog] = useState<{ open: boolean; data: any }>({
    open: false,
    data: null,
  });

  const [filters, setFilters] = useState({
    search: "",
    action: "all",
    entityType: "all",
    dateFrom: "",
    dateTo: "",
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);
  const observerTarget = useRef<HTMLDivElement>(null);

  const fetchLogs = async (cursor?: string | null, isNewSearch = false) => {
    if (isNewSearch) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      params.append("limit", "25");
      
      if (cursor) {
        params.append("cursor", cursor);
      }

      if (appliedFilters.action && appliedFilters.action !== "all") {
        params.append("action", appliedFilters.action);
      }

      if (appliedFilters.entityType && appliedFilters.entityType !== "all") {
        params.append("entityType", appliedFilters.entityType);
      }

      if (appliedFilters.search) {
        params.append("search", appliedFilters.search);
      }

      if (appliedFilters.dateFrom) {
        params.append("dateFrom", appliedFilters.dateFrom);
      }

      if (appliedFilters.dateTo) {
        params.append("dateTo", appliedFilters.dateTo);
      }

      const response = await fetch(`/api/admin/audit-log?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch audit logs");
      }

      const data = await response.json();

      if (isNewSearch) {
        setLogs(data.logs);
      } else {
        setLogs((prev) => [...prev, ...data.logs]);
      }

      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Greška pri dohvaćanju logova");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setNextCursor(null);
    fetchLogs(null, true);
  };

  const handleResetFilters = () => {
    const resetFilters = {
      search: "",
      action: "all",
      entityType: "all",
      dateFrom: "",
      dateTo: "",
    };
    setFilters(resetFilters);
    setAppliedFilters(resetFilters);
    setNextCursor(null);
    fetchLogs(null, true);
  };

  useEffect(() => {
    fetchLogs(null, true);
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchLogs(nextCursor, false);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, nextCursor]);

  const getActionLabel = (action: string) => {
    const found = ACTION_TYPES.find((a) => a.value === action);
    return found?.label || action;
  };

  const getActionVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    if (action.includes("DELETE") || action.includes("REJECT") || action.includes("SUSPEND")) {
      return "destructive";
    }
    if (action.includes("APPROV") || action.includes("ACTIVAT") || action.includes("VERIFI")) {
      return "default";
    }
    if (action.includes("CREAT") || action.includes("PUBLISH")) {
      return "secondary";
    }
    return "outline";
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("hr-HR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getEntityLink = (entityType: string | null, entityId: string | null) => {
    if (!entityType || !entityId) return null;

    switch (entityType) {
      case "User":
        return `/admin/users?userId=${entityId}`;
      case "Course":
        return `/admin/courses?courseId=${entityId}`;
      case "Comment":
        return `/admin/comments?commentId=${entityId}`;
      case "InstructorProfile":
        return `/admin/verification-requests`;
      default:
        return null;
    }
  };

  const hasActiveFilters = () => {
    return (
      appliedFilters.search !== "" ||
      appliedFilters.action !== "all" ||
      appliedFilters.entityType !== "all" ||
      appliedFilters.dateFrom !== "" ||
      appliedFilters.dateTo !== ""
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Log</h1>
        <p className="text-muted-foreground">
          Povijest svih admin akcija i sistemskih događaja
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filteri
          </CardTitle>
          <CardDescription>
            Filtrirajte audit logove prema različitim kriterijima
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pretraga</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Korisnik, email, IP adresa..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tip akcije</label>
              <Select
                value={filters.action}
                onValueChange={(value) => setFilters({ ...filters, action: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tip entiteta</label>
              <Select
                value={filters.entityType}
                onValueChange={(value) => setFilters({ ...filters, entityType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Datum od</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Datum do</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleApplyFilters}>
              Primijeni filtere
            </Button>
            {hasActiveFilters() && (
              <Button variant="outline" onClick={handleResetFilters}>
                <X className="h-4 w-4 mr-2" />
                Resetiraj filtere
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Logovi</CardTitle>
          <CardDescription>
            {loading ? "Učitavanje..." : `Ukupno učitano: ${logs.length} ${hasMore ? "(učitavanje dodatnih...)" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nema logova za prikaz</p>
            </div>
          ) : (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>Datum i vrijeme</TableHead>
                      <TableHead>Akcija</TableHead>
                      <TableHead>Administrator</TableHead>
                      <TableHead>Entitet</TableHead>
                      <TableHead className="hidden lg:table-cell">IP adresa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <Fragment key={log.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            setExpandedRow(expandedRow === log.id ? null : log.id)
                          }
                        >
                          <TableCell>
                            {expandedRow === log.id ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="text-sm whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getActionVariant(log.action)}>
                              {getActionLabel(log.action)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {log.user ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={log.user.image || undefined} />
                                  <AvatarFallback>
                                    {log.user.name?.charAt(0) || log.user.email?.charAt(0) || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">
                                    {log.user.name || "Bez imena"}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {log.user.email}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Sistem</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.entityType && log.entityId ? (
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium">{log.entityType}</span>
                                <code className="text-xs text-muted-foreground bg-muted px-1 py-0.5 rounded">
                                  {log.entityId.substring(0, 12)}...
                                </code>
                                {getEntityLink(log.entityType, log.entityId) && (
                                  <Link
                                    href={getEntityLink(log.entityType, log.entityId)!}
                                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Pogledaj
                                    <ExternalLink className="h-3 w-3" />
                                  </Link>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {log.ipAddress ? (
                              <code className="text-xs bg-muted px-2 py-1 rounded">
                                {log.ipAddress}
                              </code>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                        {expandedRow === log.id && (
                          <TableRow>
                            <TableCell colSpan={6} className="bg-muted/30">
                              <div className="space-y-3 py-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <h4 className="text-sm font-semibold mb-2">
                                      User Agent
                                    </h4>
                                    <p className="text-xs text-muted-foreground font-mono bg-background p-2 rounded border break-all">
                                      {log.userAgent || "Nije dostupno"}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-semibold mb-2">
                                      IP adresa
                                    </h4>
                                    <p className="text-xs text-muted-foreground font-mono bg-background p-2 rounded border">
                                      {log.ipAddress || "Nije dostupno"}
                                    </p>
                                  </div>
                                </div>

                                {log.metadata && (
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <h4 className="text-sm font-semibold">Metadata</h4>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setMetadataDialog({ open: true, data: log.metadata });
                                        }}
                                      >
                                        Prikaži cijeli JSON
                                      </Button>
                                    </div>
                                    <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
                                      {JSON.stringify(log.metadata, null, 2).substring(0, 500)}
                                      {JSON.stringify(log.metadata, null, 2).length > 500 && "..."}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Infinite scroll trigger */}
              <div ref={observerTarget} className="py-4">
                {loadingMore && (
                  <div className="flex justify-center">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      <span>Učitavanje...</span>
                    </div>
                  </div>
                )}
                {!hasMore && logs.length > 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    Nema više logova za prikaz
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Metadata Dialog */}
      <Dialog open={metadataDialog.open} onOpenChange={(open) => setMetadataDialog({ ...metadataDialog, open })}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Metadata (JSON)</DialogTitle>
            <DialogDescription>
              Potpuni prikaz metadata informacija za ovaj log
            </DialogDescription>
          </DialogHeader>
          <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
            {JSON.stringify(metadataDialog.data, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
