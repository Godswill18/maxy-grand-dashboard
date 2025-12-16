import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const statusColors: Record<string, string> = {
  occupied: "bg-primary text-primary-foreground",
  available: "bg-success text-success-foreground",
  cleaning: "bg-warning text-warning-foreground",
  maintenance: "bg-destructive text-destructive-foreground",
  pending: "bg-warning text-warning-foreground",
  "in progress": "bg-info text-info-foreground",
  completed: "bg-success text-success-foreground",
  served: "bg-info text-info-foreground",
};

interface TableViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: Record<string, any> | null;
}

const formatValue = (key: string, value: any): React.ReactNode => {
  if (value === null || value === undefined) return "-";

  // Handle objects (including nested IDs)
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    // ✅ Extract ID from objects (handle both _id and id)
    if (value._id) {
      return value._id;
    }
    if (value.id) {
      return value.id;
    }
    // Extract name if available
    if (value.name) {
      return value.name;
    }
    // Extract firstName + lastName for user objects
    if (value.firstName && value.lastName) {
      return `${value.firstName} ${value.lastName}`;
    }
    // Fallback: show first available meaningful field
    const keys = Object.keys(value).filter(k => !k.startsWith('_'));
    if (keys.length > 0) {
      const firstKey = keys[0];
      return formatValue(firstKey, value[firstKey]);
    }
    return "-";
  }

  // Handle arrays
  if (Array.isArray(value)) {
    if (value.length === 0) return "-";
    
    return (
      <ScrollArea className="h-[100px] w-full border rounded-md p-2">
        {value.map((item, index) => (
          <div key={index} className="text-sm py-0.5 border-b last:border-b-0">
            {typeof item === 'object' && item !== null
              ? item.name || item._id || item.id || JSON.stringify(item).slice(0, 50)
              : String(item)}
          </div>
        ))}
      </ScrollArea>
    );
  }

  const strValue = String(value);

  // Special handling for Status fields
  if (key.toLowerCase().includes('status')) {
    const statusKey = strValue.toLowerCase().replace(/ /g, '-');
    return (
      <Badge className={statusColors[statusKey] || "bg-secondary text-secondary-foreground"}>
        {strValue}
      </Badge>
    );
  }

  // Format ISO date strings
  if (strValue.length > 10 && strValue.includes('T') && strValue.includes('Z')) {
    try {
      const date = new Date(strValue);
      return date.toLocaleString();
    } catch (e) {
      return strValue;
    }
  }

  return strValue;
};

export const TableViewModal: React.FC<TableViewModalProps> = ({ isOpen, onClose, title, data }) => {
  if (!data) return null;

  // ✅ Filter out internal fields and duplicate nested objects
  const displayData = Object.entries(data).filter(([key]) => {
    // Exclude internal/MongoDB fields
    if (key.startsWith('_')) return false;
    
    // Exclude ID duplicates
    if (key === 'id') return false;
    
    // Exclude nested object references (keep the ID, not the full object)
    if (['roomTypeId', 'waiterId', 'assignedCleaner', 'guestId', 'userId', 'hotelId'].includes(key)) {
      return false;
    }
    
    return true;
  });

  // ✅ Format key names for display
  const formatKeyName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/Id$/, ' ID') // Replace "Id" with " ID"
      .replace(/^at$/, 'Date') // Replace "at" with "Date"
      .trim();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title} Details</DialogTitle>
          <DialogDescription>
            Full details for the selected {title.toLowerCase()} entry.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableBody>
              {displayData.length > 0 ? (
                displayData.map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="font-semibold capitalize w-1/3 text-foreground">
                      {formatKeyName(key)}
                    </TableCell>
                    <TableCell className="w-2/3 text-foreground">
                      {formatValue(key, value)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    No data to display
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};