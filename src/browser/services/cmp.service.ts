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
  // Test flag to emulate EU user - set to true to test privacy features
  private static readonly TEST_EU_USER = false;

  /**
   * Check if user needs to be informed about CMP (GDPR compliance).
   * Detection is delegated to Overwolf's CMP API, which uses the user's region.
   */
  async isCMPRequired(): Promise<boolean> {
    if (CMPService.TEST_EU_USER) {
      console.log('🧪 CMP Test Mode: Emulating EU user (privacy links will show)');
      return true;
    }
    try {
      return await (app as any).overwolf.isCMPRequired();
    } catch (error) {
      console.error('Error with Overwolf CMP API:', error);
      // Default to true for safety - better to show CMP when not needed
      return true;
    }
  }

  /**
   * Open the Ad Privacy Settings window. Window contents adapt to the user's
   * region — safe to call for non-EU users as well.
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

      await (app as any).overwolf.openAdPrivacySettingsWindow(defaultOptions);
    } catch (error) {
      console.error('Error opening CMP privacy settings:', error);
      throw new Error('Failed to open privacy settings');
    }
  }

  /**
   * Whether the user has already acknowledged the CMP first-layer notice.
   */
  async isFirstLayerAcknowledged(): Promise<boolean> {
    try {
      const { SettingsService } = await import('./settings.service');
      const settingsService = new SettingsService();
      return settingsService.getCmpFirstLayerAcknowledged();
    } catch (error) {
      console.error('Error reading CMP acknowledgment:', error);
      return false;
    }
  }

  /**
   * Persist that the user has acknowledged the CMP first-layer notice
   * (via either Accept All or Manage Settings).
   */
  async acknowledgeFirstLayer(): Promise<void> {
    try {
      const { SettingsService } = await import('./settings.service');
      const settingsService = new SettingsService();
      settingsService.setCmpFirstLayerAcknowledged(true);
    } catch (error) {
      console.error('Error persisting CMP acknowledgment:', error);
    }
  }
}
