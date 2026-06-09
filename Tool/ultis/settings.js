/**
 * Settings Manager - Quản lý cài đặt extension
 */
class SettingsManager {
    constructor() {
        this.defaultSettings = {
            // Form filling settings
            delay: 100,
            autoDetect: true,
            autoPhone84: false,
            autoSubmit: false,
            highlightFields: true,

            // UI settings
            theme: 'dark', // 'dark', 'light'
            fontSize: 'normal', // 'small', 'normal', 'large'
            compactMode: false,

            // CAPTCHA settings
            captchaAPI: 'autocaptcha',
            captchaAPIKey: '',
            captchaTimeout: 30,

            // History settings
            historyLimit: 1000,
            autoArchive: true,
            archiveAfterDays: 30,

            // Export settings
            defaultExportFormat: 'csv',
            includeTimestamp: true,

            // General
            enableNotifications: true,
            enableLogging: false,
            autoUpdate: true
        };

        this.settings = { ...this.defaultSettings };
        this.loadSettings();
    }

    /**
     * Lấy setting
     */
    getSetting(key) {
        return this.settings[key] !== undefined ? this.settings[key] : this.defaultSettings[key];
    }

    /**
     * Set setting
     */
    setSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        return true;
    }

    /**
     * Set multiple settings
     */
    setSettings(settings) {
        this.settings = { ...this.settings, ...settings };
        this.saveSettings();
        return true;
    }

    /**
     * Get all settings
     */
    getAllSettings() {
        return { ...this.settings };
    }

    /**
     * Reset to default
     */
    resetToDefault() {
        this.settings = { ...this.defaultSettings };
        this.saveSettings();
        return true;
    }

    /**
     * Save to storage
     */
    saveSettings() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ settings: this.settings });
        } else {
            localStorage.setItem('settings', JSON.stringify(this.settings));
        }
    }

    /**
     * Load from storage
     */
    loadSettings() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['settings'], (result) => {
                if (result.settings) {
                    this.settings = { ...this.defaultSettings, ...result.settings };
                }
            });
        } else {
            const saved = localStorage.getItem('settings');
            if (saved) {
                this.settings = { ...this.defaultSettings, ...JSON.parse(saved) };
            }
        }
    }

    /**
     * Export settings
     */
    exportSettings() {
        return JSON.stringify(this.settings, null, 2);
    }

    /**
     * Import settings
     */
    importSettings(jsonData) {
        try {
            const imported = JSON.parse(jsonData);
            this.settings = { ...this.defaultSettings, ...imported };
            this.saveSettings();
            return true;
        } catch (error) {
            console.error('Import settings error:', error);
            return false;
        }
    }

    /**
     * Get CAPTCHA settings
     */
    getCaptchaSettings() {
        return {
            api: this.getSetting('captchaAPI'),
            apiKey: this.getSetting('captchaAPIKey'),
            timeout: this.getSetting('captchaTimeout')
        };
    }

    /**
     * Get Form filling settings
     */
    getFormSettings() {
        return {
            delay: this.getSetting('delay'),
            autoDetect: this.getSetting('autoDetect'),
            autoPhone84: this.getSetting('autoPhone84'),
            autoSubmit: this.getSetting('autoSubmit'),
            highlightFields: this.getSetting('highlightFields')
        };
    }

    /**
     * Get UI settings
     */
    getUISettings() {
        return {
            theme: this.getSetting('theme'),
            fontSize: this.getSetting('fontSize'),
            compactMode: this.getSetting('compactMode')
        };
    }

    /**
     * Apply UI settings
     */
    applyUISettings() {
        const ui = this.getUISettings();

        // Apply theme
        const html = document.documentElement;
        html.setAttribute('data-theme', ui.theme);

        // Apply font size
        html.setAttribute('data-font-size', ui.fontSize);

        // Apply compact mode
        if (ui.compactMode) {
            html.classList.add('compact-mode');
        } else {
            html.classList.remove('compact-mode');
        }
    }
}