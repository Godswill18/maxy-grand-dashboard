import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

const API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

export function useBranchName(): string | null {
  const { user } = useAuthStore();
  const [branchName, setBranchName] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.hotelId) return;
    fetch(`${API_URL}/api/hotels/get-single-branch-public/${user.hotelId}`)
      .then(r => r.json())
      .then(data => {
        if (data?.success && data?.data?.name) {
          setBranchName(data.data.name);
        }
      })
      .catch(() => {});
  }, [user?.hotelId]);

  return branchName;
}
