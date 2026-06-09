class LinkManager {
    constructor() {
        this.gameLinks = [];
        this.promoLinks = [];
        this.selectedLinks = new Set();
        this.customTitles = {};
        this.isProcessing = false;
        setTimeout(() => this.init(), 100);
    }

    init() {
        this.loadLinksFromStorage();
        this.loadCustomTitles();
        this.initDefaultLinks();
        this.updateLinksDisplay();
        this.setupEventListeners();
    }

    initDefaultLinks() {
        const gameLinks = [
            { title: 'FLY88', url: 'https://fly88u.cc/home/register?id=575934579' },
            { title: 'CM88', url: 'https://cm8848.com/home/register?id=666087617' },
            { title: 'C168', url: 'https://c168a8.cc/home/register?id=286674147' },
            { title: 'SC88', url: 'https://m.sc8888.com/home/register?id=856540937' },
            { title: 'F168', url: 'https://m.f1686s.com/home/register' },
            { title: 'GG88', url: 'https://www.gg8809.com/home/register' },
            { title: '78WIN', url: 'https://www.78win6.zone/' },
            { title: 'MB66', url: 'https://m.sad35v16dsv2as32fc.com/Account/Register?r=2MM91G' },
            { title: 'JUN88v1', url: 'https://dasdas84.xn--886-c53e.com/?af=AJGA35' },
            { title: 'JUN88v2', url: 'https://iogkfdngosi.jun883.wiki/vi-vn/home' },
            { title: 'NEW88', url: 'https://m.vuhkbopkeih834jkndfjotrgujg.com/Account/Register?r=2LLJ5W' },
            { title: 'F8BET', url: 'https://m.jsdujkg8djjkuqw8czbm.com/Account/Register?r=90JO8W' },
            { title: 'Hi88', url: 'https://m.www-24h-com-vn-com.com/Account/Register?r=105EPG' },
            { title: '789BET', url: 'https://m.rd9iozpvmsjugfjwcujwu9437shau.com' },
            { title: 'SHBET', url: 'https://m.jsfnjgnmroieuy5mkhm057nd.com/Account/Register' },
            { title: 'MM88', url: 'http://gioithieu.mm88n.com/?referralCode=wdd6254' },
            { title: 'XX88', url: 'https://www.xx88com.com/register?affiliateCode=xx88seo' },
            { title: 'RR88', url: 'https://rr88seo.rr8391.com/m/register' },
            { title: '98WIN', url: 'https://98win33.top/?f=13507&app=1  ' },
            { title: 'CWIN', url: 'https://cwin53.com?r=JW0D3W' },
            { title: 'KING88', url: 'https://65king88.com?r=Z713JW' },
            { title: 'HUBET', url: 'https://hubet54.com?r=QW4OZD' },
            { title: 'HELLO88', url: 'https://hello8834.com?r=9GEOEW' },
            { title: '8KBET', url: ' https://m.8k2933m.top/Account/Register' },
            { title: 'App88CLB', url: 'https://m.88ef.ink/?f=4556781&app=1' },
            { title: 'AppU888', url: 'https://u8882.ink/?f=2551606&app=1' },
            { title: 'AppJ88', url: 'https://m.j889qp.online/?f=4556781&app=1' },
            { title: 'AppABC8', url: 'https://abc11.link/?f=1090114&app=1' },
            { title: 'QQ88', url: 'https://gioithieu.qq477.com/?referralCode=lrm7217' },
            { title: 'MMOO', url: 'https://www.mmoo.team/?f=394579' },
            { title: 'NOHU', url: 'https://8nohu.vip/?f=6344995' },
            { title: '789p', url: 'https://www.789p1.vip/?f=784461' },
            { title: 'TT88', url: 'https://1tt88.vip/?f=3535864' },
            { title: 'AppMMOO', url: 'https://m.0mmoo.com/?app=1' },
            { title: 'App789p', url: 'https://www.jvdf76fd92jk87gfuj60o.xyz/?app=1' },
            { title: 'AppNOHU', url: 'https://m.6nohu.vip/?app=1' },
            { title: 'AppTT88', url: 'https://m.1bedd-fb89bj53gg9hjs0bka.club/?app=1' },
            { title: '88Vv', url: 'https://m.888vvv.bet/?f=1054152' },
            { title: '33win', url: 'https://3333win.cc/?f=3115867' },
            { title: 'go99', url: 'https://1go99.vip/?f=3528698' },
            { title: 'App88Vv', url: 'https://m.885753.com/?app=1' },
            { title: 'Appgo99', url: 'https://m.gjjdhh-235dhdlhkk.vip/?app=1' },
            { title: 'App33win', url: 'https://m.336049.com/?app=1' },
            { title: 'vswin', url: 'https://020020.cc?r=OGPQ8X' }
        ];
        const promoLinks = [

            { title: 'kmFLY88', url: 'https://fly88code.net/?promo_id=FLY58' },
            { title: 'kmCM88', url: 'https://khuyenmaicm88.com/?promo_id=CM58K' },
            { title: 'kmSC88', url: 'https://khuyenmai-sc88.pages.dev//?promo_id=SC68K' },
            { title: 'kmC168', url: 'https://khuyen-mai-c168.pages.dev/?promo_id=C68K' },
            { title: 'kmF168', url: 'https://sukien.xyz/?promo_id=FN68K' },
            { title: 'kmGG88', url: 'https://gg88-ttkm.tranie-dev.workers.dev/' },
            { title: 'kmJUN88v1', url: 'https://trungtam.khuyenmaijun881.win/?promo_id=FR58' },
            { title: 'kmJUN88v2', url: 'https://jun88ok99.com/?promo_id=FR58' },
            { title: 'kmMB66', url: 'https://ttkm-mb66okvip02.pages.dev/' },
            { title: 'kmSHBET', url: 'https://khuyenmai-shbet01.pages.dev/?promo_id=SH57K' },
            { title: 'km789BET', url: 'https://ttkm789bet04.pages.dev/' },
            { title: 'kmF8BET', url: 'https://ttkm-f8bet01.pages.dev/?promo_id=KM58' },
            { title: 'kmNEW88', url: 'https://khuyenmai-new88okvip1.pages.dev/?promo_id=N58' },
            { title: 'kmNOHU', url: 'https://nohucode.shop/' },
            { title: 'kmMMOO', url: 'https://link2.mmoocode.net' },
            { title: 'km789p', url: 'https://789pcode.store/' },
            { title: 'kmTT88', url: 'https://tt88code.store/' },
            { title: 'km78WIN', url: 'https://qrkyynspinavu9exziiq5m4jcovui2jr7y8oktwituag5vsxtgxax18.daily78win.net/' },
            { title: 'KM88CLB', url: 'https://88clb88.xyz/' },
            { title: 'kmABC8', url: 'https://www.88abc8.cc/' },
            { title: 'kmJ88', url: 'https://j8j88.com/' },
            { title: 'kmU888', url: 'https://88u888.club/' },
            { title: 'kmRR88', url: 'https://rr88ttkm.com' },
            { title: 'kmXX88', url: 'https://mm88ttkm.com' },
            { title: 'kmMM88', url: 'https://xx88ttkm.com' },
        ];

        if (this.gameLinks.length === 0) {
            gameLinks.forEach(item => {
                this.gameLinks.push(item.url);
                this.customTitles[item.url] = item.title;
            });
            promoLinks.forEach(item => {
                this.promoLinks.push(item.url);
                this.customTitles[item.url] = item.title;
            });
            this.saveLinksToStorage();
            this.saveCustomTitles();
        }
    }

    setupEventListeners() {
        const buttons = {
            selectAllLinks: () => this.selectAllLinks(),
            unselectAllLinks: () => this.unselectAllLinks(),
            openSelectedLinks: () => this.openSelectedLinks()
        };

        Object.entries(buttons).forEach(([id, handler]) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', handler);
            }
        });
    }

    createLinkItem(link) {
        const linkItem = document.createElement('div');
        linkItem.className = 'link-item';
        linkItem.style.cursor = 'pointer';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'link-checkbox';
        checkbox.checked = this.selectedLinks.has(link);

        const linkText = document.createElement('span');
        linkText.className = 'link-text';
        linkText.title = link;
        linkText.textContent = this.customTitles[link] || this.truncateUrl(link);

        linkItem.appendChild(checkbox);
        linkItem.appendChild(linkText);

        linkItem.addEventListener('click', (e) => {
            if (e.target === checkbox) return;
            checkbox.checked = !checkbox.checked;
            if (checkbox.checked) {
                this.selectedLinks.add(link);
            } else {
                this.selectedLinks.delete(link);
            }
            this.updateLinksStats();
        });

        linkItem.addEventListener('dblclick', () => {
            if (typeof chrome !== 'undefined' && chrome.tabs) {
                chrome.tabs.create({ url: link });
            } else {
                window.open(link, '_blank');
            }
        });

        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                this.selectedLinks.add(link);
            } else {
                this.selectedLinks.delete(link);
            }
            this.updateLinksStats();
        });

        return linkItem;
    }

    selectAllLinks() {
        this.selectedLinks = new Set([...this.gameLinks, ...this.promoLinks]);
        this.updateLinksDisplay();
    }

    unselectAllLinks() {
        this.selectedLinks.clear();
        this.updateLinksDisplay();
    }

    async openSelectedLinks() {
        if (this.isProcessing || this.selectedLinks.size === 0) return;

        this.isProcessing = true;
        let openedCount = 0;
        const urlsToOpen = [...this.selectedLinks];

        try {
            for (const url of urlsToOpen) {
                try {
                    await chrome.tabs.create({ url: url, active: false });
                    openedCount++;
                    await new Promise(resolve => setTimeout(resolve, 300));
                } catch (error) {
                    console.error('Lỗi mở link:', url, error);
                }
            }
        } finally {
            this.isProcessing = false;
        }
    }

    updateLinksDisplay() {
        const gameContainer = document.getElementById('gameLinksContainer');
        const promoContainer = document.getElementById('promoLinksContainer');

        if (gameContainer) {
            gameContainer.innerHTML = '';
            this.gameLinks.forEach(link => {
                const linkItem = this.createLinkItem(link);
                gameContainer.appendChild(linkItem);
            });
        }

        if (promoContainer) {
            promoContainer.innerHTML = '';
            this.promoLinks.forEach(link => {
                const linkItem = this.createLinkItem(link);
                promoContainer.appendChild(linkItem);
            });
        }

        this.updateLinksStats();
    }

    updateLinksStats() {
        const linksCountEl = document.getElementById('linksCount');
        const selectedCountEl = document.getElementById('selectedCount');
        const totalLinks = this.gameLinks.length + this.promoLinks.length;

        if (linksCountEl) {
            linksCountEl.textContent = `${totalLinks} links`;
        }
        if (selectedCountEl) {
            selectedCountEl.textContent = `${this.selectedLinks.size} đã chọn`;
        }
    }

    truncateUrl(url) {
        try {
            const urlObj = new URL(url);
            let hostname = urlObj.hostname.replace(/^(www\.|m\.)/, '');
            return hostname.length > 12 ? hostname.substring(0, 9) + '...' : hostname;
        } catch {
            return url.length <= 20 ? url : url.substring(0, 17) + '...';
        }
    }

    saveLinksToStorage() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({
                gameLinks: this.gameLinks,
                promoLinks: this.promoLinks
            });
        }
    }

    loadLinksFromStorage() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['gameLinks', 'promoLinks'], (result) => {
                if (result.gameLinks) this.gameLinks = result.gameLinks;
                if (result.promoLinks) this.promoLinks = result.promoLinks;
                this.updateLinksDisplay();
            });
        }
    }

    saveCustomTitles() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ customTitles: this.customTitles });
        }
    }

    loadCustomTitles() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['customTitles'], (result) => {
                if (result.customTitles) {
                    this.customTitles = result.customTitles;
                    this.updateLinksDisplay();
                }
            });
        }
    }
}
