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
  // ... other statuses
};

interface TableViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: Record<string, any> | null;
}

const formatValue = (key: string, value: any): React.ReactNode => {
  if (value === null || value === undefined) return "-";
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    // Check for ID objects like { _id: '...', name: '...' }
    if (value.name) return value.name;
    // Fallback for general objects
    return JSON.stringify(value); 
  }
  if (Array.isArray(value)) {
    return (
      <ScrollArea className="h-[100px] w-full border rounded-md p-2">
        {value.map((item, index) => (
          <div key={index} className="text-sm py-0.5 border-b last:border-b-0">
            {typeof item === 'object' && item !== null ? formatValue('item', item) : String(item)}
          </div>
        ))}
      </ScrollArea>
    );
  }
  
  const strValue = String(value);

  // Special handling for Status
  if (key.toLowerCase().includes('status')) {
    const statusKey = strValue.toLowerCase().replace(/ /g, '-');
    return <Badge className={statusColors[statusKey] || "bg-secondary text-secondary-foreground"}>{strValue}</Badge>;
  }
  
  // Format dates/times if they look like ISO strings (a simplified check)
  if (strValue.length > 10 && strValue.includes('T') && strValue.includes('Z')) {
    try {
      const date = new Date(strValue);
      return date.toLocaleString();
    } catch (e) {
      // ignore, return string
    }
  }

  return strValue;
};

export const TableViewModal: React.FC<TableViewModalProps> = ({ isOpen, onClose, title, data }) => {
  if (!data) return null;

  const displayData = Object.entries(data).filter(([key]) => 
    !key.startsWith('_') && key !== 'id' && key !== 'roomTypeId' && key !== 'waiterId' && key !== 'assignedCleaner' // Exclude internal/duplicate keys
  );

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
              {displayData.map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell className="font-semibold capitalize w-1/3">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </TableCell>
                  <TableCell className="w-2/3">{formatValue(key, value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};