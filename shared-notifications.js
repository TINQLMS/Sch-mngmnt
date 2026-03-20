// Shared Notification System for School Management System
// This file provides a unified notification system used across all modules

class NotificationSystem {
    constructor(moduleName = 'system') {
        this.notifications = [];
        this.notificationContainer = null;
        this.notificationBadge = null;
        this.moduleName = moduleName;
        this.init();
    }

    init() {
        this.createNotificationContainer();
        this.createNotificationBadge();
        this.loadNotifications();
        this.startAutoCleanup();
    }

    createNotificationContainer() {
        // Create notification container if it doesn't exist
        if (!document.getElementById('notificationContainer')) {
            const container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'notification-container';
            document.body.appendChild(container);
        }
        this.notificationContainer = document.getElementById('notificationContainer');
    }

    createNotificationBadge() {
        // Create notification badge if it doesn't exist
        if (!document.getElementById('notificationBadge')) {
            const badge = document.createElement('div');
            badge.id = 'notificationBadge';
            badge.className = 'notification-badge';
            badge.innerHTML = '0';
            badge.style.display = 'none';
            badge.onclick = () => this.showNotificationPanel();
            document.body.appendChild(badge);
        }
        this.notificationBadge = document.getElementById('notificationBadge');
    }

    addNotification(type, title, message, data = {}) {
        const notification = {
            id: Date.now() + Math.random(),
            type: type, // 'success', 'error', 'warning', 'info', 'system'
            title: title,
            message: message,
            data: data,
            timestamp: new Date().toISOString(),
            read: false,
            module: this.moduleName
        };

        this.notifications.unshift(notification);
        this.saveNotifications();
        this.updateBadge();
        this.showToast(notification);
        this.logEvent(notification);
    }

    showToast(notification) {
        const toast = document.createElement('div');
        toast.className = `notification-toast notification-${notification.type}`;
        toast.innerHTML = `
            <div class="toast-header">
                <span class="toast-icon">${this.getIcon(notification.type)}</span>
                <span class="toast-title">${notification.title}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="toast-message">${notification.message}</div>
            <div class="toast-time">${new Date(notification.timestamp).toLocaleTimeString()}</div>
        `;

        document.body.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    getIcon(type) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️',
            'system': '🔧'
        };
        return icons[type] || '📢';
    }

    updateBadge() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        if (this.notificationBadge) {
            this.notificationBadge.innerHTML = unreadCount;
            this.notificationBadge.style.display = unreadCount > 0 ? 'block' : 'none';
        }
    }

    showNotificationPanel() {
        const panel = document.createElement('div');
        panel.className = 'notification-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <h3>System Notifications</h3>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="panel-content">
                ${this.notifications.map(n => `
                    <div class="notification-item ${n.read ? 'read' : 'unread'}" onclick="notificationSystem.markAsRead('${n.id}')">
                        <div class="notification-icon">${this.getIcon(n.type)}</div>
                        <div class="notification-content">
                            <div class="notification-title">${n.title}</div>
                            <div class="notification-message">${n.message}</div>
                            <div class="notification-time">${new Date(n.timestamp).toLocaleString()}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="panel-footer">
                <button onclick="notificationSystem.clearAll()">Clear All</button>
                <button onclick="notificationSystem.markAllAsRead()">Mark All Read</button>
            </div>
        `;

        document.body.appendChild(panel);
    }

    markAsRead(id) {
        const notification = this.notifications.find(n => n.id == id);
        if (notification) {
            notification.read = true;
            this.saveNotifications();
            this.updateBadge();
        }
    }

    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.saveNotifications();
        this.updateBadge();
    }

    clearAll() {
        this.notifications = [];
        this.saveNotifications();
        this.updateBadge();
    }

    saveNotifications() {
        try {
            localStorage.setItem(`${this.moduleName}Notifications`, JSON.stringify(this.notifications));
        } catch (error) {
            console.error('Error saving notifications:', error);
        }
    }

    loadNotifications() {
        try {
            const saved = localStorage.getItem(`${this.moduleName}Notifications`);
            if (saved) {
                this.notifications = JSON.parse(saved);
                this.updateBadge();
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    }

    logEvent(notification) {
        // Log to console for debugging
        console.log(`[${notification.type.toUpperCase()}] ${notification.title}: ${notification.message}`, notification.data);
        
        // Save to audit log
        this.saveToAuditLog(notification);
    }

    saveToAuditLog(notification) {
        try {
            const auditLog = JSON.parse(localStorage.getItem('auditLogs') || '[]');
            auditLog.push({
                id: Date.now(),
                type: 'notification',
                action: notification.title,
                details: notification.message,
                data: notification.data,
                timestamp: notification.timestamp,
                module: this.moduleName,
                user: JSON.parse(sessionStorage.getItem('currentUser') || 'null')
            });
            localStorage.setItem('auditLogs', JSON.stringify(auditLog));
        } catch (error) {
            console.error('Error saving to audit log:', error);
        }
    }

    startAutoCleanup() {
        // Clean up old notifications (older than 30 days)
        setInterval(() => {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            this.notifications = this.notifications.filter(n => 
                new Date(n.timestamp) > thirtyDaysAgo
            );
            this.saveNotifications();
            this.updateBadge();
        }, 24 * 60 * 60 * 1000); // Run daily
    }
}

// Global notification system instance
let globalNotificationSystem = null;

// Initialize global notification system
function initializeNotificationSystem(moduleName = 'system') {
    if (!globalNotificationSystem) {
        globalNotificationSystem = new NotificationSystem(moduleName);
    }
    return globalNotificationSystem;
}

// Convenience functions for backward compatibility
function showNotification(message, type = 'info') {
    if (!globalNotificationSystem) {
        initializeNotificationSystem();
    }
    globalNotificationSystem.addNotification(type, 'System', message);
}

function addNotification(type, title, message, data = {}) {
    if (!globalNotificationSystem) {
        initializeNotificationSystem();
    }
    globalNotificationSystem.addNotification(type, title, message, data);
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NotificationSystem, initializeNotificationSystem, showNotification, addNotification };
} 