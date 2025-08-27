import { app } from 'electron';

export interface CMPWindowOptions {
  purposes?: 'purposes' | 'features' | 'vendors';
  modal?: boolean;
  parent?: Electron.BrowserWindow | null;
  center?: boolean;
  backgroundColor?: string;
  preLoaderSpinnerColor?: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  language?: 'en' | 'de' | 'pt' | 'es' | 'fr' | 'it' | 'pl';
}

export class CMPService {
  /**
   * Check if user needs to be informed about CMP (GDPR compliance)
   * @returns Promise<boolean> - true if CMP is required for this user
   */
  async isCMPRequired(): Promise<boolean> {
    try {
      // First check if user selected EU region during installation
      const winreg = await import('winreg');
      const regKey = new winreg.default({
        hive: winreg.default.HKCU,
        key: '\\Software\\aimii'
      });

      return new Promise<boolean>((resolve) => {
        regKey.get('GDPRRegion', (err: Error | null, item: any) => {
          if (err || !item) {
            // Fallback to Overwolf API if no registry setting
            this.fallbackToCMPAPI().then(resolve).catch(() => resolve(true));
          } else {
            resolve(item.value === 'true');
          }
        });
      });
    } catch (error) {
      console.error('Error checking CMP requirement:', error);
      // Fallback to Overwolf API
      return await this.fallbackToCMPAPI();
    }
  }

  private async fallbackToCMPAPI(): Promise<boolean> {
    try {
      // Use the official Overwolf API as documented
      return await (app as any).overwolf.isCMPRequired();
    } catch (error) {
      console.error('Error with Overwolf CMP API:', error);
      // Default to true for safety - better to show CMP when not needed
      return true;
    }
  }

  /**
   * Open the Ad Privacy Settings window (CMP second layer)
   * @param options - Configuration options for the CMP window
   */
  async openPrivacySettings(options: CMPWindowOptions = {}): Promise<void> {
    try {
      const defaultOptions: CMPWindowOptions = {
        purposes: 'purposes',
        modal: true,
        parent: null,
        center: true,
        language: 'en',
        ...options
      };

      // Use the official ow-electron API as documented
      await (app as any).overwolf.openAdPrivacySettingsWindow(defaultOptions);
    } catch (error) {
      console.error('Error opening CMP privacy settings:', error);
      throw new Error('Failed to open privacy settings');
    }
  }

  /**
   * Check if this is the first time the app is running
   * This helps determine when to show the first layer CMP
   */
  async isFirstTimeUser(): Promise<boolean> {
    try {
      // Check if baseline settings exist - if not, this is a first-time user
      const { SettingsService } = await import('./settings.service');
      const settingsService = new SettingsService();
      const hasSettings = await settingsService.hasBaselineSettings();
      return !hasSettings;
    } catch (error) {
      console.error('Error checking first-time user status:', error);
      // Default to true for safety - better to show CMP when not needed
      return true;
    }
  }
}