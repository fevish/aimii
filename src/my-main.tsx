import './global.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MyMainWindow } from './components/MyMainWindow/MyMainWindow';

const mountElement = document.getElementById('app-root');
if (!mountElement) {
  throw new Error('Could not find app-root element');
}

const root = createRoot(mountElement);
root.render(<MyMainWindow />);
