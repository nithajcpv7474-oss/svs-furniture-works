import * as settingService from '../services/setting.service.js';
import { logAction } from '../services/audit.service.js';

export const getSettings = async (req, res) => {
  try {
    const settings = await settingService.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.companyLogo = req.file.filename;
    }
    
    const oldSettings = await settingService.getSettings();
    const settings = await settingService.updateSettings(data);
    logAction({ userId: req.user.id, action: 'SettingsChange', module: 'Settings', oldValue: oldSettings, newValue: settings, req });
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
