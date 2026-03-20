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

// Storage Utilities
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
        // Time utilities
        getTimeAgo,
        formatDate,
        formatDateTime,
        formatTime,
        
        // String utilities
        capitalizeFirst,
        truncateText,
        sanitizeInput,
        
        // Number utilities
        formatCurrency,
        formatPercentage,
        roundToDecimal,
        
        // Array utilities
        groupBy,
        sortBy,
        filterBy,
        
        // Validation utilities
        validateEmail,
        validatePhone,
        validatePassword,
        validateRequired,
        
        // Storage utilities
        saveToStorage,
        loadFromStorage,
        removeFromStorage,
        clearStorage,
        
        // DOM utilities
        createElement,
        addClass,
        removeClass,
        toggleClass,
        showElement,
        hideElement,
        
        // Event utilities
        debounce,
        throttle
    };
}
