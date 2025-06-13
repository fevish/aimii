import React from 'react';
import { createRoot } from 'react-dom/client';
import { Widget } from './components/Widget/Widget';

const mountElement = document.getElementById('widget-root');
if (!mountElement) {
  throw new Error('Could not find widget-root element');
}

const root = createRoot(mountElement);
root.render(<Widget />);