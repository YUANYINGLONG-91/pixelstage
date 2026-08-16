import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

// Electron loads via file:// — use hash routing there and open the editor
// straight away (it's a tool, not a website). GitHub Pages can't rewrite
// unknown paths to index.html, so it gets hash routing too.
const isFile = window.location.protocol === "file:";
const isPages = window.location.hostname.endsWith("github.io");
if (isFile && !window.location.hash) window.location.hash = "#/editor";
const Router = isFile || isPages ? HashRouter : BrowserRouter;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Router>
        <App />
      </Router>
    </ErrorBoundary>
  </StrictMode>
);
