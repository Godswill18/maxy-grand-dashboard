import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, User, Calendar, DollarSign, Filter, X, Download } from "lucide-react";
import { usePaymentStore } from "@/store/usePaymentStore";
import { useAuthStore } from "@/store/useAuthStore";
import { format, isWithinInterval, parseISO } from "date-fns";

const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <Card key={i}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default function Transactions() {
  const { user } = useAuthStore();
  const { payments, isLoading, fetchPayments } = usePaymentStore();
  
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    startDate: '',
    endDate: '',
    bookingType: 'all',
    searchTerm: '',
  });

  // Fetch all payments once on mount
  useEffect(() => {
    // if (user?.hotelId) {
      fetchPayments(user.hotelId);
    // }
  }, [user?.hotelId, fetchPayments]);

  // Frontend filtering using useMemo for performance
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      // Status filter
      if (filters.status !== 'all' && payment.status !== filters.status) {
        return false;
      }

      // Booking type filter
      if (filters.bookingType !== 'all' && payment.bookingId?.bookingType !== filters.bookingType) {
        return false;
      }

      // Date range filter
      if (filters.startDate || filters.endDate) {
        const paymentDate = parseISO(payment.createdAt);
        
        if (filters.startDate && filters.endDate) {
          const start = parseISO(filters.startDate);
          const end = parseISO(filters.endDate);
          end.setHours(23, 59, 59, 999);
          
          if (!isWithinInterval(paymentDate, { start, end })) {
            return false;
          }
        } else if (filters.startDate) {
          const start = parseISO(filters.startDate);
          if (paymentDate < start) {
            return false;
          }
        } else if (filters.endDate) {
          const end = parseISO(filters.endDate);
          end.setHours(23, 59, 59, 999);
          if (paymentDate > end) {
            return false;
          }
        }
      }

      // Search filter (guest name, email, confirmation code)
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const guestName = payment.bookingId?.guestName?.toLowerCase() || '';
        const guestEmail = payment.bookingId?.guestEmail?.toLowerCase() || '';
        const confirmationCode = payment.bookingId?.confirmationCode?.toLowerCase() || '';
        const gatewayRef = payment.gatewayRef?.toLowerCase() || '';

        if (
          !guestName.includes(searchLower) &&
          !guestEmail.includes(searchLower) &&
          !confirmationCode.includes(searchLower) &&
          !gatewayRef.includes(searchLower)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [payments, filters]);

  const handleClearFilters = () => {
    setFilters({
      status: 'all',
      startDate: '',
      endDate: '',
      bookingType: 'all',
      searchTerm: '',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'completed': { label: 'Completed', className: 'bg-green-100 text-green-800' },
      'pending': { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      'failed': { label: 'Failed', className: 'bg-red-100 text-red-800' },
    };
    
    const config = statusConfig[status] || statusConfig['pending'];
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getBookingTypeBadge = (type: string) => {
    return (
      <Badge variant="outline" className={type === 'online' ? 'border-blue-500 text-blue-700' : 'border-gray-500 text-gray-700'}>
        {type === 'online' ? 'Online' : 'Walk-in'}
      </Badge>
    );
  };

  const calculateTotalRevenue = () => {
    return filteredPayments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const handleExport = () => {
    // Convert filtered payments to CSV
    const headers = ['Date', 'Guest', 'Booking Type', 'Amount', 'Status', 'Reference', 'Room'];
    const rows = filteredPayments.map(payment => [
      format(new Date(payment.createdAt), 'yyyy-MM-dd HH:mm'),
      payment.bookingId?.guestName || 'N/A',
      payment.bookingId?.bookingType || 'N/A',
      `="₦ " & ${payment.bookingId.totalAmount}`,
      payment.status,
      payment.gatewayRef || 'N/A',
      payment.bookingId?.roomTypeId?.name || 'N/A',
    ]);

    console.log(payments)

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const hasActiveFilters = 
    filters.status !== 'all' || 
    filters.bookingType !== 'all' || 
    filters.startDate !== '' || 
    filters.endDate !== '' ||
    filters.searchTerm !== '';

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
          <p className="text-muted-foreground">
            {hasActiveFilters 
              ? `Showing ${filteredPayments.length} of ${payments.length} transactions`
              : `View all ${payments.length} payment transactions`
            }
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1">
                Active
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={filteredPayments.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{filteredPayments.length}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₦{calculateTotalRevenue().toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {filteredPayments.filter(p => p.status === 'completed').length}
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {filteredPayments.filter(p => p.status === 'pending').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Search */}
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  type="text"
                  placeholder="Search by guest name, email, confirmation code, or reference..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                />
              </div>

              {/* Filter Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bookingType">Booking Type</Label>
                  <Select
                    value={filters.bookingType}
                    onValueChange={(value) => setFilters({ ...filters, bookingType: value })}
                  >
                    <SelectTrigger id="bookingType">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="walk-in">Walk-in</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  />
                </div>
              </div>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <Button variant="outline" onClick={handleClearFilters} className="w-full">
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions List */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {hasActiveFilters ? 'No Transactions Match Filters' : 'No Transactions Found'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters
                ? 'Try adjusting your filters to see more results'
                : 'Transactions will appear here once bookings are made'}
            </p>
            {hasActiveFilters && (
              <Button onClick={handleClearFilters} variant="outline">
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPayments.map((payment, index) => (
            <Card
              key={payment._id}
              className="hover:shadow-lg transition-all animate-in fade-in slide-in-from-left"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Section */}
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                      <DollarSign className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">
                        {payment.bookingId?.guestName || 'Unknown Guest'}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{payment.bookingId?.guestEmail || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span className="font-mono text-xs">
                          {payment.bookingId?.confirmationCode || 'N/A'}
                        </span>
                        {payment.bookingId?.bookingType && (
                          getBookingTypeBadge(payment.bookingId.bookingType)
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Section */}
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {format(new Date(payment.createdAt), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>

                    {payment.bookingId?.roomTypeId?.name && (
                      <div className="text-sm text-muted-foreground">
                        <CreditCard className="h-4 w-4 inline mr-1" />
                        {payment.bookingId.roomTypeId.name}
                      </div>
                    )}

                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">
                        ₦{payment.amount.toLocaleString()}
                      </p>
                      {payment.gatewayRef && (
                        <p className="text-xs text-muted-foreground font-mono">
                          Ref: {payment.gatewayRef.substring(0, 12)}...
                        </p>
                      )}
                    </div>

                    {getStatusBadge(payment.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}