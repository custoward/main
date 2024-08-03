import React from 'react';
import ReactDOM from 'react-dom/client'; // createRoot를 사용하기 위해 변경
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root')!); // createRoot를 사용
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);