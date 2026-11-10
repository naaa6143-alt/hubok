import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, makeClient } from "./lib/trpc";
import { ToastProvider } from "./components/ui";
import App from "./App";
import "./index.css";

function Root() {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } } }));
  const [client] = useState(makeClient);
  return (
    <trpc.Provider client={client} queryClient={qc}>
      <QueryClientProvider client={qc}>
        <ToastProvider><BrowserRouter><App /></BrowserRouter></ToastProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><Root /></React.StrictMode>);
