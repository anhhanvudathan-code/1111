/**
 * POPUP.JS - COMPLETE INTEGRATION v2.1
 * Integrates: ProfileManager + UndoRedoManager + ExportManager + SettingsManager
 */

document.addEventListener('DOMContentLoaded', () => {
    // ========== MANAGER INITIALIZATION ==========
    let profileManager, undoRedoManager, settingsManager, linkManager = null;

    // Wait for managers to load
    setTimeout(() => {
        if (typeof ProfileManager !== 'undefined') {
            profileManager = new ProfileManager();
        }
        if (typeof UndoRedoManager !== 'undefined') {
            undoRedoManager = new UndoRedoManager(50);
        }
        if (typeof SettingsManager !== 'undefined') {
            settingsManager = new SettingsManager();
            settingsManager.applyUISettings();
        }
        if (typeof LinkManager !== 'undefined') {
            linkManager = new LinkManager();
        }
    }, 200);

    // ========== PIN POPUP ==========
    let isPinned = false;
    const pinBtn = document.getElementById('pinBtn');

    pinBtn.addEventListener('click', () => {
        isPinned = !isPinned;
        pinBtn.classList.toggle('active', isPinned);
        pinBtn.textContent = isPinned ? '📍' : '📌';

        if (isPinned) {
            document.addEventListener('click', preventClose);
            document.addEventListener('blur', preventClose);
        } else {
            document.removeEventListener('click', preventClose);
            document.removeEventListener('blur', preventClose);
        }

        updateStatus(isPinned ? 'Popup đã được ghim' : 'Popup không còn ghim');
    });

    function preventClose(e) {
        e.stopPropagation();
    }

    // ========== COLLAPSIBLE SECTIONS ==========
    document.querySelectorAll('.collapsible-header').forEach(header => {
        header.addEventListener('click', () => {
            const collapsible = header.parentElement;
            collapsible.classList.toggle('active');
        });
    });

    // ========== STATUS UPDATE ==========
    function updateStatus(message) {
        const statusEl = document.getElementById('statusText');
        if (statusEl) {
            statusEl.textContent = message;
            setTimeout(() => {
                statusEl.textContent = 'Ready';
            }, 2000);
        }
    }

    // ========== TAB SWITCHING ==========
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const tabId = tab.dataset.tab;
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
            }
            updateStatus(`Chuyển sang tab ${tab.textContent}`);
        });
    });

    // ========== FORM DATA HELPERS ==========
    function getCurrentFormData() {
        return {
            username: document.getElementById('username')?.value || '',
            password: document.getElementById('password')?.value || '',
            fullName: document.getElementById('fullName')?.value || '',
            phone: document.getElementById('phone')?.value || '',
            email: document.getElementById('email')?.value || '',
            birthdate: document.getElementById('birthdate')?.value || ''
        };
    }

    function applyFormData(data) {
        if (document.getElementById('username')) document.getElementById('username').value = data.username || '';
        if (document.getElementById('password')) document.getElementById('password').value = data.password || '';
        if (document.getElementById('fullName')) document.getElementById('fullName').value = data.fullName || '';
        if (document.getElementById('phone')) document.getElementById('phone').value = data.phone || '';
        if (document.getElementById('email')) document.getElementById('email').value = data.email || '';
        if (document.getElementById('birthdate')) document.getElementById('birthdate').value = data.birthdate || '';
        updateBulkInput();
    }

    function updateBulkInput() {
        const data = getCurrentFormData();
        const bulkEl = document.getElementById('bulkInput');
        if (bulkEl) {
            bulkEl.value = `${data.username}|${data.password}|${data.fullName}|${data.phone}|${data.email}|${data.birthdate}`;
        }
    }

    // ========== STORAGE HELPERS ==========
    function autoSaveData() {
        const currentData = getCurrentFormData();
        const bulkEl = document.getElementById('bulkInput');
        const nameEl = document.getElementById('nameInput');
        currentData.bulkInput = bulkEl?.value || '';
        currentData.nameInput = nameEl?.value || '';
        chrome.storage.local.set({ currentFormData: currentData });
    }

    function loadSavedData() {
        chrome.storage.local.get(['currentFormData'], (result) => {
            if (result.currentFormData) {
                const data = result.currentFormData;
                applyFormData(data);
                const bulkEl = document.getElementById('bulkInput');
                const nameEl = document.getElementById('nameInput');
                if (bulkEl) bulkEl.value = data.bulkInput || '';
                if (nameEl) nameEl.value = data.nameInput || '';
            }
        });
    }

    // ========== PARSE DATA BUTTON ==========
    const parseBtn = document.getElementById('parseData');
    if (parseBtn) {
        parseBtn.addEventListener('click', () => {
            const bulkEl = document.getElementById('bulkInput');
            const input = bulkEl?.value.trim();
            if (!input) return;

            const parts = input.split('|');
            const newData = {
                username: parts[0]?.trim() || '',
                password: parts[1]?.trim() || '',
                fullName: parts[2]?.trim() || '',
                phone: parts[3]?.trim() || '',
                email: parts[4]?.trim() || '',
                birthdate: parts[5]?.trim() || ''
            };

            if (undoRedoManager) {
                undoRedoManager.saveState(newData, 'Parse Data');
            }
            applyFormData(newData);
            autoSaveData();
            updateStatus('✅ Đã tách dữ liệu');
        });
    }

    // ========== CLEAR DATA BUTTON ==========
    const clearBtn = document.getElementById('clearData');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            const emptyData = {
                username: '',
                password: '',
                fullName: '',
                phone: '',
                email: '',
                birthdate: ''
            };

            if (undoRedoManager) {
                undoRedoManager.saveState(emptyData, 'Clear Data');
            }

            const bulkEl = document.getElementById('bulkInput');
            if (bulkEl) bulkEl.value = '';
            applyFormData(emptyData);
            autoSaveData();
            updateStatus('✅ Đã xóa dữ liệu');
        });
    }

    // ========== UNDO/REDO KEYBOARD SHORTCUTS ==========
    document.addEventListener('keydown', (e) => {
        if (!undoRedoManager) return;

        // Ctrl+Z or Cmd+Z for Undo
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            if (undoRedoManager.canUndo()) {
                const state = undoRedoManager.undo();
                if (state) {
                    applyFormData(state);
                    updateStatus('↶ Undo');
                }
            }
        }

        // Ctrl+Shift+Z or Cmd+Shift+Z for Redo
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
            e.preventDefault();
            if (undoRedoManager.canRedo()) {
                const state = undoRedoManager.redo();
                if (state) {
                    applyFormData(state);
                    updateStatus('↷ Redo');
                }
            }
        }
    });

    // ========== RANDOM DATA BUTTON ==========
    const randomBtn = document.getElementById('randomData');
    if (randomBtn) {
        randomBtn.addEventListener('click', () => {
            const newData = {
                username: generateUsername(),
                password: generateCustomPassword(),
                fullName: generateVietnameseName(),
                phone: generateVietnamesePhone(),
                email: generateCustomEmail(),
                birthdate: generateRandomBirthdate()
            };

            if (undoRedoManager) {
                undoRedoManager.saveState(newData, 'Generate Random Data');
            }

            applyFormData(newData);
            const bulkEl = document.getElementById('bulkInput');
            if (bulkEl) {
                bulkEl.value = `${newData.username}|${newData.password}|${newData.fullName}|${newData.phone}|${newData.email}|${newData.birthdate}`;
            }
            autoSaveData();
            updateStatus('✅ Đã tạo dữ liệu ngẫu nhiên');
        });
    }

    // ========== QUICK GENERATORS ==========
    const genPasswordBtn = document.getElementById('genPassword');
    if (genPasswordBtn) {
        genPasswordBtn.addEventListener('click', () => {
            const newPassword = generateCustomPassword();
            const state = getCurrentFormData();
            state.password = newPassword;
            if (undoRedoManager) undoRedoManager.saveState(state, 'Generate Password');
            if (document.getElementById('password')) {
                document.getElementById('password').value = newPassword;
            }
            updateBulkInput();
            autoSaveData();
            updateStatus('✅ Mật khẩu mới');
        });
    }

    const genEmailBtn = document.getElementById('genEmail');
    if (genEmailBtn) {
        genEmailBtn.addEventListener('click', () => {
            const newEmail = generateCustomEmail();
            const state = getCurrentFormData();
            state.email = newEmail;
            if (undoRedoManager) undoRedoManager.saveState(state, 'Generate Email');
            if (document.getElementById('email')) {
                document.getElementById('email').value = newEmail;
            }
            updateBulkInput();
            autoSaveData();
            updateStatus('✅ Email mới');
        });
    }

    const genPhoneBtn = document.getElementById('genPhone');
    if (genPhoneBtn) {
        genPhoneBtn.addEventListener('click', () => {
            const newPhone = generateVietnamesePhone();
            const state = getCurrentFormData();
            state.phone = newPhone;
            if (undoRedoManager) undoRedoManager.saveState(state, 'Generate Phone');
            if (document.getElementById('phone')) {
                document.getElementById('phone').value = newPhone;
            }
            updateBulkInput();
            autoSaveData();
            updateStatus('✅ SĐT mới');
        });
    }

    const genNameBtn = document.getElementById('genName');
    if (genNameBtn) {
        genNameBtn.addEventListener('click', () => {
            const nameEl = document.getElementById('nameInput');
            const customName = nameEl?.value.trim();
            const name = customName || generateVietnameseName();
            const username = generateUsernameFromName(name);

            const state = getCurrentFormData();
            state.fullName = name;
            state.username = username;
            if (undoRedoManager) undoRedoManager.saveState(state, 'Generate Name');

            if (document.getElementById('fullName')) {
                document.getElementById('fullName').value = name;
            }
            if (document.getElementById('username')) {
                document.getElementById('username').value = username;
            }
            updateBulkInput();
            autoSaveData();
            updateStatus('✅ Tên và username mới');
        });
    }

    const nameInput = document.getElementById('nameInput');
    if (nameInput) {
        nameInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
            autoSaveData();
        });
    }

    const genBirthdateBtn = document.getElementById('genBirthdate');
    if (genBirthdateBtn) {
        genBirthdateBtn.addEventListener('click', () => {
            const newBirthdate = generateRandomBirthdate();
            const state = getCurrentFormData();
            state.birthdate = newBirthdate;
            if (undoRedoManager) undoRedoManager.saveState(state, 'Generate Birthdate');
            if (document.getElementById('birthdate')) {
                document.getElementById('birthdate').value = newBirthdate;
            }
            updateBulkInput();
            autoSaveData();
            updateStatus('✅ Ngày sinh mới');
        });
    }

    document.addEventListener('click', (e) => {
        if (e.target.id === 'genUsername') {
            const newUsername = generateUsername();
            const state = getCurrentFormData();
            state.username = newUsername;
            if (undoRedoManager) undoRedoManager.saveState(state, 'Generate Username');
            if (document.getElementById('username')) {
                document.getElementById('username').value = newUsername;
            }
            updateBulkInput();
            autoSaveData();
            updateStatus('✅ Username mới');
        }
    });

    // ========== AUTO REGISTER & FILL ==========
    const autoRegisterBtn = document.getElementById('autoRegister');
    if (autoRegisterBtn) {
        autoRegisterBtn.addEventListener('click', async () => {
            updateStatus('Đang tự động đăng ký...');
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            try {
                const data = getCurrentFormData();
                if (!data.username || !data.password) {
                    updateStatus('❌ Cần username và password');
                    return;
                }

                let delay = 100;
                let autoPhone84 = false;

                if (settingsManager) {
                    const formSettings = settingsManager.getFormSettings();
                    delay = formSettings.delay;
                    autoPhone84 = formSettings.autoPhone84;
                }

                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: autoRegisterScript,
                    args: [data, delay, autoPhone84]
                });

                saveAccountToHistory(data, tab.url, true);
                updateStatus('✅ Đăng ký hoàn tất!');
            } catch (error) {
                saveAccountToHistory(getCurrentFormData(), tab.url, false);
                updateStatus('❌ Lỗi: ' + error.message);
            }
        });
    }

    const fillAllTabsBtn = document.getElementById('fillAllTabs');
    if (fillAllTabsBtn) {
        fillAllTabsBtn.addEventListener('click', async () => {
            updateStatus('Đang điền tất cả tabs...');

            try {
                const data = getCurrentFormData();
                if (!data.username || !data.password) {
                    updateStatus('❌ Cần username và password');
                    return;
                }

                let delay = 100;
                let autoPhone84 = false;

                if (settingsManager) {
                    const formSettings = settingsManager.getFormSettings();
                    delay = formSettings.delay;
                    autoPhone84 = formSettings.autoPhone84;
                }

                const tabs = await chrome.tabs.query({});
                let successCount = 0;
                let totalCount = 0;

                for (const tab of tabs) {
                    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
                        continue;
                    }

                    totalCount++;
                    try {
                        await chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            func: autoRegisterScript,
                            args: [data, delay, autoPhone84]
                        });

                        saveAccountToHistory(data, tab.url, true);
                        successCount++;
                    } catch (error) {
                        console.log(`Lỗi tab ${tab.id}:`, error);
                        saveAccountToHistory(data, tab.url, false);
                    }
                }

                updateStatus(`✅ Hoàn tất ${successCount}/${totalCount} tabs`);
            } catch (error) {
                updateStatus('❌ Lỗi: ' + error.message);
            }
        });
    }

    // ========== EXPORT BUTTONS ==========
    const exportTxtBtn = document.getElementById('exportTxt');
    if (exportTxtBtn) {
        exportTxtBtn.addEventListener('click', () => {
            chrome.storage.local.get(['accountsHistory'], (result) => {
                const accounts = result.accountsHistory || [];
                const exported = ExportManager.exportAccounts(accounts, 'txt');
                if (exported) {
                    ExportManager.downloadFile(exported.content, exported.filename, exported.type);
                    updateStatus(`✅ Đã xuất ${accounts.length} tài khoản (TXT)`);
                } else {
                    updateStatus('❌ Không có dữ liệu để xuất');
                }
            });
        });
    }

    const exportCsvBtn = document.getElementById('exportCsv');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => {
            chrome.storage.local.get(['accountsHistory'], (result) => {
                const accounts = result.accountsHistory || [];
                const exported = ExportManager.exportAccounts(accounts, 'csv');
                if (exported) {
                    ExportManager.downloadFile(exported.content, exported.filename, exported.type);
                    updateStatus(`✅ Đã xuất ${accounts.length} tài khoản (CSV)`);
                } else {
                    updateStatus('❌ Không có dữ liệu để xuất');
                }
            });
        });
    }

    const exportJsonBtn = document.getElementById('exportJson');
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', () => {
            chrome.storage.local.get(['accountsHistory'], (result) => {
                const accounts = result.accountsHistory || [];
                const exported = ExportManager.exportAccounts(accounts, 'json');
                if (exported) {
                    ExportManager.downloadFile(exported.content, exported.filename, exported.type);
                    updateStatus(`✅ Đã xuất ${accounts.length} tài khoản (JSON)`);
                } else {
                    updateStatus('❌ Không có dữ liệu để xuất');
                }
            });
        });
    }


  /**
     * Auto register script (returns function to be executed in content script)
     */
    getAutoRegisterScript() {
        return async function (data, delay, autoPhone84, apiKey) {
            const fillField = async (selectors, value) => {
                if (!value) return false;
                for (const selector of selectors) {
                    const el = document.querySelector(selector);
                    if (el && el.offsetParent !== null) { // Check if visible
                        el.focus();
                        el.value = value;
                        ['input', 'change', 'keyup', 'blur'].forEach(eventType => {
                            el.dispatchEvent(new Event(eventType, { bubbles: true }));
                        });
                        await new Promise(resolve => setTimeout(resolve, delay));
                        return true;
                    }
                }
                return false;
            };

            const getImageAsBase64 = async (imgElement) => {
                try {
                    if (imgElement.tagName === 'IMG' && imgElement.offsetParent !== null) {
                        const canvas = document.createElement('canvas');
                        canvas.width = imgElement.width;
                        canvas.height = imgElement.height;
                        const ctx = canvas.getContext('2d');

                        if (!imgElement.complete) {
                            await new Promise((resolve) => {
                                imgElement.onload = resolve;
                                imgElement.onerror = resolve;
                            });
                        }

                        ctx.drawImage(imgElement, 0, 0);
                        return canvas.toDataURL('image/png');
                    }
                } catch (error) {
                    console.log('Lỗi chuyển ảnh sang Base64:', error);
                }
                return null;
            };

            const solveCaptcha = async () => {
                try {
                    const captchaInput = document.querySelector(
                        `input[formcontrolname='checkCode'],
                         input[ng-model='$ctrl.code'],
                         input[name='verificationCode'],
                         input[name='verifyCode'],
                         input[name='captcha'],
                         input[name='code']`
                    ) || [...document.querySelectorAll('input[type="text"]')].find(el =>
                        /captcha|xác minh|xác nhận|verification|verify|otp/i.test(el.placeholder || '')
                    );

                    if (!captchaInput) return true;

                    await captchaInput.click();
                    await new Promise(resolve => setTimeout(resolve, 500));

                    let captchaImg = document.querySelector(
                        `img[ng-src*='data:image/png;base64'],
                         img[src*='data:image/png;base64'],
                         img.captcha,
                         img[alt*='captcha'],
                         img[alt*='Captcha']`
                    );

                    // Try to find refresh button if captcha not found
                    if (!captchaImg) {
                        const refreshBtn = document.querySelector(
                            `i.fas.fa-sync.refresh,
                             .refresh,
                             button[class*='refresh'],
                             [class*='reload']`
                        );
                        if (refreshBtn) {
                            refreshBtn.click();
                            await new Promise(resolve => setTimeout(resolve, 1500));
                            captchaImg = document.querySelector(
                                `img[ng-src*='data:image/png;base64'],
                                 img[src*='data:image/png;base64'],
                                 img.captcha,
                                 img[alt*='captcha']`
                            );
                        }
                    }

                    if (!captchaImg) return true;

                    let base64Data = null;
                    const imgSrc = captchaImg.getAttribute('ng-src') || captchaImg.getAttribute('src');

                    if (imgSrc && imgSrc.includes('data:image')) {
                        base64Data = imgSrc;
                        if (base64Data.includes(',')) {
                            base64Data = base64Data.split(',')[1];
                        }
                    } else {
                        base64Data = await getImageAsBase64(captchaImg);
                        if (base64Data && base64Data.includes(',')) {
                            base64Data = base64Data.split(',')[1];
                        }
                    }

                    if (!base64Data) return true;

                    const response = await fetch('https://autocaptcha.pro/apiv3/process', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            key: apiKey,
                            type: 'imagetotext',
                            img: `data:image/png;base64,${base64Data}`,
                            numeric: 2,
                            min_len: 4,
                            max_len: 4
                        })
                    });

                    if (!response.ok) return true;

                    const result = await response.json();

                    if (result.success === 1 && result.captcha && result.captcha.length >= 4) {
                        const captchaText = result.captcha.toString().substring(0, 4).toUpperCase();
                        captchaInput.focus();
                        captchaInput.value = captchaText;
                        ['input', 'change', 'keyup', 'blur'].forEach(eventType => {
                            captchaInput.dispatchEvent(new Event(eventType, { bubbles: true }));
                        });
                        return true;
                    }
                    return false;
                } catch (error) {
                    console.log('Lỗi khi giải CAPTCHA:', error.message);
                    return false;
                }
            };

            try {
                await fillField([
                    "input[name='username']",
                    "input.form-control.username",
                    "input[placeholder='Tên người dùng']",
                    "input[placeholder*='tài khoản']",
                    "input[placeholder='Tên Đăng Nhập']",
                    "input#username",
                    "input[data-input-name='account']",
                    "input#playerid",
                    "input[placeholder*='Số điện thoại/Tên tài khoản']",
                    "input[placeholder='Tên đăng nhập']"
                ], data.username);

                await fillField([
                    "input[name='password']",
                    "input[type='password'][name='password']",
                    "input.form-control.password",
                    "input[type='password']:not([formcontrolname='confirmPassword'])",
                    "input[placeholder='Mật khẩu']",
                    "input#password[type='text']",
                    "input#password",
                    "input[data-input-name='userpass']",
                    "input[placeholder='Nhập mật khẩu']",
                    "input[type='password']"
                ], data.password);

                await fillField(["input[formcontrolname='confirmPassword']"], data.password);
                await fillField(["input[formcontrolname='moneyPassword']"], "123456");

                await fillField([
                    "input[name='payeeName']",
                    "input.reg-payeeName",
                    "input[formcontrolname='name']",
                    "input[for='fullname']",
                    "input.standard-input[placeholder*='Họ']",
                    "input[data-input-name='realName']",
                    "input#firstname",
                    "input[placeholder*='họ tên']",
                    "input[placeholder*='Họ tên']",
                    "input[placeholder*='đầy đủ họ tên']"
                ], data.fullName);

                let phoneValue = data.phone;
                if (autoPhone84 && phoneValue && !phoneValue.startsWith('84')) {
                    phoneValue = '84' + phoneValue.replace(/^0/, '');
                }

                await fillField([
                    "input#email",
                    "input[type='email']",
                    "input[placeholder*='Email']",
                    "input.standard-input.standard-form-col-100",
                    "input[formcontrolname='email']",
                    "input[placeholder*='E-mail']",
                    "input[placeholder*='Địa chỉ E-mail']"
                ], data.email);

                await fillField([
                    "input[name='mobileNum1']",
                    "input.form-mobileNum",
                    "input[formcontrolname='mobile']",
                    "input[type='tel']",
                    "input[placeholder*='Số điện thoại']",
                    "input[pattern='[0-9]*']",
                    "input[data-test-id*='telephoneinput']",
                    "input[autocomplete='tel']",
                    "input[placeholder*='+84']",
                    "input[placeholder*='+86']"
                ], phoneValue);

                await fillField(["input[formcontrolname='birthday']", "input[type='date']"], data.birthdate);

                const checkbox = document.querySelector("input[type='checkbox']");
                if (checkbox && !checkbox.checked) {
                    checkbox.click();
                }

                await solveCaptcha();
                await new Promise(resolve => setTimeout(resolve, 1000));

                const submitBtn = document.querySelector(
                    `button.register-button,
                     button.submit-btn,
                     button[type='submit'],
                     button.login-btn,
                     button[type='button'].submit-btn,
                     span[translate='Login_RegisterBtn'],
                     .ui-button__content,
                     span.ui-button__text,
                     button.nrc-button,
                     button[title=''],
                     .signup-tag`
                );

                if (submitBtn) {
                    if (submitBtn.tagName === 'SPAN' || submitBtn.classList.contains('ui-button__content')) {
                        submitBtn.parentElement?.click();
                    } else {
                        submitBtn.click();
                    }
                }

                return { success: true };
            } catch (error) {
                console.log('Lỗi trong autoRegisterScript:', error.message);
                return { success: false, error: error.message };
            }
        };
    }

    // ========== GENERATOR FUNCTIONS ==========
    function generateUsernameFromName(fullName) {
        if (!fullName) return generateUsername();
        const parts = fullName.toLowerCase().split(' ').filter(p => p);
        if (parts.length < 2) return generateUsername();
        const numbers = Math.floor(Math.random() * 900) + 100;
        let patterns = [];

        if (parts.length === 2) {
            patterns = [parts[0] + parts[1] + numbers, parts[1] + numbers];
        } else if (parts.length === 3) {
            patterns = [
                parts[1] + parts[2] + numbers,
                parts[0] + parts[2] + numbers,
                parts[2] + numbers
            ];
        } else if (parts.length >= 4) {
            const lastName = parts[parts.length - 1];
            const middleName = parts[parts.length - 2];
            const firstName = parts[0];
            patterns = [
                middleName + lastName + numbers,
                firstName + lastName + numbers,
                lastName + numbers
            ];
        }

        return patterns[Math.floor(Math.random() * patterns.length)];
    }

    function generateUsername() {
        const prefixes = [
            'druk', 'maki', 'akio', 'papu', 'yuki', 'hiro', 'kazu', 'taro', 'ryu', 'suki', 'tama', 'zane',
            'niko', 'aiko', 'reno', 'yuna', 'riko', 'kira', 'sota', 'nari', 'tobi', 'lani', 'mina', 'zuri'
        ];
        const numbers = Math.floor(Math.random() * 99) + 10;
        const letters = 'abcdefghijklmnopqrstuvwxyz';
        const extraChar = letters[Math.floor(Math.random() * letters.length)];
        return prefixes[Math.floor(Math.random() * prefixes.length)] + numbers + extraChar;
    }

    function generateCustomEmail() {
        const names = [
            'emilia', 'daniel', 'ethan', 'nathan', 'sophia', 'isabel', 'thomas', 'carter', 'lucas', 'naomi',
            'selena', 'keegan', 'andrew', 'leonie', 'jamila', 'john', 'mary', 'alex', 'sara', 'mike'
        ];
        const firstName = names[Math.floor(Math.random() * names.length)];
        const lastName = names[Math.floor(Math.random() * names.length)];
        const numbers = Math.floor(Math.random() * 9999) + 1;
        const patterns = [
            `${firstName}.${lastName}${numbers}@gmail.com`,
            `${firstName}${lastName}${numbers}@gmail.com`,
            `${firstName}.${numbers}@gmail.com`,
            `${firstName}${numbers}@gmail.com`
        ];
        return patterns[Math.floor(Math.random() * patterns.length)];
    }

    function generateVietnamesePhone() {
        const prefixes = ['098', '097', '096', '086', '032', '033', '034', '035'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
        return prefix + suffix;
    }

    function generateCustomPassword() {
        const words = ['love', 'babu', 'kaka', 'pola', 'blue', 'gold', 'mani', 'nice', 'nano', 'lulu'];
        const specialNumbers = ['1122', '3344', '5566', '7788', '9999'];
        const years = [];
        for (let year = 1990; year <= 2005; year++) years.push(year.toString());
        const allNumbers = [...specialNumbers, ...years];
        const word = words[Math.floor(Math.random() * words.length)];
        const number = allNumbers[Math.floor(Math.random() * allNumbers.length)];
        return word + number;
    }

    function generateVietnameseName() {
        const firstNames = ['NGUYEN', 'TRAN', 'LE', 'PHAM', 'HOANG'];
        const middleNames = ['VAN', 'THI', 'MINH', 'HONG', 'THANH'];
        const lastNames = ['AN', 'BINH', 'CUONG', 'DUNG', 'EM'];
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const middleName = middleNames[Math.floor(Math.random() * middleNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        return `${firstName} ${middleName} ${lastName}`;
    }

    function generateRandomBirthdate() {
        const startYear = 1989;
        const endYear = 2005;
        const year = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear;
        const month = Math.floor(Math.random() * 12) + 1;
        const day = Math.floor(Math.random() * 28) + 1;
        return `${year}/${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
    }

    // ========== HISTORY MANAGEMENT ==========
    function saveAccountToHistory(data, url, success) {
        chrome.storage.local.get(['accountsHistory'], (result) => {
            const accountsHistory = result.accountsHistory || [];
            accountsHistory.unshift({
                data: data,
                url: url,
                success: success,
                timestamp: Date.now()
            });
            if (accountsHistory.length > 1000) accountsHistory.splice(1000);
            chrome.storage.local.set({ accountsHistory });
            updateHistoryStats();
        });
    }

    function updateHistoryStats() {
        chrome.storage.local.get(['accountsHistory'], (result) => {
            const accounts = result.accountsHistory || [];
            const totalFills = accounts.length;
            const successCount = accounts.filter(acc => acc.success).length;
            const successRate = totalFills > 0 ? Math.round((successCount / totalFills) * 100) : 0;

            const totalEl = document.getElementById('totalFills');
            const rateEl = document.getElementById('successRate');
            if (totalEl) totalEl.textContent = totalFills;
            if (rateEl) rateEl.textContent = successRate + '%';
        });
    }

    // ========== AUTO-SAVE ON INPUT ==========
    ['username', 'password', 'fullName', 'phone', 'email', 'birthdate', 'bulkInput', 'nameInput'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', () => {
                const state = getCurrentFormData();
                if (undoRedoManager && id !== 'nameInput') {
                    undoRedoManager.saveState(state, 'Input Change');
                }
                if (id !== 'nameInput') {
                    updateBulkInput();
                }
                autoSaveData();
            });
        }
    });

    // ========== INITIALIZATION ==========
    loadSavedData();
    updateHistoryStats();
    updateStatus('Extension loaded');

    // Initialize LinkManager if exists
    setTimeout(() => {
        if (typeof LinkManager !== 'undefined' && !linkManager) {
            try {
                linkManager = new LinkManager();
                console.log('LinkManager initialized');
            } catch (error) {
                console.error('Error initializing LinkManager:', error);
            }
        }
    }, 500);
});
