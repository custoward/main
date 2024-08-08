import React from 'react';
import ReactDOM from 'react-dom/client'; // createRoot를 사용하기 위해 변경
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root')!); // createRoot를 사용
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);
