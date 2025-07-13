import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { SecurityProvider } from './components/SecurityProvider'

createRoot(document.getElementById("root")!).render(
  <SecurityProvider>
    <App />
  </SecurityProvider>
);
