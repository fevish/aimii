import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface UserSettings {
  widget: {
    position: { x: number; y: number };
    visible: boolean;
  };
  // Add more settings categories as needed
  // ui: { theme: string; fontSize: number };
  // game: { autoStart: boolean; hotkeys: any };
}

export class SettingsService {
  private settingsPath: string;
  private settings: UserSettings;

  constructor() {
    // Store settings in the same directory as Overwolf Electron data
    const userDataPath = app.getPath('userData');
    this.settingsPath = path.join(userDataPath, 'aimii-settings.json');

    // Load existing settings or create defaults
    this.settings = this.loadSettings();
  }

  private getDefaultSettings(): UserSettings {
    return {
      widget: {
        position: { x: 100, y: 100 },
        visible: false
      }
    };
  }

  private loadSettings(): UserSettings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf8');
        const loadedSettings = JSON.parse(data);

        // Merge with defaults to ensure all properties exist
        return { ...this.getDefaultSettings(), ...loadedSettings };
      }
    } catch (error) {
      console.log('Error loading settings, using defaults:', error);
    }

    return this.getDefaultSettings();
  }

  private saveSettings(): void {
    try {
      const data = JSON.stringify(this.settings, null, 2);
      fs.writeFileSync(this.settingsPath, data, 'utf8');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  // Widget position methods
  public getWidgetPosition(): { x: number; y: number } {
    return this.settings.widget.position;
  }

  public setWidgetPosition(x: number, y: number): void {
    this.settings.widget.position = { x, y };
    this.saveSettings();
  }

  // Widget visibility methods
  public getWidgetVisible(): boolean {
    return this.settings.widget.visible;
  }

  public setWidgetVisible(visible: boolean): void {
    this.settings.widget.visible = visible;
    this.saveSettings();
  }

  // Generic getter/setter for extensibility
  public getSetting<T>(path: string): T | undefined {
    const keys = path.split('.');
    let current: any = this.settings;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return current as T;
  }

  public setSetting(path: string, value: any): void {
    const keys = path.split('.');
    let current: any = this.settings;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
    this.saveSettings();
  }

  // Get all settings (for debugging)
  public getAllSettings(): UserSettings {
    return { ...this.settings };
  }

  // Reset to defaults
  public resetSettings(): void {
    this.settings = this.getDefaultSettings();
    this.saveSettings();
  }
}