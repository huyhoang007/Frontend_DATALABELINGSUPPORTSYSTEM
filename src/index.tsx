import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import ModernAdminApp from './ModernAdminApp';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ModernAdminApp />
  </React.StrictMode>
);

// Simple CSS for better styling
const style = document.createElement('style');
style.textContent = `
  * {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #fafafa;
  }
  
  button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    transition: all 0.2s ease;
  }
  
  input:focus {
    outline: none;
    border-color: #1976d2;
    box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
  }
  
  table tr:hover {
    background-color: #f5f5f5;
  }
  
  .card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
  }
`;
document.head.appendChild(style);