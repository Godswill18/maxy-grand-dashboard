import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initTheme } from "./lib/theme";

// Must run before the first render — applies the saved light/dark class
// synchronously so there's no post-mount flash (see src/lib/theme.ts).
initTheme();

createRoot(document.getElementById("root")!).render(<App />);
