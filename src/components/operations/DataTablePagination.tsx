import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DataTablePaginationProps {
  pageIndex: number;
  pageSize: number;
  dataLength: number;
  onPageChange: (pageIndex: number) => void;
}

export const DataTablePagination: React.FC<DataTablePaginationProps> = ({
  pageIndex,
  pageSize,
  dataLength,
  onPageChange,
}) => {
  const pageCount = Math.ceil(dataLength / pageSize);
  const startRange = dataLength === 0 ? 0 : pageIndex * pageSize + 1;
  const endRange = Math.min((pageIndex + 1) * pageSize, dataLength);

  return (
    <div className="flex items-center justify-between px-2 pt-4">
      <div className="flex-1 text-sm text-muted-foreground">
        Showing {startRange} to {endRange} of {dataLength} entries
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(pageIndex - 1)}
          disabled={pageIndex === 0}
        >
          <span className="sr-only">Go to previous page</span>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-medium">
          Page {pageIndex + 1} of {pageCount}
        </div>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={pageIndex >= pageCount - 1 || dataLength === 0}
        >
          <span className="sr-only">Go to next page</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};