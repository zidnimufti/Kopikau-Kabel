import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // <-- IMPORT INI
import { HeroUIProvider } from "@heroui/react";

import App from './App';
import { Provider } from "./provider.tsx";
import { CartProvider } from "./components/CartContext";
import { AuthProvider } from './auth/contexts/AuthContext';
import "@/styles/globals.css";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter> {/* <-- BUNGKUS SEMUANYA DENGAN INI */}
      <HeroUIProvider>
        <Provider>
          <CartProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </CartProvider>
        </Provider>
      </HeroUIProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
