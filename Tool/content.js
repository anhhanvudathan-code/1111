// Content script để hỗ trợ tự động phát hiện form và các tính năng nâng cao

class FormDetector {
    constructor() {
        this.forms = [];
        this.observer = null;
        this.init();
    }

    init() {
        this.scanForms();
        this.setupObserver();
        this.setupMessageListener();
    }

    scanForms() {
        const forms = document.querySelectorAll('form');
        const inputs = document.querySelectorAll('input, select, textarea');

        this.forms = Array.from(forms).map(form => this.analyzeForm(form));

        // Nếu không có form, phân tích tất cả inputs
        if (this.forms.length === 0 && inputs.length > 0) {
            this.forms.push(this.analyzeInputs(Array.from(inputs)));
        }
    }

    analyzeForm(form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        return {
            element: form,
            action: form.action,
            method: form.method,
            fields: Array.from(inputs).map(input => this.analyzeField(input))
        };
    }

    analyzeInputs(inputs) {
        return {
            element: document.body,
            action: window.location.href,
            method: 'unknown',
            fields: inputs.map(input => this.analyzeField(input))
        };
    }

    analyzeField(field) {
        const fieldInfo = {
            element: field,
            tag: field.tagName.toLowerCase(),
            type: field.type || 'text',
            name: field.name || '',
            id: field.id || '',
            placeholder: field.placeholder || '',
            className: field.className || '',
            required: field.required,
            value: field.value || '',
            selector: this.generateSelector(field)
        };

        fieldInfo.fieldType = this.classifyField(fieldInfo);
        fieldInfo.confidence = this.calculateConfidence(fieldInfo);

        return fieldInfo;
    }

    generateSelector(element) {
        // Tạo selector tối ưu
        if (element.id) return `#${element.id}`;
        if (element.name) return `[name="${element.name}"]`;
        if (element.placeholder) return `[placeholder="${element.placeholder}"]`;

        // Fallback selector
        let selector = element.tagName.toLowerCase();
        if (element.type) selector += `[type="${element.type}"]`;
        if (element.className) selector += `.${element.className.split(' ')[0]}`;

        return selector;
    }

    classifyField(field) {
        const text = `${field.name} ${field.id} ${field.placeholder} ${field.className}`.toLowerCase();
        const type = field.type.toLowerCase();

        // Phân loại dựa trên type
        if (type === 'password') return 'password';
        if (type === 'email') return 'email';
        if (type === 'tel') return 'phone';
        if (type === 'date') return 'dob';
        if (type === 'checkbox') return 'checkbox';
        if (type === 'radio') return 'radio';

        // Phân loại dựa trên text content
        const patterns = {
            username: ['user', 'login', 'tài khoản', 'account', 'username'],
            password: ['pass', 'mật khẩu', 'password', 'pwd'],
            email: ['email', 'mail', 'e-mail'],
            phone: ['phone', 'tel', 'điện thoại', 'sdt', 'mobile'],
            fullName: ['name', 'tên', 'họ', 'fullname', 'full_name'],
            firstName: ['first', 'fname', 'given'],
            lastName: ['last', 'lname', 'family', 'surname'],
            dob: ['birth', 'sinh', 'ngày', 'date', 'dob'],

        };

        for (const [fieldType, keywords] of Object.entries(patterns)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return fieldType;
            }
        }

        return 'unknown';
    }

    calculateConfidence(field) {
        let confidence = 0;

        // Tăng confidence dựa trên type match
        if (field.type === 'password' && field.fieldType === 'password') confidence += 0.9;
        if (field.type === 'email' && field.fieldType === 'email') confidence += 0.9;
        if (field.type === 'tel' && field.fieldType === 'phone') confidence += 0.8;

        // Tăng confidence dựa trên name/id match
        const text = `${field.name} ${field.id}`.toLowerCase();
        if (text.includes(field.fieldType)) confidence += 0.7;

        // Tăng confidence dựa trên placeholder match
        if (field.placeholder.toLowerCase().includes(field.fieldType)) confidence += 0.6;

        // Required fields có confidence cao hơn
        if (field.required) confidence += 0.2;

        return Math.min(confidence, 1.0);
    }

    setupObserver() {
        // Theo dõi thay đổi DOM để phát hiện form mới
        this.observer = new MutationObserver((mutations) => {
            let shouldRescan = false;

            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1) { // Element node
                            if (node.tagName === 'FORM' || node.querySelector('form, input, select, textarea')) {
                                shouldRescan = true;
                            }
                        }
                    });
                }
            });

            if (shouldRescan) {
                setTimeout(() => this.scanForms(), 500);
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action) {
                case 'detectForms':
                    sendResponse(this.getFormData());
                    break;
                case 'fillForm':
                    this.fillForm(request.data, request.options);
                    sendResponse({ success: true });
                    break;
                case 'highlightFields':
                    this.highlightFields(request.fieldTypes);
                    sendResponse({ success: true });
                    break;
                case 'getPageInfo':
                    sendResponse(this.getPageInfo());
                    break;
            }
        });
    }

    getFormData() {
        return {
            url: window.location.href,
            title: document.title,
            forms: this.forms.map(form => ({
                action: form.action,
                method: form.method,
                fields: form.fields.map(field => ({
                    fieldType: field.fieldType,
                    type: field.type,
                    name: field.name,
                    id: field.id,
                    placeholder: field.placeholder,
                    required: field.required,
                    selector: field.selector,
                    confidence: field.confidence
                }))
            }))
        };
    }

    async fillForm(data, options = {}) {
        const delay = options.delay || 100;
        const highlight = options.highlight || false;

        for (const form of this.forms) {
            for (const field of form.fields) {
                const value = data[field.fieldType];
                if (value && field.element) {
                    await this.fillField(field.element, value, delay, highlight);
                }
            }
        }

        // Auto-submit nếu được yêu cầu
        if (options.autoSubmit) {
            setTimeout(() => {
                const submitBtn = document.querySelector('input[type="submit"], button[type="submit"], button:contains("submit")');
                if (submitBtn) submitBtn.click();
            }, delay * 2);
        }
    }

    async fillField(element, value, delay, highlight) {
        if (highlight) {
            element.style.border = '2px solid #007cba';
            element.style.backgroundColor = '#e7f3ff';
        }

        element.focus();

        // Xử lý các loại field khác nhau
        if (element.type === 'checkbox' || element.type === 'radio') {
            if (value && !element.checked) element.click();
        } else if (element.tagName === 'SELECT') {
            // Tìm option phù hợp
            const option = Array.from(element.options).find(opt =>
                opt.value === value || opt.text.includes(value)
            );
            if (option) element.value = option.value;
        } else {
            // Text input
            element.value = value;
        }

        // Trigger events
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));

        if (highlight) {
            setTimeout(() => {
                element.style.border = '';
                element.style.backgroundColor = '';
            }, 1000);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
    }

    highlightFields(fieldTypes) {
        this.forms.forEach(form => {
            form.fields.forEach(field => {
                if (fieldTypes.includes(field.fieldType)) {
                    field.element.style.border = '2px solid #28a745';
                    field.element.style.backgroundColor = '#d4edda';

                    setTimeout(() => {
                        field.element.style.border = '';
                        field.element.style.backgroundColor = '';
                    }, 3000);
                }
            });
        });
    }

    getPageInfo() {
        return {
            url: window.location.href,
            title: document.title,
            domain: window.location.hostname,
            hasForm: this.forms.length > 0,
            fieldCount: this.forms.reduce((total, form) => total + form.fields.length, 0),
            detectedTypes: [...new Set(this.forms.flatMap(form =>
                form.fields.map(field => field.fieldType)
            ))].filter(type => type !== 'unknown')
        };
    }
}

// Khởi tạo khi trang load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new FormDetector();
        new ContentLinkManager();
    });
} else {
    new FormDetector();
    new ContentLinkManager();
}
