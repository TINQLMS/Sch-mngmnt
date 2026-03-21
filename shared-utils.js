// Shared Utilities for School Management System
// This file provides common utility functions used across all modules

// Time and Date Utilities
function getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
}

function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
}

function formatDateTime(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
}

function formatTime(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString();
}

// String Utilities
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function truncateText(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function sanitizeInput(input) {
    if (!input) return '';
    return input.replace(/[<>]/g, '');
}

// Number Utilities
function formatCurrency(amount, currency = '₵') {
    if (isNaN(amount)) return `${currency}0.00`;
    return `${currency}${parseFloat(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

function formatPercentage(value, total) {
    if (!total || total === 0) return '0%';
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(1)}%`;
}

function roundToDecimal(number, decimals = 2) {
    return Math.round(number * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// Array and Object Utilities
function groupBy(array, key) {
    return array.reduce((groups, item) => {
        const group = item[key];
        if (!groups[group]) groups[group] = [];
        groups[group].push(item);
        return groups;
    }, {});
}

function sortBy(array, key, order = 'asc') {
    return [...array].sort((a, b) => {
        let aVal = a[key];
        let bVal = b[key];

        // Handle numeric values
        if (!isNaN(aVal) && !isNaN(bVal)) {
            aVal = parseFloat(aVal);
            bVal = parseFloat(bVal);
        }

        if (order === 'desc') {
            return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    });
}

function filterBy(array, filters) {
    return array.filter(item => {
        return Object.keys(filters).every(key => {
            const filterValue = filters[key];
            const itemValue = item[key];

            if (!filterValue) return true;

            if (typeof filterValue === 'string') {
                return itemValue && itemValue.toLowerCase().includes(filterValue.toLowerCase());
            }

            return itemValue === filterValue;
        });
    });
}

// Validation Utilities
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

function validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

function validateRequired(value) {
    return value && value.toString().trim().length > 0;
}

// Migration and Sync Utilities
async function migrateToIndexedDB() {
    if (!window.db) return false;

    try {
        const migrationKey = 'indexeddb_migration_complete';
        if (localStorage.getItem(migrationKey)) return false;

        console.log('Starting migration from localStorage to IndexedDB...');

        const storesMap = {
            'users': window.DB_STORES.USERS,
            'admissions': window.DB_STORES.ADMISSIONS,
            'staff': window.DB_STORES.STAFF,
            'attendance': window.DB_STORES.ATTENDANCE,
            'assessments': window.DB_STORES.ASSESSMENTS,
            'financialData': window.DB_STORES.FINANCIAL,
            'auditLogs': window.DB_STORES.AUDIT_LOGS,
            'notifications': window.DB_STORES.NOTIFICATIONS,
            'messages': window.DB_STORES.MESSAGES
        };

        for (const [lsKey, storeName] of Object.entries(storesMap)) {
            const data = JSON.parse(localStorage.getItem(lsKey) || '[]');
            if (Array.isArray(data)) {
                for (const item of data) {
                    await window.db.put(storeName, item);
                }
            } else if (data && typeof data === 'object') {
                await window.db.put(storeName, data);
            }
        }

        // Handle legacy systemUsers
        const systemUsers = JSON.parse(localStorage.getItem('systemUsers') || '[]');
        for (const user of systemUsers) {
            await window.db.put(window.DB_STORES.USERS, {
                ...user,
                id: user.id || Date.now() + Math.random(),
                status: user.status || 'active'
            });
        }

        localStorage.setItem(migrationKey, 'true');
        console.log('Migration to IndexedDB completed successfully.');
        return true;
    } catch (error) {
        console.error('Error during IndexedDB migration:', error);
        return false;
    }
}

async function syncEntityToUser(entityData, role) {
    try {
        if (!window.db) return null;

        const allUsers = await window.db.getAll(window.DB_STORES.USERS);
        const nameField = entityData.fullName || entityData.studentName || entityData.name;
        const username = entityData.username || (nameField ? nameField.replace(/\s+/g, '').toLowerCase() : null);

        if (!username) return null;

        let userIndex = allUsers.findIndex(u => u.username && u.username.toLowerCase() === username.toLowerCase());

        let userData;
        if (userIndex !== -1) {
            userData = {
                ...allUsers[userIndex],
                ...entityData,
                role: role, // Ensure role is updated/set
                lastActivity: new Date().toISOString()
            };
        } else {
            userData = {
                id: entityData.id || Date.now() + Math.random(),
                username: username,
                fullName: entityData.fullName || entityData.studentName || entityData.name,
                email: entityData.email || '',
                role: role,
                status: entityData.status || 'active',
                password: entityData.password || btoa('0000'), // Default password if not provided
                lastActivity: new Date().toISOString(),
                ...entityData
            };
        }

        await window.db.put(window.DB_STORES.USERS, userData);
        return userData;
    } catch (error) {
        console.error('Error syncing entity to user:', error);
        return null;
    }
}

// Storage Utilities (Keep for small settings, but mostly replaced by IndexedDB)
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

function loadFromStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return defaultValue;
    }
}

function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.error('Error removing from localStorage:', error);
        return false;
    }
}

function clearStorage() {
    try {
        localStorage.clear();
        return true;
    } catch (error) {
        console.error('Error clearing localStorage:', error);
        return false;
    }
}

// DOM Utilities
function createElement(tag, className, innerHTML = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (innerHTML) element.innerHTML = innerHTML;
    return element;
}

function addClass(element, className) {
    if (element && element.classList) {
        element.classList.add(className);
    }
}

function removeClass(element, className) {
    if (element && element.classList) {
        element.classList.remove(className);
    }
}

function toggleClass(element, className) {
    if (element && element.classList) {
        element.classList.toggle(className);
    }
}

function showElement(element) {
    if (element) {
        element.style.display = '';
        removeClass(element, 'hidden');
    }
}

function hideElement(element) {
    if (element) {
        element.style.display = 'none';
        addClass(element, 'hidden');
    }
}

// Event Utilities
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Export utilities for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getTimeAgo, formatDate, formatDateTime, formatTime,
        capitalizeFirst, truncateText, sanitizeInput,
        formatCurrency, formatPercentage, roundToDecimal,
        groupBy, sortBy, filterBy,
        validateEmail, validatePhone, validatePassword, validateRequired,
        migrateToIndexedDB, syncEntityToUser,
        saveToStorage, loadFromStorage, removeFromStorage, clearStorage,
        createElement, addClass, removeClass, toggleClass, showElement, hideElement,
        debounce, throttle
    };
}
