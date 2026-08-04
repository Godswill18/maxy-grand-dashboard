import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Wrench, Building2, Bed, User, Clock, AlertCircle, History, CheckCircle2, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useBranchStore } from "@/store/useBranchStore";
import { useMaintenanceStore, type MaintenanceRequest, type MaintenanceStatus, type MaintenancePriority } from "@/store/useMaintenanceStore";
import CreateMaintenanceRequestModal from "@/components/CreateMaintenanceRequestModal";
import MaintenanceActivityLog from "@/components/MaintenanceActivityLog";
import RoomHistoryPanel from "@/components/RoomHistoryPanel";

const ISSUE_TYPES = [
  "Plumbing", "Electrical", "Furniture", "Air Conditioning", "Internet",
  "Television", "Water Supply", "Door/Lock", "Bathroom",
  "Cleaning Complaint", "Noise Complaint", "Other",
];
const STATUSES: MaintenanceStatus[] = ["Open", "Assigned", "In Progress", "Awaiting Parts", "On Hold", "Resolved", "Closed"];
const PRIORITIES: MaintenancePriority[] = ["Low", "Medium", "High", "Critical"];

const PRIORITY_COLOR: Record<string, string> = {
  Low: "bg-gray-100 text-gray-700 border-gray-300",
  Medium: "bg-blue-100 text-blue-700 border-blue-300",
  High: "bg-orange-100 text-orange-700 border-orange-300",
  Critical: "bg-red-100 text-red-700 border-red-300",
};

const STATUS_COLOR: Record<string, string> = {
  Open: "bg-yellow-100 text-yellow-800 border-yellow-300",
  Assigned: "bg-blue-100 text-blue-800 border-blue-300",
  "In Progress": "bg-indigo-100 text-indigo-800 border-indigo-300",
  "Awaiting Parts": "bg-purple-100 text-purple-800 border-purple-300",
  "On Hold": "bg-gray-100 text-gray-800 border-gray-300",
  Resolved: "bg-green-100 text-green-800 border-green-300",
  Closed: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

const getRoomCategory = (r: MaintenanceRequest) => {
  const cat = r.roomUnitId?.roomTypeId;
  return typeof cat === "object" && cat ? (cat.categoryTag || cat.name) : "Unknown";
};
const getBranchName = (r: MaintenanceRequest) => (typeof r.hotelId === "object" ? r.hotelId?.name : undefined);

function RequestDetailDialog({
  request, open, onOpenChange, canSetPriority,
}: { request: MaintenanceRequest | null; open: boolean; onOpenChange: (o: boolean) => void; canSetPriority: boolean }) {
  const { updateStatus, updatePriority } = useMaintenanceStore();
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [pendingStatus, setPendingStatus] = useState<MaintenanceStatus | "">("");
  const [showRoomHistory, setShowRoomHistory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setResolutionNotes("");
    setPendingStatus("");
  }, [request?._id]);

  if (!request) return null;
  const isComplaint = request.issueType === "Cleaning Complaint" || request.issueType === "Noise Complaint";

  const handleStatusSubmit = async () => {
    if (!pendingStatus) return;
    setIsSubmitting(true);
    const result = await updateStatus(request._id, pendingStatus, pendingStatus === "Resolved" ? resolutionNotes || undefined : undefined);
    setIsSubmitting(false);
    if (result.success) {
      setPendingStatus("");
      setResolutionNotes("");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isComplaint ? "Complaint" : "Maintenance Request"} — Room {request.roomUnitId?.roomNumber ?? "N/A"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={STATUS_COLOR[request.status]}>{request.status}</Badge>
              <Badge className={PRIORITY_COLOR[request.priority]}>{request.priority} Priority</Badge>
              <Badge variant="outline">{request.issueType}</Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold">{request.title}</p>
              <p className="text-sm text-muted-foreground">{request.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" /> {getRoomCategory(request)}</div>
              {getBranchName(request) && <div className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {getBranchName(request)}</div>}
              {request.raisedBy && (
                <div className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> Raised by {request.raisedBy.firstName} {request.raisedBy.lastName}
                </div>
              )}
              <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {fmtDate(request.createdAt)}</div>
              {request.resolution?.resolvedAt && (
                <div className="flex items-center gap-1 col-span-2">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Resolved {fmtDate(request.resolution.resolvedAt)}
                  {request.resolution.resolvedBy ? ` by ${request.resolution.resolvedBy.firstName} ${request.resolution.resolvedBy.lastName}` : ""}
                  {request.resolution.notes ? ` — ${request.resolution.notes}` : ""}
                </div>
              )}
            </div>

            {request.attachments?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {request.attachments.map((a, i) => (
                  <a key={i} href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs px-2 py-1 rounded-md border bg-muted/50 hover:bg-muted">
                    <Paperclip className="h-3 w-3" /> {a.originalname || a.kind || "attachment"}
                  </a>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              <div className="space-y-1">
                <Label className="text-xs">Update Status</Label>
                <Select value={pendingStatus} onValueChange={(v) => setPendingStatus(v as MaintenanceStatus)}>
                  <SelectTrigger><SelectValue placeholder="Choose status" /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {canSetPriority && (
                <div className="space-y-1">
                  <Label className="text-xs">Priority</Label>
                  <Select value={request.priority} onValueChange={(v) => updatePriority(request._id, v as MaintenancePriority)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {pendingStatus === "Resolved" && (
              <div className="space-y-1">
                <Label className="text-xs">Resolution Notes (optional)</Label>
                <Textarea rows={2} value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} placeholder="What was done to resolve this?" />
              </div>
            )}

            {pendingStatus && (
              <Button size="sm" onClick={handleStatusSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : `Confirm: Move to ${pendingStatus}`}
              </Button>
            )}

            <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowRoomHistory(true)}>
              <History className="h-4 w-4" /> View Full Room History
            </Button>

            <div className="pt-2 border-t">
              <MaintenanceActivityLog maintenanceRequestId={request._id} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showRoomHistory} onOpenChange={setShowRoomHistory}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Room History</DialogTitle></DialogHeader>
          {request.roomUnitId && <RoomHistoryPanel roomUnitId={request.roomUnitId._id} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function RequestCard({ request, onClick }: { request: MaintenanceRequest; onClick: () => void }) {
  const isComplaint = request.issueType === "Cleaning Complaint" || request.issueType === "Noise Complaint";
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Room {request.roomUnitId?.roomNumber ?? "N/A"}</CardTitle>
          <Badge className={STATUS_COLOR[request.status]}>{request.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">{isComplaint ? "Complaint" : "Maintenance"}: {request.issueType}</Badge>
          <Badge className={`text-xs ${PRIORITY_COLOR[request.priority]}`}>{request.priority}</Badge>
        </div>
        <p className="text-sm font-medium truncate">{request.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Bed className="h-3.5 w-3.5" /> {getRoomCategory(request)}
          {getBranchName(request) && <><Building2 className="h-3.5 w-3.5 ml-2" /> {getBranchName(request)}</>}
        </div>
        {request.raisedBy && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5" /> {request.raisedBy.firstName} {request.raisedBy.lastName} · {fmtDate(request.createdAt)}
          </div>
        )}
        {request.attachments?.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Paperclip className="h-3.5 w-3.5" /> {request.attachments.length} attachment{request.attachments.length > 1 ? "s" : ""}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MaintenanceComplaints() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'superadmin';
  const canSetPriority = user?.role === 'admin' || user?.role === 'superadmin';

  const { branches, fetchBranches } = useBranchStore();
  const { requests, isLoading, fetchRequests, initSocketListeners, closeSocketListeners } = useMaintenanceStore();

  const [searchParams, setSearchParams] = useSearchParams();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);

  // Seeded once from the URL on first render — e.g. a dashboard summary
  // card ("?status=Open") or a notification click-through ("?requestId=...")
  // lands here pre-filtered. Filters stay local state afterward (one-way
  // seed, matching the existing ?bookingId= precedent in Bookings.tsx).
  const [branchFilter, setBranchFilter] = useState(() => searchParams.get("hotelId") || "all");
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") || "all");
  const [priorityFilter, setPriorityFilter] = useState(() => searchParams.get("priority") || "all");
  const [issueTypeFilter, setIssueTypeFilter] = useState("all");
  const [roomNumberFilter, setRoomNumberFilter] = useState("");
  const [raisedByFilter, setRaisedByFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (isSuperAdmin) fetchBranches();
  }, [isSuperAdmin, fetchBranches]);

  const loadRequests = () => {
    fetchRequests({
      hotelId: isSuperAdmin && branchFilter !== "all" ? branchFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      priority: priorityFilter !== "all" ? priorityFilter : undefined,
      issueType: issueTypeFilter !== "all" ? issueTypeFilter : undefined,
      roomNumber: roomNumberFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchFilter, statusFilter, priorityFilter, issueTypeFilter, roomNumberFilter, dateFrom, dateTo]);

  useEffect(() => {
    initSocketListeners();
    return () => closeSocketListeners();
  }, [initSocketListeners, closeSocketListeners]);

  // Deep-link from a notification click — ?requestId=<id> auto-opens that
  // request's detail dialog once the list has loaded, then strips the param.
  useEffect(() => {
    const requestId = searchParams.get('requestId');
    if (!requestId || requests.length === 0) return;

    const match = requests.find((r) => r._id === requestId);
    if (match) {
      setSelectedRequest(match);
      const next = new URLSearchParams(searchParams);
      next.delete('requestId');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, requests]);

  const filteredRequests = useMemo(() => {
    if (!raisedByFilter.trim()) return requests;
    const q = raisedByFilter.toLowerCase();
    return requests.filter((r) => {
      const name = r.raisedBy ? `${r.raisedBy.firstName} ${r.raisedBy.lastName}`.toLowerCase() : "";
      return name.includes(q);
    });
  }, [requests, raisedByFilter]);

  const stats = {
    open: requests.filter((r) => r.status === "Open").length,
    inProgress: requests.filter((r) => ["Assigned", "In Progress", "Awaiting Parts", "On Hold"].includes(r.status)).length,
    resolved: requests.filter((r) => r.status === "Resolved" || r.status === "Closed").length,
    critical: requests.filter((r) => r.priority === "Critical" && r.status !== "Resolved" && r.status !== "Closed").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Wrench className="h-7 w-7" /> Maintenance & Complaints</h1>
          <p className="text-muted-foreground">Track every maintenance issue and complaint raised against a room, from creation to resolution.</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Raise Request
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Open</p><p className="text-3xl font-bold text-yellow-600">{stats.open}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">In Progress</p><p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Resolved / Closed</p><p className="text-3xl font-bold text-green-600">{stats.resolved}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Critical (Active)</p><p className="text-3xl font-bold text-red-600">{stats.critical}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isSuperAdmin && (
            <div>
              <Label className="text-sm font-medium block mb-1">Branch</Label>
              <Select value={branchFilter} onValueChange={setBranchFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((b: any) => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="text-sm font-medium block mb-1">Room Number</Label>
            <Input value={roomNumberFilter} onChange={(e) => setRoomNumberFilter(e.target.value)} placeholder="e.g. 204" />
          </div>
          <div>
            <Label className="text-sm font-medium block mb-1">Issue Type</Label>
            <Select value={issueTypeFilter} onValueChange={setIssueTypeFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {ISSUE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium block mb-1">Priority</Label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium block mb-1">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-medium block mb-1">Raised By</Label>
            <Input value={raisedByFilter} onChange={(e) => setRaisedByFilter(e.target.value)} placeholder="Staff name" />
          </div>
          <div>
            <Label className="text-sm font-medium block mb-1">From Date</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <Label className="text-sm font-medium block mb-1">To Date</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="flex items-center justify-center h-[40vh]">
          <Card className="w-full max-w-md border-dashed bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4"><AlertCircle className="h-8 w-8 text-muted-foreground" /></div>
              <h3 className="font-semibold text-lg">No requests found</h3>
              <p className="text-muted-foreground mt-2">No maintenance requests or complaints match the current filters.</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRequests.map((r) => (
            <RequestCard key={r._id} request={r} onClick={() => setSelectedRequest(r)} />
          ))}
        </div>
      )}

      <CreateMaintenanceRequestModal open={isCreateOpen} onOpenChange={setIsCreateOpen} onSuccess={() => toast.success("Request raised successfully")} />
      <RequestDetailDialog
        request={selectedRequest}
        open={!!selectedRequest}
        onOpenChange={(o) => !o && setSelectedRequest(null)}
        canSetPriority={canSetPriority}
      />
    </div>
  );
}
