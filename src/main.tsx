import './global.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { MainWindow } from './components/MainWindow/MainWindow';

const mountElement = document.getElementById('app-root');
if (!mountElement) {
  throw new Error('Could not find app-root element');
}

const root = createRoot(mountElement);
root.render(<MainWindow />);
