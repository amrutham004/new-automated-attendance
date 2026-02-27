import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeCleanData } from "./lib/clearOldData";

// Clear old mock data on first load
initializeCleanData();

createRoot(document.getElementById("root")!).render(<App />);
