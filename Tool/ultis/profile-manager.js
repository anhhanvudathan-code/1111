/**
 * ProfileManager - Quản lý nhiều profile tài khoản
 */
class ProfileManager {
    constructor() {
        this.profiles = [];
        this.currentProfileId = null;
        this.loadProfiles();
    }

    /**
     * Tạo profile mới
     */
    createProfile(name, data) {
        const profile = {
            id: `profile_${Date.now()}`,
            name: name,
            data: {
                username: data.username || '',
                password: data.password || '',
                fullName: data.fullName || '',
                phone: data.phone || '',
                email: data.email || '',
                birthdate: data.birthdate || ''
            },
            createdAt: Date.now(),
            updatedAt: Date.now(),
            usageCount: 0,
            lastUsed: null,
            tags: data.tags || []
        };

        this.profiles.push(profile);
        this.saveProfiles();
        return profile;
    }

    /**
     * Cập nhật profile
     */
    updateProfile(profileId, name, data) {
        const profile = this.profiles.find(p => p.id === profileId);
        if (profile) {
            profile.name = name;
            profile.data = { ...profile.data, ...data };
            profile.updatedAt = Date.now();
            this.saveProfiles();
            return profile;
        }
        return null;
    }

    /**
     * Xóa profile
     */
    deleteProfile(profileId) {
        this.profiles = this.profiles.filter(p => p.id !== profileId);
        if (this.currentProfileId === profileId) {
            this.currentProfileId = this.profiles.length > 0 ? this.profiles[0].id : null;
        }
        this.saveProfiles();
    }

    /**
     * Chọn profile
     */
    selectProfile(profileId) {
        const profile = this.profiles.find(p => p.id === profileId);
        if (profile) {
            this.currentProfileId = profileId;
            profile.lastUsed = Date.now();
            profile.usageCount = (profile.usageCount || 0) + 1;
            this.saveProfiles();
            return profile;
        }
        return null;
    }

    /**
     * Lấy profile hiện tại
     */
    getCurrentProfile() {
        return this.profiles.find(p => p.id === this.currentProfileId);
    }

    /**
     * Lấy tất cả profiles
     */
    getAllProfiles() {
        return this.profiles.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
    }

    /**
     * Duplicate profile
     */
    duplicateProfile(profileId) {
        const original = this.profiles.find(p => p.id === profileId);
        if (original) {
            return this.createProfile(
                `${original.name} (Copy)`,
                { ...original.data, tags: [...(original.tags || [])] }
            );
        }
        return null;
    }

    /**
     * Export profile thành JSON
     */
    exportProfile(profileId, format = 'json') {
        const profile = this.profiles.find(p => p.id === profileId);
        if (!profile) return null;

        if (format === 'json') {
            return JSON.stringify(profile, null, 2);
        } else if (format === 'csv') {
            const data = profile.data;
            return `username,password,fullName,phone,email,birthdate\n${data.username},${data.password},${data.fullName},${data.phone},${data.email},${data.birthdate}`;
        }
        return null;
    }

    /**
     * Import profile từ JSON
     */
    importProfile(jsonData) {
        try {
            const profile = JSON.parse(jsonData);
            if (profile.name && profile.data) {
                this.createProfile(profile.name, profile.data);
                return true;
            }
        } catch (error) {
            console.error('Import profile error:', error);
        }
        return false;
    }

    /**
     * Export tất cả profiles
     */
    exportAllProfiles(format = 'json') {
        if (format === 'json') {
            return JSON.stringify(this.profiles, null, 2);
        } else if (format === 'csv') {
            let csv = 'profileName,username,password,fullName,phone,email,birthdate,createdAt,usageCount\n';
            this.profiles.forEach(profile => {
                const d = profile.data;
                const date = new Date(profile.createdAt).toISOString();
                csv += `"${profile.name}",${d.username},${d.password},${d.fullName},${d.phone},${d.email},${d.birthdate},${date},${profile.usageCount}\n`;
            });
            return csv;
        }
        return null;
    }

    /**
     * Import tất cả profiles từ JSON
     */
    importAllProfiles(jsonData) {
        try {
            const profiles = JSON.parse(jsonData);
            if (Array.isArray(profiles)) {
                profiles.forEach(profile => {
                    if (profile.name && profile.data) {
                        this.createProfile(profile.name, profile.data);
                    }
                });
                return true;
            }
        } catch (error) {
            console.error('Import all profiles error:', error);
        }
        return false;
    }

    /**
     * Lưu vào storage
     */
    saveProfiles() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({
                profiles: this.profiles,
                currentProfileId: this.currentProfileId
            });
        }
    }

    /**
     * Load từ storage
     */
    loadProfiles() {
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.get(['profiles', 'currentProfileId'], (result) => {
                if (result.profiles) {
                    this.profiles = result.profiles;
                    this.currentProfileId = result.currentProfileId;
                }
            });
        }
    }

    /**
     * Tìm kiếm profiles
     */
    searchProfiles(query) {
        const q = query.toLowerCase();
        return this.profiles.filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.data.username.toLowerCase().includes(q) ||
            p.data.email.toLowerCase().includes(q)
        );
    }
}
