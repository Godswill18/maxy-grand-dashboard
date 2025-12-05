import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  Plus,
  Zap,
  ZapOff,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { useShiftStore } from "@/store/useSiftStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useStaffStore } from "@/store/useStaffStore";
import { toast } from "sonner";

// Types
interface CreateShiftData {
  userId: string;
  hotelId: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  shiftType?: "custom" | "morning" | "afternoon" | "evening" | "night" | "full-day";
  notes?: string;
}

interface ConfirmationDialogState {
  isOpen: boolean;
  type: "delete" | "activate" | "deactivate" | null;
  shiftId: string | null;
  shiftName: string | null;
}

export default function ShiftScheduler() {
  const { user } = useAuthStore();
  const {
    shifts,
    isLoading,
    fetchShifts,
    createShift,
    updateShift,
    deleteShift,
    activateShift,
    deactivateShift,
    initializeSocket,
    disconnectSocket,
  } = useShiftStore();

  const { staff, fetchStaff } = useStaffStore();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [filterStaff, setFilterStaff] = useState<string>("all");
  const [nigerianTime, setNigerianTime] = useState<Date>(new Date());

  // ✅ NEW: Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmationDialogState>({
    isOpen: false,
    type: null,
    shiftId: null,
    shiftName: null,
  });

  // Form data
  const [formData, setFormData] = useState<CreateShiftData>({
    userId: "",
    hotelId: user?.hotelId || "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    endDate: format(new Date(), "yyyy-MM-dd"),
    endTime: "17:00",
    shiftType: "custom",
    notes: "",
  });

  useEffect(() => {
    initializeSocket();
    fetchShifts({});
    fetchStaff();

    // Update Nigerian time every second
    const interval = setInterval(() => {
      const now = new Date();
      // Add 1 hour for WAT (UTC+1)
      const wat = new Date(now.getTime() + (1 * 60 * 60 * 1000));
      setNigerianTime(wat);
    }, 1000);

    return () => {
      disconnectSocket();
      clearInterval(interval);
    };
  }, []);

  // Helper function to safely format dates
  const safeFormatDate = (dateString: any, formatString: string, fallback: string = "Invalid Date"): string => {
    if (!dateString) return fallback;
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      if (!isValid(date)) return fallback;
      return format(date, formatString);
    } catch (error) {
      console.error('Date format error:', error, 'for date:', dateString);
      return fallback;
    }
  };

  // Helper to check if shift has valid date fields
  const hasValidDates = (shift: any): boolean => {
    return !!(shift.startDate && shift.endDate);
  };

  // Filter shifts with valid dates only
  const validShifts = shifts.filter(hasValidDates);

  // Filter logic with date range support
  const filteredShifts = validShifts.filter((shift) => {
    // Filter by date
    if (filterDate) {
      const filterDateStr = format(filterDate, "yyyy-MM-dd");
      const shiftStartDate = safeFormatDate(shift.startDate, "yyyy-MM-dd", "");
      const shiftEndDate = safeFormatDate(shift.endDate, "yyyy-MM-dd", "");

      // Check if filter date falls within shift range
      if (
        !shiftStartDate ||
        !shiftEndDate ||
        filterDateStr < shiftStartDate ||
        filterDateStr > shiftEndDate
      ) {
        return false;
      }
    }

    // Filter by staff
    if (filterStaff !== "all") {
      return shift.userId?._id === filterStaff;
    }

    return true;
  });

  // Get stats
  const stats = {
    total: validShifts.length,
    today: validShifts.filter(shift => {
      const todayStr = format(nigerianTime, "yyyy-MM-dd");
      return safeFormatDate(shift.startDate, "yyyy-MM-dd", "") <= todayStr &&
        safeFormatDate(shift.endDate, "yyyy-MM-dd", "") >= todayStr;
    }).length,
    week: validShifts.filter(shift => {
      const startOfWeek = new Date(nigerianTime);
      startOfWeek.setDate(nigerianTime.getDate() - nigerianTime.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      const shiftStart = new Date(safeFormatDate(shift.startDate, "yyyy-MM-dd", ""));
      const shiftEnd = new Date(safeFormatDate(shift.endDate, "yyyy-MM-dd", ""));
      return shiftStart <= endOfWeek && shiftEnd >= startOfWeek;
    }).length,
    active: validShifts.filter(shift => shift.isActive).length,
    emergencyActive: validShifts.filter(shift => shift.emergencyActivated).length,
  };

  // Handle staff selection - auto-set hotelId from selected staff
  const handleStaffSelection = (staffId: string) => {
    const selectedStaff = staff.find((s) => s._id === staffId);
    
    setFormData({
      ...formData,
      userId: staffId,
      hotelId: selectedStaff?.hotelId?._id || user?.hotelId || formData.hotelId,
    });
  };

  // ✅ NEW: Open confirmation dialog
  const openConfirmDialog = (type: "delete" | "activate" | "deactivate", shiftId: string, shiftName: string) => {
    setConfirmDialog({
      isOpen: true,
      type,
      shiftId,
      shiftName,
    });
  };

  // ✅ NEW: Close confirmation dialog
  const closeConfirmDialog = () => {
    setConfirmDialog({
      isOpen: false,
      type: null,
      shiftId: null,
      shiftName: null,
    });
  };

  // ✅ NEW: Handle confirmed action
  const handleConfirmedAction = async () => {
    if (!confirmDialog.shiftId || !confirmDialog.type) return;

    try {
      switch (confirmDialog.type) {
        case "delete":
          await deleteShift(confirmDialog.shiftId);
          toast.success("Shift deleted successfully");
          break;
        case "activate":
          await activateShift(confirmDialog.shiftId);
          toast.success("Shift activated! Staff can now login at any time.");
          break;
        case "deactivate":
          await deactivateShift(confirmDialog.shiftId);
          toast.success("Emergency activation removed. Normal schedule applies.");
          break;
      }
      closeConfirmDialog();
    } catch (error: any) {
      toast.error(error.message || `Failed to ${confirmDialog.type} shift`);
    }
  };

  // ✅ UPDATED: Trigger delete confirmation
  const handleDeleteShift = (shiftId: string, shiftName: string) => {
    openConfirmDialog("delete", shiftId, shiftName);
  };

  // ✅ UPDATED: Trigger activate confirmation
  const handleActivateShift = (shiftId: string, shiftName: string) => {
    openConfirmDialog("activate", shiftId, shiftName);
  };

  // ✅ UPDATED: Trigger deactivate confirmation
  const handleDeactivateShift = (shiftId: string, shiftName: string) => {
    openConfirmDialog("deactivate", shiftId, shiftName);
  };

  const handleCreateShift = async () => {
    // Validation
    if (
      !formData.userId ||
      !formData.startDate ||
      !formData.startTime ||
      !formData.endDate ||
      !formData.endTime
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    // Validate hotelId
    if (!formData.hotelId) {
      toast.error("Hotel ID is required. Please select a staff member with an assigned hotel.");
      return;
    }

    // Validate date range
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate < startDate) {
      toast.error("End date cannot be before start date");
      return;
    }

    try {
      await createShift(formData);
      toast.success("Shift created successfully. It will auto-activate daily at start time.");
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to create shift");
    }
  };

  const handleUpdateShift = async () => {
    if (!selectedShift) return;

    // Validation
    if (
      !formData.userId ||
      !formData.startDate ||
      !formData.startTime ||
      !formData.endDate ||
      !formData.endTime
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    // Validate hotelId
    if (!formData.hotelId) {
      toast.error("Hotel ID is required. Please select a staff member with an assigned hotel.");
      return;
    }

    // Validate date range
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);

    if (endDate < startDate) {
      toast.error("End date cannot be before start date");
      return;
    }

    try {
      await updateShift(selectedShift._id, formData);
      toast.success("Shift updated successfully");
      setIsEditDialogOpen(false);
      setSelectedShift(null);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to update shift");
    }
  };

  const openEditDialog = (shift: any) => {
    if (!hasValidDates(shift)) {
      toast.error("Cannot edit shift with invalid dates. Please delete and recreate.");
      return;
    }

    setSelectedShift(shift);
    setFormData({
      userId: shift.userId?._id || "",
      hotelId: shift.hotelId?._id || user?.hotelId || "",
      startDate: safeFormatDate(shift.startDate, "yyyy-MM-dd", format(new Date(), "yyyy-MM-dd")),
      startTime: shift.startTime || "09:00",
      endDate: safeFormatDate(shift.endDate, "yyyy-MM-dd", format(new Date(), "yyyy-MM-dd")),
      endTime: shift.endTime || "17:00",
      shiftType: shift.shiftType || "custom",
      notes: shift.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      userId: "",
      hotelId: user?.hotelId || "",
      startDate: format(new Date(), "yyyy-MM-dd"),
      startTime: "09:00",
      endDate: format(new Date(), "yyyy-MM-dd"),
      endTime: "17:00",
      shiftType: "custom",
      notes: "",
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500";
      case "in-progress":
        return "bg-green-500 animate-pulse";
      case "completed":
        return "bg-gray-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Clock className="h-4 w-4" />;
      case "in-progress":
        return <CheckCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Get staff users
  const staffUsers = staff.filter((u) =>
    ["receptionist", "cleaner", "waiter", "headWaiter"].includes(u.role)
  );

  // Check if shift is multi-day
  const isMultiDayShift = (shift: any) => {
    if (!hasValidDates(shift)) return false;
    return safeFormatDate(shift.startDate, "yyyy-MM-dd", "") !== safeFormatDate(shift.endDate, "yyyy-MM-dd", "");
  };

  // Calculate shift duration
  const getShiftDuration = (shift: any) => {
    if (!hasValidDates(shift)) return "N/A";
    
    const start = new Date(shift.startDate);
    const end = new Date(shift.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0 || diffDays === 1) {
      return "1 day";
    }
    return `${diffDays} days`;
  };

  // ✅ NEW: Get confirmation dialog content
  const getConfirmDialogContent = () => {
    switch (confirmDialog.type) {
      case "delete":
        return {
          title: "Delete Shift",
          description: `Are you sure you want to delete the shift for ${confirmDialog.shiftName}? This action cannot be undone.`,
          actionText: "Delete",
          actionClass: "bg-red-600 hover:bg-red-700",
        };
      case "activate":
        return {
          title: "Emergency Activate Shift",
          description: `Emergency activate shift for ${confirmDialog.shiftName}? The staff member will be able to login immediately, bypassing the scheduled time restrictions. This is useful for urgent situations.`,
          actionText: "Activate",
          actionClass: "bg-orange-600 hover:bg-orange-700",
        };
      case "deactivate":
        return {
          title: "Remove Emergency Activation",
          description: `Remove emergency activation for ${confirmDialog.shiftName}? The shift will return to normal schedule. If the current time is outside the scheduled hours, the staff member will be logged out.`,
          actionText: "Deactivate",
          actionClass: "bg-orange-600 hover:bg-orange-700",
        };
      default:
        return {
          title: "",
          description: "",
          actionText: "",
          actionClass: "",
        };
    }
  };

  const dialogContent = getConfirmDialogContent();

  return (
    <div className="space-y-6">
      {/* Header with Nigerian Time */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Shift Scheduler</h1>
          <p className="text-muted-foreground">Manage staff shifts and schedules</p>
          <div className="flex items-center gap-2 mt-2">
            <Clock className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-600">
              Nigerian Time (WAT): {format(nigerianTime, "PPP p")}
            </span>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Shift
        </Button>
      </div>

      {/* Show warning if there are invalid shifts */}
      {shifts.length !== validShifts.length && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-700 dark:text-yellow-300">
                  {shifts.length - validShifts.length} shift(s) have invalid dates
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  These are shifts with old data format. Please delete them and create new ones.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ NEW: Info card about automatic activation */}
      <Card className="border-blue-500 bg-blue-50 dark:bg-blue-950">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-700 dark:text-blue-300">
                Automatic Daily Activation
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Shifts automatically activate and deactivate daily at the specified start/end times (Nigerian Time). 
                For multi-day shifts, the times apply to each day in the duration. Emergency activation overrides this schedule.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Shifts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.today}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-500">{stats.week}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Emergency Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.emergencyActive}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Filter by Date</Label>
              <Input
                type="date"
                value={filterDate ? format(filterDate, "yyyy-MM-dd") : ""}
                onChange={(e) =>
                  setFilterDate(e.target.value ? new Date(e.target.value) : null)
                }
              />
            </div>
            <div>
              <Label>Filter by Staff</Label>
              <Select value={filterStaff} onValueChange={setFilterStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Staff</SelectItem>
                  {staffUsers.map((staff) => (
                    <SelectItem key={staff._id} value={staff._id}>
                      {staff.firstName} {staff.lastName} ({staff.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFilterDate(null);
                  setFilterStaff("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shifts List */}
      <Card>
        <CardHeader>
          <CardTitle>All Shifts ({filteredShifts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading shifts...</div>
          ) : filteredShifts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No shifts found. Create your first shift to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredShifts.map((shift) => (
                <div
                  key={shift._id}
                  className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${
                    shift.emergencyActivated ? 'border-orange-500 bg-orange-50 dark:bg-orange-950' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">
                          {shift.userId?.firstName} {shift.userId?.lastName}
                        </h3>
                        <Badge variant="outline">{shift.userId?.role}</Badge>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getStatusBadgeColor(shift.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(shift.status)}
                            {shift.status}
                          </span>
                        </Badge>
                        {shift.isActive && (
                          <Badge className="bg-green-500 animate-pulse">
                            Active Now
                          </Badge>
                        )}
                        {shift.emergencyActivated && (
                          <Badge className="bg-orange-500">
                            <Zap className="h-3 w-3 mr-1" />
                            Emergency Activated
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {/* ✅ UPDATED: Activate/Deactivate with modal confirmation */}
                      {shift.emergencyActivated ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeactivateShift(
                            shift._id, 
                            `${shift.userId?.firstName} ${shift.userId?.lastName}`
                          )}
                          className="text-orange-600 border-orange-600 hover:bg-orange-50"
                          title="Remove emergency activation"
                        >
                          <ZapOff className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleActivateShift(
                            shift._id, 
                            `${shift.userId?.firstName} ${shift.userId?.lastName}`
                          )}
                          className="text-orange-600 border-orange-600 hover:bg-orange-50"
                          title="Emergency activate (allow immediate login)"
                        >
                          <Zap className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(shift)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteShift(
                          shift._id, 
                          `${shift.userId?.firstName} ${shift.userId?.lastName}`
                        )}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    <span className="flex items-center gap-1">
                      📅 {safeFormatDate(shift.startDate, "PPP", "Invalid Date")}
                    </span>
                    {isMultiDayShift(shift) && (
                      <span className="flex items-center gap-1">
                        → {safeFormatDate(shift.endDate, "PPP", "Invalid Date")}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      ⏰ {shift.startTime} - {shift.endTime} (daily)
                    </span>
                    <span className="flex items-center gap-1">
                      📆 Duration: {getShiftDuration(shift)}
                    </span>
                    <span className="flex items-center gap-1">
                      🏷️ {shift.shiftType}
                    </span>
                    <span className="flex items-center gap-1">
                      🏨 {shift.hotelId?.name || "Unknown Hotel"}
                    </span>
                  </div>

                  {shift.emergencyActivated && shift.emergencyActivatedBy && (
                    <div className="mt-3 p-2 bg-orange-100 dark:bg-orange-900 rounded-md">
                      <p className="text-xs text-orange-700 dark:text-orange-300">
                        <Zap className="h-3 w-3 inline mr-1" />
                        Emergency activated by {shift.emergencyActivatedBy.firstName} {shift.emergencyActivatedBy.lastName}
                        {shift.emergencyActivatedAt && ` on ${safeFormatDate(shift.emergencyActivatedAt, "PPP p", "")}`}
                      </p>
                    </div>
                  )}

                  {shift.notes && (
                    <div className="mt-3 p-2 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">
                        📝 {shift.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ NEW: Confirmation Dialog */}
      <AlertDialog open={confirmDialog.isOpen} onOpenChange={closeConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              {dialogContent.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogContent.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeConfirmDialog}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmedAction}
              className={dialogContent.actionClass}
            >
              {dialogContent.actionText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Shift</DialogTitle>
            <DialogDescription>
              Schedule a new shift for a staff member. Times in Nigerian Time (WAT). 
              Shift will auto-activate daily at start time and deactivate at end time.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Staff Member *</Label>
              <Select
                value={formData.userId}
                onValueChange={handleStaffSelection}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffUsers.map((staff) => (
                    <SelectItem key={staff._id} value={staff._id}>
                      {staff.firstName} {staff.lastName} ({staff.role})
                      {staff.hotelId && ` - ${staff.hotelId.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.userId && formData.hotelId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Hotel: {staff.find(s => s._id === formData.userId)?.hotelId?.name || 'Unknown'}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date * (Shift begins)</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>End Date * (Shift ends)</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  min={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time * (WAT - Daily activation)</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Staff can login from this time each day
                </p>
              </div>
              <div>
                <Label>End Time * (WAT - Daily deactivation)</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Staff will be logged out at this time each day
                </p>
              </div>
            </div>

            <div>
              <Label>Shift Type</Label>
              <Select
                value={formData.shiftType}
                onValueChange={(value) =>
                  setFormData({ ...formData, shiftType: value as CreateShiftData["shiftType"] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shift type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                  <SelectItem value="full-day">Full Day</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateShift} disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Shift</DialogTitle>
            <DialogDescription>
              Update shift details. Times in Nigerian Time (WAT).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Staff Member *</Label>
              <Select
                value={formData.userId}
                onValueChange={handleStaffSelection}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffUsers.map((staff) => (
                    <SelectItem key={staff._id} value={staff._id}>
                      {staff.firstName} {staff.lastName} ({staff.role})
                      {staff.hotelId && ` - ${staff.hotelId.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.userId && formData.hotelId && (
                <p className="text-xs text-muted-foreground mt-1">
                  Hotel: {staff.find(s => s._id === formData.userId)?.hotelId?.name || 'Unknown'}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  min={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time * (WAT)</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>End Time * (WAT)</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Shift Type</Label>
              <Select
                value={formData.shiftType}
                onValueChange={(value) =>
                  setFormData({ ...formData, shiftType: value as CreateShiftData["shiftType"] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select shift type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                  <SelectItem value="full-day">Full Day</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedShift(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateShift} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}