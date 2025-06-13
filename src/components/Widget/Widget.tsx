import React, { useEffect } from 'react';
import './Widget.css';

// Type declaration for window object
declare global {
  interface Window {
    electronAPI?: {
      openWidgetDevTools: () => void;
    };
  }
}

const Widget: React.FC = () => {
  useEffect(() => {
    // Add hotkey listeners for dev tools
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey) {
        if (event.key === 'I' || event.key === 'C') {
          event.preventDefault();
          // Send IPC message to open dev tools
          if (window.electronAPI) {
            window.electronAPI.openWidgetDevTools();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="widget-container">
      <div className="widget-header">
        <h3>AIMII Widget</h3>
      </div>
      <div className="widget-content">
        <p>Mouse Sensitivity Converter</p>
        <div className="widget-placeholder">
          <p>Widget content goes here...</p>
        </div>
      </div>
    </div>
  );
};

export default Widget;