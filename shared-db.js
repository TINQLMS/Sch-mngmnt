/**
 * Shared Database Layer for School Management System
 * Provides a unified Promise-based API for IndexedDB operations.
 * Designed to be modular and easily replaceable with other backends (e.g., Supabase).
 */

const DB_NAME = 'SchoolManagementDB';
const DB_VERSION = 2;

const STORES = {
    USERS: 'users',
    ADMISSIONS: 'admissions',
    STAFF: 'staff',
    ATTENDANCE: 'attendance',
    ASSESSMENTS: 'assessments',
    FINANCIAL: 'financialData',
    AUDIT_LOGS: 'auditLogs',
    NOTIFICATIONS: 'notifications',
    MESSAGES: 'messages',
    PERFORMANCES: 'performances',
    SCHEDULES: 'schedules',
    OFFERS: 'offers',
    SETTINGS: 'settings',
    REPORTS: 'reports'
};

class SchoolDB {
    constructor() {
        this.db = null;
    }

    async init() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error('IndexedDB error:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores
                if (!db.objectStoreNames.contains(STORES.USERS)) {
                    db.createObjectStore(STORES.USERS, { keyPath: 'username' });
                }
                if (!db.objectStoreNames.contains(STORES.ADMISSIONS)) {
                    db.createObjectStore(STORES.ADMISSIONS, { keyPath: 'admissionNo' });
                }
                if (!db.objectStoreNames.contains(STORES.STAFF)) {
                    db.createObjectStore(STORES.STAFF, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORES.ATTENDANCE)) {
                    db.createObjectStore(STORES.ATTENDANCE, { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains(STORES.ASSESSMENTS)) {
                    db.createObjectStore(STORES.ASSESSMENTS, { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains(STORES.FINANCIAL)) {
                    db.createObjectStore(STORES.FINANCIAL, { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains(STORES.AUDIT_LOGS)) {
                    db.createObjectStore(STORES.AUDIT_LOGS, { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains(STORES.NOTIFICATIONS)) {
                    db.createObjectStore(STORES.NOTIFICATIONS, { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
                    db.createObjectStore(STORES.MESSAGES, { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains(STORES.PERFORMANCES)) {
                    db.createObjectStore(STORES.PERFORMANCES, { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains(STORES.SCHEDULES)) {
                    db.createObjectStore(STORES.SCHEDULES, { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains(STORES.OFFERS)) {
                    db.createObjectStore(STORES.OFFERS, { keyPath: 'id', autoIncrement: true });
                }
                if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                    db.createObjectStore(STORES.SETTINGS, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORES.REPORTS)) {
                    db.createObjectStore(STORES.REPORTS, { keyPath: 'id' });
                }
            };
        });
    }

    async getTransaction(storeNames, mode = 'readonly') {
        const db = await this.init();
        return db.transaction(storeNames, mode);
    }

    async get(storeName, key) {
        const tx = await this.getTransaction(storeName);
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        const tx = await this.getTransaction(storeName);
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async put(storeName, data) {
        const tx = await this.getTransaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.put(data);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, key) {
        const tx = await this.getTransaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.delete(key);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clear(storeName) {
        const tx = await this.getTransaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async query(storeName, filterFn) {
        const all = await this.getAll(storeName);
        return all.filter(filterFn);
    }
}

// Global database instance
const db = new SchoolDB();
window.db = db;
window.DB_STORES = STORES;
