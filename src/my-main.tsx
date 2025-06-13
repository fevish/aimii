import React from 'react';
import { createRoot } from 'react-dom/client';
import { MyMainWindow } from './components/MyMainWindow/MyMainWindow';

const mountElement = document.createElement('div');
mountElement.id = 'app-root';
document.body.appendChild(mountElement);
const root = createRoot(mountElement);

root.render(<MyMainWindow />);