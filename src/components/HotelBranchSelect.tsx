import { useEffect } from "react";
import { useBranchStore } from "@/store/useBranchStore";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface HotelBranchSelectProps {
  value?: string;
  onChange: (value: string) => void;
}

export default function HotelBranchSelect({ value, onChange }: HotelBranchSelectProps) {
  const { branches, fetchBranches, isLoading, error } = useBranchStore();

  useEffect(() => {
    // Fetch branches only if none are loaded yet
    if (branches.length === 0) {
      fetchBranches();
    }
  }, [branches.length, fetchBranches]);

  return (
    <div className="space-y-2">
      <Label htmlFor="hotelId" className="text-sm font-medium">
        Hotel Branch
      </Label>

      {isLoading ? (
        <Skeleton className="h-10 w-full rounded-md" />
      ) : error ? (
        <p className="text-destructive text-sm">Error: {error}</p>
      ) : (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id="hotelId" className="w-full">
            <SelectValue placeholder="Select a Hotel Branch" />
          </SelectTrigger>
          <SelectContent>
            {branches.length > 0 ? (
              branches.map((branch) => (
                <SelectItem key={branch._id} value={branch._id}>
                  {branch.name} — {branch.city}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>
                No branches available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
