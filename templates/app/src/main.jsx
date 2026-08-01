import React from "react";
import { createRoot } from "react-dom/client";
import { McProviders } from "mc-ui/state";
import { renderDefaultIcon } from "mc-ui/icons";
import "mc-ui/layout.css";
import "mc-ui/components.css";
import "./theme.css";
import { AppComponent } from "./AppComponent.jsx";
import { createAppStore } from "./state/StoreManager.js";

const reactRoot = document.getElementById("app");
if (!reactRoot) throw new Error("__APP_NAME__: app root #app was not found");
const store = createAppStore();

createRoot(reactRoot).render(
  <McProviders store={store} icons={renderDefaultIcon}>
    <AppComponent />
  </McProviders>
);
