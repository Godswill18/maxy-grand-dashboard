import { useAuthStore } from "../store/useAuthStore";

export const apiClient = async (url: string, options: RequestInit = {}) => {
  const token = sessionStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401) {
    const logout = useAuthStore.getState().logout;
    logout();                     // clear Zustand + localStorage
    window.location.href = "/login";  // redirect cleanly
    return;
  }

  return response;
};
