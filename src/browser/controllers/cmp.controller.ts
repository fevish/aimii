import { ipcMain } from 'electron';
import { CMPService, CMPWindowOptions } from '../services/cmp.service';

export class CMPController {
  private cmpService: CMPService;

  constructor() {
    this.cmpService = new CMPService();
    this.registerIpcHandlers();
  }

  private registerIpcHandlers(): void {
    // Check if CMP is required for this user
    ipcMain.handle('cmp-is-required', async () => {
      return await this.cmpService.isCMPRequired();
    });

    // Open privacy settings window
    ipcMain.handle('cmp-open-privacy-settings', async (event, options: CMPWindowOptions) => {
      return await this.cmpService.openPrivacySettings(options);
    });

    // Check if this is first time user (for first layer CMP)
    ipcMain.handle('cmp-is-first-time-user', async () => {
      return await this.cmpService.isFirstTimeUser();
    });
  }
}