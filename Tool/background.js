// Background script để xử lý các tác vụ nền và đồng bộ dữ liệu

class BackgroundManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupInstallListener();
        this.setupMessageListener();
        this.setupContextMenu();
        this.setupTabListener();
    }

    setupInstallListener() {
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                this.initializeDefaultData();
            } else if (details.reason === 'update') {
                this.handleUpdate(details.previousVersion);
            }
        });
    }

    async initializeDefaultData() {
        const defaultData = {
            profiles: {
                default: {
                    username: '',
                    password: '',
                    fullName: '',
                    phone: '',
                    email: '',
                    dob: ''
                }
            },
            settings: {
                delay: 100,
                autoDetect: true,
                autoPhone84: false
            },
            history: [],
            linksList: [], // Thêm cho LinkManager
            stats: {
                totalFills: 0,
                successfulFills: 0,
                lastUsed: null
            }
        };

        await chrome.storage.local.set(defaultData);
    }

    async handleUpdate(previousVersion) {
        const data = await chrome.storage.local.get();

        if (!data.stats) {
            data.stats = {
                totalFills: data.history?.length || 0,
                successfulFills: data.history?.filter(h => h.success).length || 0,
                lastUsed: null
            };
        }

        if (!data.linksList) {
            data.linksList = [];
        }

        await chrome.storage.local.set(data);
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'openMultipleTabs':
                    this.openMultipleTabs(request.urls).then(sendResponse);
                    return true;
                case 'openSingleTab':
                    this.openSingleTab(request.url).then(sendResponse);
                    return true;
                case 'batchFill':
                    this.handleBatchFill(request.data, request.options);
                    sendResponse({ success: true });
                    break;
                case 'getTabInfo':
                    this.getTabInfo(sender.tab.id).then(sendResponse);
                    return true;
                case 'updateStats':
                    this.updateStats(request.stats);
                    sendResponse({ success: true });
                    break;
            }
        });
    }

    // ========== LINK MANAGEMENT ==========
    async openMultipleTabs(urls) {
        console.log('Background: Opening multiple tabs:', urls);

        if (!urls || !Array.isArray(urls) || urls.length === 0) {
            return {
                success: false,
                error: 'No URLs provided',
                openedCount: 0,
                totalUrls: 0
            };
        }

        let openedCount = 0;
        const errors = [];

        try {
            for (const url of urls) {
                try {
                    await chrome.tabs.create({
                        url: url,
                        active: false
                    });
                    openedCount++;
                    console.log('Background: Opened tab:', url);

                    // Delay giữa các tab để tránh bị chặn
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (error) {
                    console.error('Background: Error opening tab:', url, error);
                    errors.push({ url, error: error.message });
                }
            }

            return {
                success: true,
                openedCount: openedCount,
                totalUrls: urls.length,
                errors: errors
            };
        } catch (error) {
            console.error('Background: Error in openMultipleTabs:', error);
            return {
                success: false,
                error: error.message,
                openedCount: openedCount,
                totalUrls: urls.length,
                errors: errors
            };
        }
    }

    async openSingleTab(url) {
        console.log('Background: Opening single tab:', url);

        try {
            const tab = await chrome.tabs.create({
                url: url,
                active: true
            });

            return {
                success: true,
                tabId: tab.id
            };
        } catch (error) {
            console.error('Background: Error opening single tab:', url, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    setupContextMenu() {
        chrome.contextMenus.create({
            id: 'smartFillForm',
            title: 'Điền form thông minh',
            contexts: ['page']
        });

        chrome.contextMenus.create({
            id: 'scanCurrentForm',
            title: 'Quét form hiện tại',
            contexts: ['page']
        });

        chrome.contextMenus.onClicked.addListener((info, tab) => {
            switch (info.menuItemId) {
                case 'smartFillForm':
                    this.triggerSmartFill(tab.id);
                    break;
                case 'scanCurrentForm':
                    this.triggerFormScan(tab.id);
                    break;
            }
        });
    }

    setupTabListener() {
        chrome.tabs.onActivated.addListener(async (activeInfo) => {
            const tab = await chrome.tabs.get(activeInfo.tabId);
            this.updateBadge(tab);
        });

        chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete') {
                this.updateBadge(tab);
            }
        });
    }

    async updateBadge(tab) {
        try {
            const result = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    const forms = document.querySelectorAll('form');
                    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
                    return forms.length > 0 || inputs.length > 3;
                }
            });

            if (result[0].result) {
                chrome.action.setBadgeText({
                    tabId: tab.id,
                    text: '●'
                });
                chrome.action.setBadgeBackgroundColor({
                    tabId: tab.id,
                    color: '#28a745'
                });
            } else {
                chrome.action.setBadgeText({
                    tabId: tab.id,
                    text: ''
                });
            }
        } catch (error) {
            // Ignore errors for tabs that can't be scripted
        }
    }

    async handleBatchFill(data, options) {
        const tabs = await chrome.tabs.query({
            currentWindow: options.currentWindow || false
        });

        const targetTabs = tabs.filter(tab =>
            tab.url.startsWith('http') && !tab.url.includes('chrome://')
        );

        for (const tab of targetTabs) {
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: this.batchFillScript,
                    args: [data, options]
                });

                await new Promise(resolve => setTimeout(resolve, options.tabDelay || 1000));
            } catch (error) {
                console.error(`Error filling form in tab ${tab.id}:`, error);
            }
        }
    }

    batchFillScript(data, options) {
        const fillField = async (selector, value, delay = 100) => {
            const el = document.querySelector(selector);
            if (el && value) {
                el.focus();
                el.value = value;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        };

        const selectors = {
            username: ["input[name*='user']", "input[placeholder*='tài khoản']", "#username"],
            password: ["input[type='password']"],
            email: ["input[type='email']", "input[name*='email']"],
            fullName: ["input[name*='name']", "input[placeholder*='tên']"],
            phone: ["input[type='tel']", "input[name*='phone']"]
        };

        Object.entries(data).forEach(async ([field, value]) => {
            if (selectors[field] && value) {
                for (const selector of selectors[field]) {
                    await fillField(selector, value, options.delay || 100);
                }
            }
        });
    }

    async triggerSmartFill(tabId) {
        try {
            const data = await chrome.storage.local.get(['profiles']);
            const defaultProfile = data.profiles?.default || {};

            await chrome.scripting.executeScript({
                target: { tabId },
                func: this.batchFillScript,
                args: [defaultProfile, { delay: 100 }]
            });

            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'assets/icon.png',
                title: 'Smart Form Filler',
                message: 'Đã điền form thành công!'
            });
        } catch (error) {
            console.error('Error in smart fill:', error);
        }
    }

    async triggerFormScan(tabId) {
        try {
            const result = await chrome.scripting.executeScript({
                target: { tabId },
                func: () => {
                    const forms = document.querySelectorAll('form');
                    const inputs = document.querySelectorAll('input, select, textarea');

                    return {
                        formCount: forms.length,
                        inputCount: inputs.length,
                        types: Array.from(inputs).map(input => input.type)
                    };
                }
            });

            console.log('Form scan result:', result[0].result);
        } catch (error) {
            console.error('Error in form scan:', error);
        }
    }

    async getTabInfo(tabId) {
        try {
            const tab = await chrome.tabs.get(tabId);
            return {
                url: tab.url,
                title: tab.title,
                id: tab.id
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    async updateStats(stats) {
        try {
            const data = await chrome.storage.local.get(['stats']);
            const currentStats = data.stats || {};

            const updatedStats = {
                ...currentStats,
                ...stats,
                lastUsed: Date.now()
            };

            await chrome.storage.local.set({ stats: updatedStats });
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }
}

// Khởi tạo BackgroundManager
new BackgroundManager();
