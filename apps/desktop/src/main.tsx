import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { initializeDesktopFileStorage } from "./storage";
import "./styles.css";

const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("App root element was not found.");
}
const appRootElement = rootElement;

// Prepares storage-owned indexes before the React tree starts querying notes.
async function renderApp(): Promise<void> {
  await initializeDesktopFileStorage();

  createRoot(appRootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void renderApp();
