import { EventEmitter } from 'events';
import { SettingsService, HotkeyConfig } from './settings.service';

export interface HotkeyInfo {
  keyCode: number;
  modifiers: { ctrl: boolean; shift: boolean; alt: boolean };
  displayText: string;
}

export class HotkeyService extends EventEmitter {
  private hotkeys: Map<string, HotkeyConfig> = new Map();
  private registeredHotkeys: Set<string> = new Set();

  constructor(private readonly settingsService: SettingsService) {
    super();
    this.initializeDefaultHotkeys();
  }

  private initializeDefaultHotkeys(): void {
    // Widget toggle hotkey
    this.registerHotkey({
      id: 'widget-toggle',
      name: 'Toggle Widget',
      keyCode: 77, // M key
      modifiers: { ctrl: true, shift: true, alt: false },
      description: 'Toggles the in-game aimii widget visibility.',
      enabled: true
    });

    // Load saved hotkeys from settings
    this.loadHotkeysFromSettings();
  }

  public registerHotkey(config: HotkeyConfig): void {
    this.hotkeys.set(config.id, config);
  }

  public getHotkey(id: string): HotkeyConfig | undefined {
    return this.hotkeys.get(id);
  }

  public getAllHotkeys(): HotkeyConfig[] {
    return Array.from(this.hotkeys.values());
  }

  public updateHotkey(id: string, updates: Partial<HotkeyConfig>): boolean {
    const hotkey = this.hotkeys.get(id);
    if (!hotkey) {
      return false;
    }

    const updatedHotkey = { ...hotkey, ...updates };
    this.hotkeys.set(id, updatedHotkey);

    // Save to settings
    this.saveHotkeysToSettings();

    // Emit change event
    this.emit('hotkey-changed', id, updatedHotkey);

    return true;
  }

  public getHotkeyInfo(id: string): HotkeyInfo | null {
    const hotkey = this.hotkeys.get(id);
    if (!hotkey || !hotkey.enabled) {
      return null;
    }

    // Use the same display logic as the Settings component
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
        case 222: keyName = "'"; break;
        default: keyName = `Key${hotkey.keyCode}`; break;
      }
    }

    // Handle key combinations
    let displayText = '';
    if (modifierParts.length > 0) {
      displayText = `${modifierParts.join('+')}+${keyName}`;
    } else {
      displayText = keyName;
    }

    return {
      keyCode: hotkey.keyCode,
      modifiers: hotkey.modifiers,
      displayText
    };
  }

  public getHotkeyDisplayText(id: string): string {
    const hotkeyInfo = this.getHotkeyInfo(id);
    return hotkeyInfo ? hotkeyInfo.displayText : 'Not Set';
  }

  public isHotkeyRegistered(id: string): boolean {
    return this.registeredHotkeys.has(id);
  }

  public markHotkeyRegistered(id: string): void {
    this.registeredHotkeys.add(id);
  }

  public unmarkHotkeyRegistered(id: string): void {
    this.registeredHotkeys.delete(id);
  }

  private loadHotkeysFromSettings(): void {
    try {
      const savedHotkeys = this.settingsService.getHotkeys();
      if (savedHotkeys) {
        savedHotkeys.forEach(savedHotkey => {
          const existing = this.hotkeys.get(savedHotkey.id);
          if (existing) {
            // Update existing hotkey with saved values
            this.hotkeys.set(savedHotkey.id, { ...existing, ...savedHotkey });
          }
        });
      }
    } catch (error) {
      console.error('Failed to load hotkeys from settings:', error);
    }
  }

  private saveHotkeysToSettings(): void {
    try {
      const hotkeysToSave = Array.from(this.hotkeys.values());
      this.settingsService.setHotkeys(hotkeysToSave);
    } catch (error) {
      console.error('Failed to save hotkeys to settings:', error);
    }
  }

  public resetToDefaults(): void {
    this.hotkeys.clear();
    this.registeredHotkeys.clear();
    this.initializeDefaultHotkeys();
    this.saveHotkeysToSettings();
    this.emit('hotkeys-reset');
  }
}