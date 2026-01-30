import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Initialize i18n
import i18n from './i18n';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Wait for i18n to be ready before rendering the app
const renderApp = () => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

if (i18n.isInitialized) {
  // i18n is already initialized
  renderApp();
} else {
  // Wait for i18n to initialize
  i18n.on('initialized', () => {
    renderApp();
  });
  
  // Fallback: render after a timeout to prevent white screen
  setTimeout(() => {
    if (!i18n.isInitialized) {
      console.warn('i18n took too long to initialize, rendering app anyway');
      renderApp();
    }
  }, 3000);
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
