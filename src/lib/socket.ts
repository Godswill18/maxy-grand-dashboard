// src/lib/socket.ts
import { io } from "socket.io-client";

// Get the API URL from environment variables or default
const VITE_API_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:5000';

// Initialize the socket connection
export const socket = io(VITE_API_URL, {
  withCredentials: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: Infinity,
  timeout: 20000,
});

socket.on("connect", () => {
  console.log("Socket.io connected:", socket.id);
});

socket.on("disconnect", () => {
  console.log("Socket.io disconnected");
});

socket.on("reconnect", (attempt: number) => {
  console.log("Socket.io reconnected after", attempt, "attempts");
});