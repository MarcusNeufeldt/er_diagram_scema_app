import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Comprehensive ResizeObserver error suppression

// 1. Override console.error to filter ResizeObserver messages
const originalConsoleError = console.error;
console.error = function(...args) {
  // Filter out ResizeObserver errors
  if (args.length > 0 && typeof args[0] === 'string' && args[0].includes('ResizeObserver')) {
    return;
  }
  originalConsoleError.apply(console, args);
};

// 2. Wrap ResizeObserver to catch errors at the source
if (typeof window !== 'undefined' && window.ResizeObserver) {
  const OriginalResizeObserver = window.ResizeObserver;
  window.ResizeObserver = class extends OriginalResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      // Debounce the callback to prevent loop errors
      let timeoutId: NodeJS.Timeout | null = null;
      const debouncedCallback: ResizeObserverCallback = (entries, observer) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          try {
            callback(entries, observer);
          } catch (error) {
            // Silently ignore ResizeObserver errors
            if (error instanceof Error && error.message.includes('ResizeObserver')) {
              return;
            }
            // Re-throw other errors
            console.error('ResizeObserver error:', error);
          }
        }, 0);
      };
      super(debouncedCallback);
    }
  };
}

// Suppress ResizeObserver errors at the window level
const resizeObserverLoopErr = (e: ErrorEvent) => {
  if (e.message && (
    e.message.includes('ResizeObserver loop') ||
    e.message.includes('ResizeObserver loop completed with undelivered notifications')
  )) {
    e.stopImmediatePropagation();
    e.preventDefault();
    return false;
  }
};

// Handle unhandled promise rejections
const handleUnhandledRejection = (e: PromiseRejectionEvent) => {
  if (e.reason && e.reason.message && e.reason.message.includes('ResizeObserver')) {
    e.preventDefault();
    return false;
  }
};

// Override the global error handler for ResizeObserver
const originalOnError = window.onerror;
window.onerror = function(message, source, lineno, colno, error) {
  if (typeof message === 'string' && message.includes('ResizeObserver')) {
    return true; // Prevent default handling
  }
  if (originalOnError) {
    return originalOnError.call(this, message, source, lineno, colno, error);
  }
  return false;
};

window.addEventListener('error', resizeObserverLoopErr, true);
window.addEventListener('unhandledrejection', handleUnhandledRejection, true);

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
