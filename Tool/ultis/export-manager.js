/**
 * ExportManager - Quản lý Export dữ liệu (TXT, CSV, JSON)
 */
class ExportManager {
    /**
     * Export history accounts
     */
    static exportAccounts(accounts, format = 'txt') {
        if (!accounts || accounts.length === 0) {
            return null;
        }

        let content = '';
        let filename = `accounts_${new Date().toISOString().slice(0, 10)}`;

        switch (format) {
            case 'txt':
                content = this.toTXT(accounts);
                filename += '.txt';
                break;
            case 'csv':
                content = this.toCSV(accounts);
                filename += '.csv';
                break;
            case 'json':
                content = this.toJSON(accounts);
                filename += '.json';
                break;
            default:
                return null;
        }

        return {
            content,
            filename,
            type: this.getMimeType(format)
        };
    }

    /**
     * Export profiles
     */
    static exportProfiles(profiles, format = 'json') {
        if (!profiles || profiles.length === 0) {
            return null;
        }

        let content = '';
        let filename = `profiles_${new Date().toISOString().slice(0, 10)}`;

        switch (format) {
            case 'csv':
                content = this.profilesToCSV(profiles);
                filename += '.csv';
                break;
            case 'json':
                content = this.profilesToJSON(profiles);
                filename += '.json';
                break;
            default:
                return null;
        }

        return {
            content,
            filename,
            type: this.getMimeType(format)
        };
    }

    /**
     * Export history log
     */
    static exportHistory(history, format = 'csv') {
        if (!history || history.length === 0) {
            return null;
        }

        let content = '';
        let filename = `history_${new Date().toISOString().slice(0, 10)}`;

        switch (format) {
            case 'csv':
                content = this.historyToCSV(history);
                filename += '.csv';
                break;
            case 'json':
                content = this.historyToJSON(history);
                filename += '.json';
                break;
            default:
                return null;
        }

        return {
            content,
            filename,
            type: this.getMimeType(format)
        };
    }

    /**
     * Convert to TXT
     */
    static toTXT(accounts) {
        return accounts.map(acc => {
            const data = acc.data;
            return `${data.username}|${data.password}|${data.fullName}|${data.phone}|${data.email}|${data.birthdate}`;
        }).join('\n');
    }

    /**
     * Convert to CSV
     */
    static toCSV(accounts) {
        let csv = 'username,password,fullName,phone,email,birthdate,url,success,timestamp\n';
        accounts.forEach(acc => {
            const d = acc.data;
            const date = new Date(acc.timestamp).toISOString();
            const success = acc.success ? 'Yes' : 'No';
            csv += `"${d.username}","${d.password}","${d.fullName}","${d.phone}","${d.email}","${d.birthdate}","${acc.url}","${success}","${date}"\n`;
        });
        return csv;
    }

    /**
     * Convert to JSON
     */
    static toJSON(accounts) {
        return JSON.stringify(accounts, null, 2);
    }

    /**
     * Convert profiles to CSV
     */
    static profilesToCSV(profiles) {
        let csv = 'profileName,username,password,fullName,phone,email,birthdate,createdAt,usageCount,lastUsed\n';
        profiles.forEach(profile => {
            const d = profile.data;
            const created = new Date(profile.createdAt).toISOString();
            const lastUsed = profile.lastUsed ? new Date(profile.lastUsed).toISOString() : '';
            csv += `"${profile.name}","${d.username}","${d.password}","${d.fullName}","${d.phone}","${d.email}","${d.birthdate}","${created}",${profile.usageCount},"${lastUsed}"\n`;
        });
        return csv;
    }

    /**
     * Convert profiles to JSON
     */
    static profilesToJSON(profiles) {
        return JSON.stringify(profiles, null, 2);
    }

    /**
     * Convert history to CSV
     */
    static historyToCSV(history) {
        let csv = 'timestamp,url,action,success,username,details\n';
        history.forEach(item => {
            const date = new Date(item.timestamp).toISOString();
            const username = item.data?.username || '';
            const url = item.url || '';
            const action = item.action || 'fill';
            const success = item.success ? 'Yes' : 'No';
            csv += `"${date}","${url}","${action}","${success}","${username}",""\n`;
        });
        return csv;
    }

    /**
     * Convert history to JSON
     */
    static historyToJSON(history) {
        return JSON.stringify(history, null, 2);
    }

    /**
     * Download file
     */
    static downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Cleanup
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    /**
     * Get mime type
     */
    static getMimeType(format) {
        const types = {
            txt: 'text/plain;charset=utf-8',
            csv: 'text/csv;charset=utf-8',
            json: 'application/json;charset=utf-8'
        };
        return types[format] || 'text/plain';
    }

    /**
     * Import từ file
     */
    static importFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const content = event.target.result;
                    let data = null;

                    if (file.type === 'application/json' || file.name.endsWith('.json')) {
                        data = JSON.parse(content);
                    } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                        data = this.parseCSV(content);
                    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                        data = this.parseTXT(content);
                    }

                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    /**
     * Parse CSV
     */
    static parseCSV(csvContent) {
        const lines = csvContent.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;

            const obj = {};
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));

            headers.forEach((header, index) => {
                obj[header] = values[index] || '';
            });

            data.push(obj);
        }

        return data;
    }

    /**
     * Parse TXT
     */
    static parseTXT(txtContent) {
        const lines = txtContent.split('\n');
        const data = [];

        lines.forEach(line => {
            if (line.trim() === '') return;

            const parts = line.split('|');
            data.push({
                username: parts[0] || '',
                password: parts[1] || '',
                fullName: parts[2] || '',
                phone: parts[3] || '',
                email: parts[4] || '',
                birthdate: parts[5] || ''
            });
        });

        return data;
    }
}