import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  MapPin, Users, Bed, AlertCircle, Building2, Plus,
  Search, Phone, UserCircle, CheckCircle2, XCircle,
} from "lucide-react";
import { useBranchStore } from "../../store/useBranchStore";
import { useStaffStore } from "../../store/useUserStore";
import { useRoomStore } from "../../store/useRoomStore";
import { BranchModal } from "../../components/modals/BranchModal";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Branches() {
  const navigate = useNavigate();
  const { branches, isLoading, error, fetchBranches, updateBranch } = useBranchStore();
  const { admins, staff, fetchAdmins, fetchAllStaff, isLoading: adminsLoading } = useStaffStore();
  const { fetchRoomsAdmin, isLoading: roomsLoading, calculateRoomCountByHotelId } = useRoomStore();

  const [isModalOpen, setIsModalOpen]                               = useState(false);
  const [search, setSearch]                                         = useState('');
  const [statusFilter, setStatusFilter]                             = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    fetchBranches();
    fetchAdmins();
    fetchAllStaff();
    fetchRoomsAdmin();
  }, [fetchBranches, fetchAdmins, fetchAllStaff, fetchRoomsAdmin]);

  const calculateStaffCount = useCallback((hotelId: string) => {
    if (!Array.isArray(staff) || !hotelId) return 0;
    return staff.filter((s) => {
      if (!s.hotelId) return false;
      const id = typeof s.hotelId === 'object' ? s.hotelId._id : s.hotelId;
      return id === hotelId;
    }).length;
  }, [staff]);

  const enrichedBranches = useMemo(() => {
    if (!Array.isArray(branches)) return [];
    return branches.map((branch) => ({
      ...branch,
      staffCount: calculateStaffCount(branch._id),
      roomCount:  calculateRoomCountByHotelId(branch._id),
    }));
  }, [branches, calculateStaffCount, calculateRoomCountByHotelId]);

  const filteredBranches = useMemo(() => {
    const q = search.toLowerCase();
    return enrichedBranches.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(q) ||
        (b.city?.toLowerCase().includes(q) ?? false) ||
        (b.address?.toLowerCase().includes(q) ?? false);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active'   && b.isActive) ||
        (statusFilter === 'inactive' && !b.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [enrichedBranches, search, statusFilter]);

  const handleToggleActive = async (branchId: string, currentStatus: boolean) => {
    const success = await updateBranch(branchId, { isActive: !currentStatus });
    if (success) {
      toast.success(`Branch ${!currentStatus ? 'activated' : 'deactivated'}.`);
    } else {
      toast.error('Failed to update branch status.');
    }
  };

  // ── Derived summary stats ──────────────────────────────────────────────
  const totalActive   = enrichedBranches.filter((b) => b.isActive).length;
  const totalInactive = enrichedBranches.length - totalActive;
  const totalStaff    = enrichedBranches.reduce((s, b) => s + (b.staffCount ?? 0), 0);
  const totalRooms    = enrichedBranches.reduce((s, b) => s + (b.roomCount  ?? 0), 0);

  const statPills = [
    { label: 'Branches',  value: enrichedBranches.length, Icon: Building2,     cls: 'text-primary' },
    { label: 'Active',    value: totalActive,              Icon: CheckCircle2,  cls: 'text-green-600' },
    { label: 'Inactive',  value: totalInactive,            Icon: XCircle,       cls: 'text-muted-foreground' },
    { label: 'Staff',     value: totalStaff,               Icon: Users,         cls: 'text-blue-500' },
    { label: 'Rooms',     value: totalRooms,               Icon: Bed,           cls: 'text-violet-500' },
  ];

  // ── Loading skeleton ───────────────────────────────────────────────────
  if ((isLoading || roomsLoading) && enrichedBranches.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="flex gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-9 w-28 rounded-full" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-l-4 border-l-muted">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Separator />
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="h-7 w-20 rounded-full" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center h-64 bg-card rounded-xl border border-destructive/20">
        <AlertCircle className="h-12 w-12 mb-4 text-destructive" />
        <h2 className="text-xl font-semibold mb-1">Could Not Load Branches</h2>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground leading-tight">Branch Management</h1>
            <p className="text-sm text-muted-foreground">Manage all hotel branches and locations</p>
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Add New Branch
        </Button>
      </div>

      {/* ── Summary stat pills ───────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2.5">
        {statPills.map(({ label, value, Icon, cls }) => (
          <div
            key={label}
            className="flex items-center gap-2 bg-muted/50 border rounded-full px-4 py-1.5"
          >
            <Icon className={`h-4 w-4 ${cls}`} />
            <span className="font-bold text-sm text-foreground">{value}</span>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Search + filter bar ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search branches…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={[
                'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors capitalize',
                statusFilter === f
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted',
              ].join(' ')}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Empty state ──────────────────────────────────────────────── */}
      {enrichedBranches.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center h-64 bg-card rounded-xl border border-dashed">
          <Building2 className="h-12 w-12 mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-1">No Branches Found</h2>
          <p className="text-sm text-muted-foreground mb-4">Get started by adding a new branch.</p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Branch
          </Button>
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center h-48 bg-card rounded-xl border border-dashed">
          <Search className="h-10 w-10 mb-3 text-muted-foreground" />
          <h2 className="text-lg font-semibold mb-1">No Results</h2>
          <p className="text-sm text-muted-foreground">Try a different search term or filter.</p>
        </div>
      ) : (
        /* ── Branch card grid ──────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredBranches.map((branch, index) => {
            const active = branch.isActive;
            const manager =
              admins.find((a) => a._id === branch.manager) ||
              staff.find((s)  => s._id === branch.manager);
            const managerName = adminsLoading
              ? 'Loading…'
              : manager ? `${manager.firstName} ${manager.lastName}` : 'Unassigned';

            return (
              <Card
                key={branch._id}
                className={[
                  'hover:shadow-md transition-all animate-in fade-in slide-in-from-bottom border-l-4 overflow-hidden',
                  active ? 'border-l-green-500' : 'border-l-gray-300',
                ].join(' ')}
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <CardContent className="p-5 space-y-3">

                  {/* Header row */}
                  <div className="flex items-start gap-3">
                    <div
                      className={[
                        'h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-white font-bold text-sm',
                        active ? 'bg-green-500' : 'bg-gray-400',
                      ].join(' ')}
                    >
                      {branch.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base text-foreground leading-tight truncate">
                          {branch.name}
                        </h3>
                        <Badge
                          className={
                            active
                              ? 'bg-green-100 text-green-700 border border-green-200 text-[11px]'
                              : 'bg-gray-100 text-gray-500 border border-gray-200 text-[11px]'
                          }
                        >
                          {active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                        <UserCircle className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{managerName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Location info */}
                  <div className="space-y-1.5 pl-0.5">
                    {(branch.city || branch.address) && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span className="line-clamp-1">
                          {[branch.city, branch.address].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                    {branch.phoneNumber && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{branch.phoneNumber}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Stats + actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Staff pill */}
                    <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-full px-3 py-1">
                      <Users className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                        {branch.staffCount ?? 0}
                      </span>
                      <span className="text-xs text-blue-500">Staff</span>
                    </div>
                    {/* Rooms pill */}
                    <div className="flex items-center gap-1.5 bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-900 rounded-full px-3 py-1">
                      <Bed className="h-3.5 w-3.5 text-violet-500" />
                      <span className="text-xs font-semibold text-violet-700 dark:text-violet-400">
                        {branch.roomCount ?? 0}
                      </span>
                      <span className="text-xs text-violet-500">Rooms</span>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Toggle */}
                    <Switch
                      checked={branch.isActive}
                      onCheckedChange={() => handleToggleActive(branch._id, branch.isActive)}
                      disabled={isLoading}
                      aria-label="Toggle branch status"
                    />

                    {/* View Details */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/branches/${branch._id}`)}
                      className="text-xs"
                    >
                      View Details
                    </Button>
                  </div>

                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <BranchModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
