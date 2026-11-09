import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TooltipProvider } from '@/components/ui/tooltip';
import { App } from './app';
import './starter-kit/i18n';
import './app.css';

// Same root providers as the apps' `resources/js/app.tsx`.
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <TooltipProvider delayDuration={0}>
            <App />
        </TooltipProvider>
    </StrictMode>,
);
