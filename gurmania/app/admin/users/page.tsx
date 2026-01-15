"use client";

import { useEffect, useState } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MoreHorizontal, CheckCircle2, XCircle, Search } from "lucide-react";
import { toast } from "sonner";

type User = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  instructorProfile?: {
    verified: boolean;
    verificationStatus: string;
  } | null;
  _count: {
    courses: number;
  };
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState({
    search: "",
    role: "all",
    status: "all",
  });

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.role !== "all" && { role: filters.role }),
        ...(filters.status !== "all" && { status: filters.status }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error("Greška pri dohvaćanju korisnika");

      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      toast.error("Greška pri učitavanju korisnika");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, filters]);

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) throw new Error("Greška pri promjeni uloge");

      toast.success("Uloga korisnika uspješno promijenjena");
      setRoleDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error("Greška pri promjeni uloge");
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !selectedUser.isActive }),
      });

      if (!response.ok) throw new Error("Greška pri promjeni statusa");

      toast.success(
        selectedUser.isActive
          ? "Korisnik uspješno deaktiviran"
          : "Korisnik uspješno aktiviran"
      );
      setStatusDialogOpen(false);
      fetchUsers();
    } catch (error) {
      toast.error("Greška pri promjeni statusa");
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-500";
      case "INSTRUCTOR":
        return "bg-blue-500";
      case "STUDENT":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRoleLabel = (user: User) => {
    const role = user.role;
    switch (role) {
      case "ADMIN":
        return "Administrator";
      case "INSTRUCTOR":
        // Only show as Instructor if verified
        if (user.instructorProfile?.verified) {
          return "Instruktor";
        }
        // Show as Polaznik with pending/rejected status
        return "Polaznik";
      case "STUDENT":
        return "Polaznik";
      default:
        return role;
    }
  };

  const getRoleBadgeInfo = (user: User) => {
    const role = user.role;
    if (role === "INSTRUCTOR") {
      // Check verification status
      if (!user.instructorProfile?.verified) {
        const status = user.instructorProfile?.verificationStatus;
        if (status === "PENDING") {
          return { color: "bg-yellow-500", label: "Polaznik (Zahtjev za instruktora na čekanju)" };
        } else if (status === "REJECTED") {
          return { color: "bg-gray-500", label: "Polaznik (Zahtjev za instruktora odbijen)" };
        }
        return { color: "bg-green-500", label: "Polaznik" };
      }
      return { color: "bg-blue-500", label: "Instruktor" };
    }
    return { color: getRoleBadgeColor(role), label: getRoleLabel(user) };
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Nikad";
    return new Date(date).toLocaleDateString("hr-HR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Korisnici</h1>
        <p className="text-muted-foreground">
          Upravljajte svim korisnicima sustava
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pretraži po imenu ili emailu..."
            value={filters.search}
            onChange={(e) => {
              setFilters({ ...filters, search: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="pl-9"
          />
        </div>

        <Select
          value={filters.role}
          onValueChange={(value) => {
            setFilters({ ...filters, role: value });
            setPagination({ ...pagination, page: 1 });
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Uloga" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Sve uloge</SelectItem>
            <SelectItem value="student">Polaznici</SelectItem>
            <SelectItem value="instructor">Instruktori</SelectItem>
            <SelectItem value="admin">Administratori</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status}
          onValueChange={(value) => {
            setFilters({ ...filters, status: value });
            setPagination({ ...pagination, page: 1 });
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Svi statusi</SelectItem>
            <SelectItem value="active">Aktivni</SelectItem>
            <SelectItem value="inactive">Neaktivni</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Korisnik</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Uloga</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Zadnja prijava</TableHead>
              <TableHead className="text-right">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Nema pronađenih korisnika
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.image || undefined} />
                        <AvatarFallback>
                          {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.name || "Bez imena"}</div>
                        {user.instructorProfile?.verified && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <CheckCircle2 className="h-3 w-3" />
                            Verificiran instruktor
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {(() => {
                      const badgeInfo = getRoleBadgeInfo(user);
                      return (
                        <div className="flex flex-col gap-1">
                          <Badge className={badgeInfo.color}>
                            {badgeInfo.label}
                          </Badge>
                          {user.role === "INSTRUCTOR" && !user.instructorProfile?.verified && (
                            <span className="text-xs text-muted-foreground">
                              Uloga: INSTRUCTOR (neverificiran)
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <Badge variant="outline" className="border-green-500 text-green-700">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Aktivan
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-red-500 text-red-700">
                        <XCircle className="h-3 w-3 mr-1" />
                        Neaktivan
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(user.lastLoginAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setNewRole(user.role);
                            setRoleDialogOpen(true);
                          }}
                        >
                          Promijeni ulogu
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedUser(user);
                            setStatusDialogOpen(true);
                          }}
                        >
                          {user.isActive ? "Deaktiviraj" : "Aktiviraj"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Prikazano {users.length} od {pagination.total} korisnika
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1 || loading}
          >
            Prethodna
          </Button>
          <Button
            variant="outline"
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page >= pagination.totalPages || loading}
          >
            Sljedeća
          </Button>
        </div>
      </div>

      {/* Role Change Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promjena uloge korisnika</DialogTitle>
            <DialogDescription>
              Promijenite ulogu korisnika {selectedUser?.name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Odaberite ulogu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STUDENT">Polaznik</SelectItem>
                <SelectItem value="INSTRUCTOR">Instruktor</SelectItem>
                <SelectItem value="ADMIN">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleDialogOpen(false)}
              disabled={actionLoading}
            >
              Odustani
            </Button>
            <Button onClick={handleRoleChange} disabled={actionLoading}>
              {actionLoading ? "Spremam..." : "Spremi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Toggle Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedUser?.isActive ? "Deaktivacija korisnika" : "Aktivacija korisnika"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedUser?.isActive ? (
                <>
                  Jeste li sigurni da želite deaktivirati korisnika{" "}
                  <strong>{selectedUser?.name || selectedUser?.email}</strong>?
                  {selectedUser?.role === "INSTRUCTOR" && selectedUser?._count.courses > 0 && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
                      <strong>Upozorenje:</strong> Deaktivacija instruktora će automatski 
                      sakriti sve njihove tečajeve ({selectedUser._count.courses} tečajeva).
                    </div>
                  )}
                </>
              ) : (
                <>
                  Jeste li sigurni da želite aktivirati korisnika{" "}
                  <strong>{selectedUser?.name || selectedUser?.email}</strong>?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Odustani</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusToggle} disabled={actionLoading}>
              {actionLoading ? "Spremam..." : "Potvrdi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
