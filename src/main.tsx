import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initTheme } from "./lib/theme";
import { installAuthFetchPatch } from "./lib/authFetchPatch";

// Must run before the first render — applies the saved light/dark class
// synchronously so there's no post-mount flash (see src/lib/theme.ts).
initTheme();

// Must run before any component mounts and starts issuing fetch() calls —
// see src/lib/authFetchPatch.ts for why this is a global patch rather than
// a per-call-site change.
installAuthFetchPatch();

createRoot(document.getElementById("root")!).render(<App />);
