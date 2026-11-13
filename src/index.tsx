import React from 'react';
import ReactDOM from 'react-dom/client';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

dayjs.locale('ko');

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

reportWebVitals();
