import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.module.less";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
