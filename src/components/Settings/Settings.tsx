import React, { useState, useEffect, useRef } from 'react';
import './Settings.css';

interface HotkeyConfig {
  id: string;
  name: string;
  keyCode: number;
  modifiers: {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
  };
  description: string;
  enabled: boolean;
}

interface HotkeyInfo {
  keyCode: number;
  modifiers: { ctrl: boolean; shift: boolean; alt: boolean };
  displayText: string;
}

interface CapturedKeys {
  keyCode: number;
  modifiers: { ctrl: boolean; shift: boolean; alt: boolean };
  displayText: string;
}

interface CanonicalSettings {
  game: string;
  sensitivity: number;
  dpi: number;
  edpi: number;
}

interface SettingsProps {
  handleRestartOnboarding: () => Promise<void>;
}

declare global {
  interface Window {
    hotkeys: {
      getAllHotkeys: () => Promise<HotkeyConfig[]>;
      updateHotkey: (id: string, updates: Partial<HotkeyConfig>) => Promise<boolean>;
      resetToDefaults: () => Promise<void>;
      getHotkeyInfo: (id: string) => Promise<HotkeyInfo | null>;
      onHotkeyChanged: (callback: (id: string, updates: any) => void) => void;
      onHotkeysReset: (callback: () => void) => void;
      removeHotkeyListeners: () => void;
    };
    settings: {
      getCanonicalSettings: () => Promise<CanonicalSettings | null>;
      setCanonicalSettings: (game: string, sensitivity: number, dpi: number) => Promise<boolean>;
      clearCanonicalSettings: () => Promise<boolean>;
      hasCanonicalSettings: () => Promise<boolean>;
      getTheme: () => Promise<string>;
      setTheme: (theme: string) => Promise<boolean>;
      onThemeChanged: (callback: (theme: string) => void) => void;
      removeThemeListener: () => void;
    };
  }
}

const Settings: React.FC<SettingsProps> = ({ handleRestartOnboarding }) => {
  const [hotkeys, setHotkeys] = useState<HotkeyConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingHotkey, setEditingHotkey] = useState<string | null>(null);
  const [capturedKeys, setCapturedKeys] = useState<CapturedKeys | null>(null);
  const [message, setMessage] = useState<string>('');
  const [modifierState, setModifierState] = useState({ ctrl: false, shift: false, alt: false });
  const [modifierDisplay, setModifierDisplay] = useState<string>('');
  const [currentTheme, setCurrentTheme] = useState<string>('default');
  const [cmpRequired, setCmpRequired] = useState<boolean | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Available themes
  const availableThemes = [
    { value: 'default', label: 'Default (Green)' },
    { value: 'high-contrast', label: 'High Contrast' }
  ];

  useEffect(() => {
    loadHotkeys();
    loadTheme();
    checkCmpRequirement();
  }, []);

  const checkCmpRequirement = async () => {
    try {
      const required = await window.cmp.isRequired();
      setCmpRequired(required);
    } catch (error) {
      console.error('Failed to check CMP requirement:', error);
      setCmpRequired(false);
    }
  };

  useEffect(() => {
    if (editingHotkey && overlayRef.current) {
      overlayRef.current.focus();
    }
  }, [editingHotkey]);

  // Theme change listener
  useEffect(() => {
    window.settings.onThemeChanged((theme: string) => {
      setCurrentTheme(theme);
      applyTheme(theme);
    });

    return () => {
      window.settings.removeThemeListener();
    };
  }, []);

  const loadTheme = async () => {
    try {
      const theme = await window.settings.getTheme();
      setCurrentTheme(theme);
      applyTheme(theme);
    } catch (error) {
      console.error('Failed to load theme:', error);
    }
  };

  const applyTheme = (theme: string) => {
    const htmlElement = document.documentElement;

    // Remove all theme classes
    htmlElement.classList.remove('default', 'high-contrast');

    // Add the selected theme class
    if (theme !== 'default') {
      htmlElement.classList.add(theme);
    }
  };

  const handleThemeChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = event.target.value;
    try {
      await window.settings.setTheme(newTheme);
      const themeLabel = availableThemes.find(t => t.value === newTheme)?.label || newTheme;
      console.log('Theme changed:', { theme: newTheme, label: themeLabel });
      setCurrentTheme(newTheme);
      applyTheme(newTheme);
      setMessage(`Theme changed to ${themeLabel}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to change theme:', error);
      setMessage('Failed to change theme');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  useEffect(() => {
    // Global key event listeners for real-time capture
    const handleKeyDown = (event: KeyboardEvent) => {
      if (editingHotkey) {
        // Update modifier state
        const newModifierState = {
          ctrl: event.ctrlKey,
          shift: event.shiftKey,
          alt: event.altKey
        };
        setModifierState(newModifierState);

        // Update modifier display
        const modifierParts = [];
        if (newModifierState.ctrl) modifierParts.push('Ctrl');
        if (newModifierState.shift) modifierParts.push('Shift');
        if (newModifierState.alt) modifierParts.push('Alt');
        setModifierDisplay(modifierParts.join('+'));

        // Only allow: A-Z (65-90), 0-9 (48-57), F1-F12 (112-123), numpad 0-9 (96-105),
        // numpad operators (106-111), common keyboard characters (186-222), and modifiers
        const allowedKeyCodes = [
          // Letters A-Z
          ...Array.from({ length: 26 }, (_, i) => 65 + i),
          // Numbers 0-9 (top row)
          ...Array.from({ length: 10 }, (_, i) => 48 + i),
          // F1-F12
          ...Array.from({ length: 12 }, (_, i) => 112 + i),
          // Numpad 0-9
          ...Array.from({ length: 10 }, (_, i) => 96 + i),
          // Numpad operators
          106, 107, 109, 110, 111,
          // Common keyboard characters
          186, 187, 188, 189, 190, 191, 192, 219, 220, 221, 222
        ];

        // Don't capture modifier keys (Ctrl=17, Shift=16, Alt=18) as the main key
        const isModifierKey = event.keyCode === 17 || event.keyCode === 16 || event.keyCode === 18;
        if (isModifierKey) {
          return;
        }

        if (!allowedKeyCodes.includes(event.keyCode)) {
          return;
        }

        const captured: CapturedKeys = {
          keyCode: event.keyCode,
          modifiers: {
            ctrl: event.ctrlKey,
            shift: event.shiftKey,
            alt: event.altKey
          },
          displayText: getDisplayText(event.keyCode, event.ctrlKey, event.shiftKey, event.altKey, event.location)
        };

        setCapturedKeys(captured);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (editingHotkey) {
        // Update modifier state
        const newModifierState = {
          ctrl: event.ctrlKey,
          shift: event.shiftKey,
          alt: event.altKey
        };
        setModifierState(newModifierState);

        // If all modifiers are released and no valid key was captured, clear the display
        if (!newModifierState.ctrl && !newModifierState.shift && !newModifierState.alt && !capturedKeys) {
          setModifierDisplay('');
        } else if (!newModifierState.ctrl && !newModifierState.shift && !newModifierState.alt) {
          // All modifiers released, keep the captured key display
          setModifierDisplay('');
        } else {
          // Some modifiers still held, update display
          const modifierParts = [];
          if (newModifierState.ctrl) modifierParts.push('Ctrl');
          if (newModifierState.shift) modifierParts.push('Shift');
          if (newModifierState.alt) modifierParts.push('Alt');
          setModifierDisplay(modifierParts.join('+'));
        }
      }
    };

    if (editingHotkey) {
      document.addEventListener('keydown', handleKeyDown, true);
      document.addEventListener('keyup', handleKeyUp, true);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [editingHotkey, capturedKeys]);

  const getDisplayText = (keyCode: number, ctrl: boolean, shift: boolean, alt: boolean, location: number): string => {
    const modifierParts = [];

    // Handle right modifiers (location 2 = right side)
    if (ctrl) {
      if (location === 2) {
        modifierParts.push('R-Ctrl');
      } else {
        modifierParts.push('Ctrl');
      }
    }

    if (shift) {
      if (location === 2) {
        modifierParts.push('R-Shift');
      } else {
        modifierParts.push('Shift');
      }
    }

    if (alt) {
      if (location === 2) {
        modifierParts.push('R-Alt');
      } else {
        modifierParts.push('Alt');
      }
    }

    // Handle special keys
    let keyName = '';
    if (keyCode >= 112 && keyCode <= 123) {
      // F1-F12 keys
      keyName = `F${keyCode - 111}`;
    } else if (keyCode >= 48 && keyCode <= 57) {
      // Number keys 0-9 (top row)
      keyName = String.fromCharCode(keyCode);
    } else if (keyCode >= 65 && keyCode <= 90) {
      // Letter keys A-Z
      keyName = String.fromCharCode(keyCode);
    } else if (keyCode >= 96 && keyCode <= 105) {
      // Numpad keys 0-9
      keyName = `Num ${keyCode - 96}`;
    } else if (keyCode >= 106 && keyCode <= 111) {
      // Numpad operators
      switch (keyCode) {
        case 106: keyName = 'Num *'; break;
        case 107: keyName = 'Num +'; break;
        case 109: keyName = 'Num -'; break;
        case 110: keyName = 'Num .'; break;
        case 111: keyName = 'Num /'; break;
        default: keyName = `Num ${keyCode}`; break;
      }
    } else {
      // Common keyboard characters
      switch (keyCode) {
        case 186: keyName = ';'; break;
        case 187: keyName = '='; break;
        case 188: keyName = ','; break;
        case 189: keyName = '-'; break;
        case 190: keyName = '.'; break;
        case 191: keyName = '/'; break;
        case 192: keyName = '`'; break;
        case 219: keyName = '['; break;
        case 220: keyName = '\\'; break;
        case 221: keyName = ']'; break;
        case 222: keyName = '\''; break;
        default: keyName = `Key${keyCode}`; break;
      }
    }

    // Handle key combinations
    if (modifierParts.length > 0) {
      return `${modifierParts.join('+')}+${keyName}`;
    }

    return keyName;

  };

  const loadHotkeys = async () => {
    try {
      setIsLoading(true);
      const hotkeysData = await window.hotkeys.getAllHotkeys();
      setHotkeys(hotkeysData);
    } catch (error) {
      console.error('Failed to load hotkeys:', error);
      setMessage('Failed to load hotkeys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHotkeyUpdate = async (id: string, updates: Partial<HotkeyConfig>) => {
    try {
      const success = await window.hotkeys.updateHotkey(id, updates);
      if (success) {
        // Get the hotkey name for logging
        const hotkey = hotkeys.find(hk => hk.id === id);
        const displayText = getDisplayText(updates.keyCode || 0,
          updates.modifiers?.ctrl || false,
          updates.modifiers?.shift || false,
          updates.modifiers?.alt || false,
          0);
        console.log('Hotkey updated:', displayText);
        setHotkeys(prev => prev.map(hk => (hk.id === id ? { ...hk, ...updates } : hk)));
        setMessage('Hotkey updated successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to update hotkey');
      }
    } catch (error) {
      console.error('Failed to update hotkey:', error);
      setMessage('Failed to update hotkey');
    }
  };

  const handleResetToDefaults = async () => {
    try {
      await window.hotkeys.resetToDefaults();
      await loadHotkeys();
      setMessage('Hotkeys reset to defaults');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to reset hotkeys:', error);
      setMessage('Failed to reset hotkeys');
    }
  };

  const getHotkeyDisplayText = (hotkey: HotkeyConfig): string => {
    if (!hotkey.enabled) return 'Disabled';

    const modifierParts = [];
    if (hotkey.modifiers.ctrl) modifierParts.push('Ctrl');
    if (hotkey.modifiers.shift) modifierParts.push('Shift');
    if (hotkey.modifiers.alt) modifierParts.push('Alt');

    // Handle special keys
    let keyName = '';
    if (hotkey.keyCode >= 112 && hotkey.keyCode <= 123) {
      // F1-F12 keys
      keyName = `F${hotkey.keyCode - 111}`;
    } else if (hotkey.keyCode >= 48 && hotkey.keyCode <= 57) {
      // Number keys 0-9 (top row)
      keyName = String.fromCharCode(hotkey.keyCode);
    } else if (hotkey.keyCode >= 65 && hotkey.keyCode <= 90) {
      // Letter keys A-Z
      keyName = String.fromCharCode(hotkey.keyCode);
    } else if (hotkey.keyCode >= 96 && hotkey.keyCode <= 105) {
      // Numpad keys 0-9
      keyName = `Num ${hotkey.keyCode - 96}`;
    } else if (hotkey.keyCode >= 106 && hotkey.keyCode <= 111) {
      // Numpad operators
      switch (hotkey.keyCode) {
        case 106: keyName = 'Num *'; break;
        case 107: keyName = 'Num +'; break;
        case 109: keyName = 'Num -'; break;
        case 110: keyName = 'Num .'; break;
        case 111: keyName = 'Num /'; break;
        default: keyName = `Num ${hotkey.keyCode}`; break;
      }
    } else {
      // Common keyboard characters
      switch (hotkey.keyCode) {
        case 186: keyName = ';'; break;
        case 187: keyName = '='; break;
        case 188: keyName = ','; break;
        case 189: keyName = '-'; break;
        case 190: keyName = '.'; break;
        case 191: keyName = '/'; break;
        case 192: keyName = '`'; break;
        case 219: keyName = '['; break;
        case 220: keyName = '\\'; break;
        case 221: keyName = ']'; break;
        case 222: keyName = '\''; break;
        default: keyName = `Key${hotkey.keyCode}`; break;
      }
    }

    // Handle key combinations
    if (modifierParts.length > 0) {
      return `${modifierParts.join('+')}+${keyName}`;
    }

    return keyName;

  };

  const handleKeyCapture = (hotkey: HotkeyConfig) => {
    setEditingHotkey(hotkey.id);
    setCapturedKeys(null);
    setModifierState({ ctrl: false, shift: false, alt: false });
    setModifierDisplay('');
  };

  const handleSaveHotkey = () => {
    if (capturedKeys && editingHotkey) {
      const updates: Partial<HotkeyConfig> = {
        keyCode: capturedKeys.keyCode,
        modifiers: capturedKeys.modifiers
      };

      handleHotkeyUpdate(editingHotkey, updates);
      setEditingHotkey(null);
      setCapturedKeys(null);
      setModifierState({ ctrl: false, shift: false, alt: false });
      setModifierDisplay('');
    }
  };

  const handleCancelCapture = () => {
    setEditingHotkey(null);
    setCapturedKeys(null);
    setModifierState({ ctrl: false, shift: false, alt: false });
    setModifierDisplay('');
  };

  if (isLoading) {
    return (
      <div className="settings-container">
        <div className="settings-header">
          <h2>Settings</h2>
        </div>
        <div className="settings-content">
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Settings</h2>
        {/* {message && <div className="message">{message}</div>} */}
      </div>

      <div className="settings-content">
        <section className="hotkeys-section">

          <div className="hotkeys-list">
            {hotkeys.map(hotkey => (
              <div key={hotkey.id} className="hotkey-item">
                <div className="hotkey-info">
                  <h4>{hotkey.name} Hotkey</h4>
                  <p className="hotkey-description">{hotkey.description}</p>
                </div>

                <div className="hotkey-actions">
                  <button
                    onClick={() => handleKeyCapture(hotkey)}
                    className="hotkey-btn"
                    disabled={!hotkey.enabled || editingHotkey === hotkey.id}
                  >
                    {editingHotkey === hotkey.id
                      ? (capturedKeys ? capturedKeys.displayText : 'Type new keys..')
                      : getHotkeyDisplayText(hotkey)
                    }
                  </button>

                  {editingHotkey === hotkey.id && (
                    <>
                      <button
                        onClick={handleSaveHotkey}
                        className="save-btn"
                        disabled={!capturedKeys}
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelCapture}
                        className="cancel-btn"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            <button onClick={handleResetToDefaults} className="reset-btn">
              Reset to Defaults
            </button>
          </div>
        </section>

        <section className="theme-section">

          <div className="theme-controls">
            <div className="form-group select-theme">
              <h4>Select Theme</h4>
              <div className="select-wrapper">
                <select
                  id="theme-select"
                  value={currentTheme}
                  onChange={handleThemeChange}
                >
                  {availableThemes.map(theme => (
                    <option key={theme.value} value={theme.value}>
                      {theme.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Kill Switch Section */}
        <section className="settings-section">
          <div className="setting-item">
            <div className="setting-info">
              <h4>Reset Application</h4>
              <p className="setting-description">Clears all user + app settings and restarts onboarding.</p>
            </div>
            <button
              onClick={handleRestartOnboarding}
              className="danger-btn"
              title="Restart App and Clear Settings"
            >
              💀 Kill Switch
            </button>
          </div>
        </section>
      </div>

      {/* Subtle Privacy Link at Bottom */}
      <div style={{
        textAlign: 'center',
        padding: '20px',
        borderTop: '1px solid #eee',
        marginTop: '20px'
      }}>
        <button
          onClick={async () => {
            try {
              await window.cmp.openPrivacySettings();
            } catch (error) {
              console.error('Failed to open privacy settings:', error);
              setMessage('Failed to open privacy settings');
              setTimeout(() => setMessage(''), 3000);
            }
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#666',
            fontSize: '12px',
            textDecoration: 'underline',
            cursor: 'pointer',
            padding: '4px 8px'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = '#007bff'}
          onMouseOut={(e) => e.currentTarget.style.color = '#666'}
          title="Manage your data privacy preferences"
        >
          Privacy Settings
        </button>
      </div>

    </div>
  );
};

export default Settings;
