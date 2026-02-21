import './global.css';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AimTrainer } from './components/AimTrainer/AimTrainer';
import type { AimTrainerConfig } from './types/aim-trainer';
import './components/AimTrainer/AimTrainer.css';

const mountElement = document.getElementById('app-root');
if (!mountElement) {
  throw new Error('Could not find app-root element');
}

const AimTrainerWindowApp: React.FC = () => {
  const [config, setConfig] = useState<AimTrainerConfig | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      const c = await (window as any).aimTrainerWindow?.getInitialConfig?.();
      if (c) setConfig(c);
    };
    loadConfig();

    const handleUpdate = (_: any, newConfig: AimTrainerConfig) => {
      setConfig(newConfig);
    };
    (window as any).aimTrainerWindow?.onConfigUpdated?.(handleUpdate);

    return () => {
      (window as any).aimTrainerWindow?.removeConfigListener?.();
    };
  }, []);

  const handleExit = () => {
    (window as any).aimTrainerWindow?.close?.();
  };

  if (!config) {
    return (
      <div className="aim-trainer-loading">
        <p>Loading...</p>
      </div>
    );
  }

  return <AimTrainer config={config} onExit={handleExit} />;
};

const root = createRoot(mountElement);
root.render(<AimTrainerWindowApp />);
