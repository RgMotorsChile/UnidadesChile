import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { FavoritesProvider } from "./components/Favorites";
import { CompareProvider } from "./components/Compare";
import { DataProvider } from "./store/DataProvider";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <DataProvider>
        <FavoritesProvider>
          <CompareProvider>
            <App />
          </CompareProvider>
        </FavoritesProvider>
      </DataProvider>
    </BrowserRouter>
  </StrictMode>,
);
