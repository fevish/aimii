import React, { useState } from 'react';
import './CMPFirstLayer.css';

interface CMPFirstLayerProps {
  onAcknowledge: () => void;
}

export const CMPFirstLayer: React.FC<CMPFirstLayerProps> = ({ onAcknowledge }) => {
  const [isBusy, setIsBusy] = useState(false);

  const acknowledge = async () => {
    await window.cmp.acknowledgeFirstLayer();
    onAcknowledge();
  };

  const handleAcceptAll = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      await acknowledge();
    } finally {
      setIsBusy(false);
    }
  };

  const handleManageSettings = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      await window.cmp.openPrivacySettings();
    } catch (error) {
      console.error('Failed to open privacy settings:', error);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="cmp-first-layer">
      <h2>Your privacy</h2>
      <div className="cmp-first-layer-content">
        <p>
          aimii.app may display in-app ads to help provide you with a free high-quality app.
          In order to deliver ads that are relevant for you, aimii and trusted third-party
          ad partners store and/or access information on your computer, and process personal
          data such as IP address and cookies.
        </p>
        <p>
          Click <b>Manage Settings</b> to control your consents, or to object to the
          processing of your data when done on the basis of legitimate interest. You can
          change your preferences at any time via the Privacy section in Settings.
        </p>
        <p className="cmp-purposes">
          <b>Purposes we use:</b> Store and/or access information on a device, personalized
          ads and content, ad and content measurement, audience insights and product
          development.
        </p>
        <details className="cmp-why">
          <summary>Why am I seeing this?</summary>
          <p>
            You're seeing this notice because you appear to be located in a region with
            strict data protection laws, which require us to obtain your consent before
            processing personal data for advertising.
          </p>
        </details>
      </div>
      <div className="cmp-first-layer-actions">
        <button
          className="btn btn-outline"
          onClick={handleManageSettings}
          disabled={isBusy}
        >
          Manage Settings
        </button>
        <button
          className="btn btn-primary"
          onClick={handleAcceptAll}
          disabled={isBusy}
          autoFocus
        >
          Accept All
        </button>
      </div>
    </div>
  );
};
