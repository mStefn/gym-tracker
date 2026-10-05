import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

// 1. Najpierw ładujemy Tailwind i nowe zmienne (chudy plik, który za chwilę utworzysz)
import './index.css'; 

// 2. Potem ładujemy stary CSS, żeby dotychczasowy wygląd się nie zepsuł (będziemy go stopniowo odchudzać)
import './css/style.css'; 

// Inicjalizacja klienta React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true, // Odświeża dane, gdy wracasz do appki na telefonie
      retry: 1, // Ile razy ponowić żądanie w razie błędu sieci
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);