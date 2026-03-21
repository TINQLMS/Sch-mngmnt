// Enhanced Authentication System
// This file provides comprehensive authentication and security features

// Security validation constants
const SECURITY_INDICATORS = {
    WEAK_PASSWORDS: ['password', '123456', 'admin', 'test', 'demo', 'user']
};

// Helper to migrate session data to IndexedDB if needed
async function syncSessionToDB() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    if(currentUser && window.db) {
        await window.db.put(window.DB_STORES.USERS, currentUser);
    }
}

// Enhanced authentication check with security validation
async function checkAuth(requiredRole = null, requiredAccessLevel = null) {
    console.log('Enhanced checkAuth called with:', { requiredRole, requiredAccessLevel });
    
    // Check if user is authenticated
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    const loginCredentials = JSON.parse(sessionStorage.getItem('loginCredentials') || 'null');
    
    if(!currentUser || !loginCredentials) {
        console.log('No user session found');
        showNotification('Session expired. Please login again.', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return false;
    }
    
    // Check for suspended/locked accounts
    if (currentUser.status === 'suspended' || currentUser.accountLocked) {
        console.log('Account is suspended or locked');
        showNotification('Your account has been suspended. Please contact administrator.', 'error');
        logout();
        return false;
    }
    
    // Check for temporary lockout
    if (currentUser.lockedUntil && new Date(currentUser.lockedUntil) > new Date()) {
        console.log('Account is temporarily locked');
        showNotification('Account temporarily locked due to security concerns.', 'error');
        return false;
    }
    
    // Role-based access control with hierarchy
    if (requiredRole) {
        const userLevel = getAccessLevel(currentUser.role);
        const requiredLevel = getAccessLevel(requiredRole);

        if (userLevel < requiredLevel) {
            console.log('Insufficient role permissions: ' + currentUser.role + ' < ' + requiredRole);
            showNotification('Access denied. Insufficient permissions.', 'error');
            return false;
        }
    }
    
    // Access level validation
    if (requiredAccessLevel) {
        const userLevel = getAccessLevel(currentUser.role);
        const requiredLevel = getAccessLevel(requiredAccessLevel);
        
        if (userLevel < requiredLevel) {
            console.log('Insufficient access level');
            showNotification('Access denied. Insufficient access level.', 'error');
            return false;
        }
    }
    
    // Update last activity
    currentUser.lastActivity = new Date().toISOString();
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    console.log('Authentication successful for:', {
        username: currentUser.username,
        role: currentUser.role,
        accessLevel: currentUser.accessLevel
    });
    
    return true;
}

// Centralized Redirection Logic
async function redirectToDashboard(role) {
    console.log('Redirecting to dashboard for role:', role);

    let redirectUrl = 'index.html';
    const standardizedRole = role ? role.toLowerCase() : '';

    switch (standardizedRole) {
        case 'super-admin':
        case 'school-manager':
        case 'staff':
        case 'teacher':
            redirectUrl = 'Enhanced_School_Management_Portal.html';
            break;
        case 'student':
            redirectUrl = 'student_dashboard.html';
            break;
        case 'parent':
            redirectUrl = 'parent_dashboard.html';
            break;
        default:
            console.warn('Unknown role for redirection:', role);
            redirectUrl = 'index.html';
    }

    console.log('Final redirect URL:', redirectUrl);
    window.location.href = redirectUrl;
}

function goToDashboard() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    const loginCredentials = JSON.parse(sessionStorage.getItem('loginCredentials') || 'null');

    const userRole = (currentUser && currentUser.role) || (loginCredentials && loginCredentials.role);

    if (userRole) {
        redirectToDashboard(userRole);
    } else {
        window.location.href = 'index.html';
    }
}

// Enhanced logout function
async function logout() {
    console.log('Logout initiated');
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
    
    if (currentUser) {
        // Add audit log
        try {
            await addAuditLog('logout', `User ${currentUser.username} logged out`, currentUser);

            // Update last activity in unified storage
            if(window.db) {
                const user = await window.db.get(window.DB_STORES.USERS, currentUser.username);
                if (user) {
                    user.lastActivity = new Date().toISOString();
                    await window.db.put(window.DB_STORES.USERS, user);
                }
            }
        } catch (e) {
            console.error('Error during logout logging:', e);
        }
    }
    
    // Clear all session data
    sessionStorage.clear();
    
    // Redirect to login page
    window.location.href = 'index.html';
}

// Handle failed login attempts
async function handleFailedLogin(username) {
    const users = await window.db.getAll(window.DB_STORES.USERS);
    const user = users.find(u => u.username === username);
    
    if(user) {
        user.failedAttempts = (user.failedAttempts || 0) + 1;
        
        // Lock account after 5 failed attempts
        if (user.failedAttempts >= 5) {
            user.accountLocked = true;
            user.lockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes
            showNotification('Account locked due to multiple failed attempts. Try again in 30 minutes.', 'error');
        }
        
        // Update user data
        const userIndex = users.findIndex(u => u.username === username);
        if (userIndex !== -1) {
            users[userIndex] = user;
            await Promise.all(users.map(u => window.db.put(window.DB_STORES.USERS, u)));
        }
        
        // Add audit log
        addAuditLog('login_failed', `Failed login attempt for user ${username}`, user);
    }
}

// Enhanced audit logging with security monitoring
async function addAuditLog(event, details, user = null, additionalData = {}) {
    try {
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            event: event,
            details: details,
            user: user ? user.username : (currentUser ? currentUser.username : 'system'),
            ip: '127.0.0.1', // In real implementation, get actual IP
            sessionId: sessionStorage.getItem('sessionId') || 'unknown',
            userAgent: navigator.userAgent,
            accountType: user ? (user.accountType || 'unknown') : (currentUser ? (currentUser.accountType || 'unknown') : 'system'),
            securityLevel: user ? (user.securityLevel || 'standard') : (currentUser ? (currentUser.securityLevel || 'standard') : 'system'),
            accessLevel: user ? (user.accessLevel || 'unknown') : (currentUser ? (currentUser.accessLevel || 'unknown') : 'system'),
            ...additionalData
        };
        
        if(window.db) {
            await window.db.put(window.DB_STORES.AUDIT_LOGS, logEntry);
        } else {
            // Fallback to localStorage if DB not initialized
            const auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
            auditLogs.push(logEntry);
            if (auditLogs.length > 1000) auditLogs.shift();
            localStorage.setItem('auditLogs', JSON.stringify(auditLogs));
        }
        
        // Real-time security monitoring for critical events
        if (event.includes('login') || event.includes('security') || event.includes('account') || event.includes('access')) {
            await monitorSecurityEvents(logEntry);
        }
        
        // Update user activity tracking
        if(logEntry.user && logEntry.user !== 'system') {
            await updateUserActivity(logEntry.user, event);
        }
        
        console.log('Enhanced audit log added:', {
            event: logEntry.event,
            user: logEntry.user
        });
    } catch (error) {
        console.error('Error adding audit log:', error);
    }
}

// Real-time security monitoring system
async function monitorSecurityEvents(auditEntry) {
    if (!window.db) return;
    const allLogs = await window.db.getAll(window.DB_STORES.AUDIT_LOGS);
    const recentEvents = allLogs.filter(log => new Date(log.timestamp) > new Date(Date.now() - 300000)); // Last 5 minutes
    
    const failedLogins = recentEvents.filter(log => 
        log.event === 'login_failed' || log.event === 'account_locked'
    ).length;
    
    const suspiciousActivity = recentEvents.filter(log => 
        log.event === 'access_denied' || log.event === 'permission_violation'
    ).length;
    
    if (failedLogins > 10) {
        console.warn('⚠️ High number of failed login attempts detected');
        addAuditLog('security_alert', 'Multiple failed login attempts detected', null, {
            alertType: 'failed_logins',
            count: failedLogins,
            severity: 'high'
        });
    }
    
    if (suspiciousActivity > 5) {
        console.warn('⚠️ Suspicious activity detected');
        addAuditLog('security_alert', 'Suspicious activity pattern detected', null, {
            alertType: 'suspicious_activity',
            count: suspiciousActivity,
            severity: 'medium'
        });
    }
}

// Enhanced user activity tracking
async function updateUserActivity(username, event) {
    try {
        const userActivity = JSON.parse(localStorage.getItem('userActivity') || '{}');
        
        if (!userActivity[username]) {
            userActivity[username] = {
                lastActivity: new Date().toISOString(),
                activityCount: 0,
                events: [],
                sessionCount: 0
            };
        }
        
        userActivity[username].lastActivity = new Date().toISOString();
        userActivity[username].activityCount++;
        userActivity[username].events.push({
            timestamp: new Date().toISOString(),
            event: event
        });
        
        // Keep only last 100 events
        if (userActivity[username].events.length > 100) {
            userActivity[username].events = userActivity[username].events.slice(-100);
        }
        
        localStorage.setItem('userActivity', JSON.stringify(userActivity));
    } catch (error) {
        console.error('Error updating user activity:', error);
    }
}

// Access level management
function getAccessLevel(role) {
    const accessLevels = {
        'super-admin': 4,
        'school-manager': 3,
        'staff': 2,
        'teacher': 2,
        'student': 1,
        'parent': 1
    };
    
    return accessLevels[role] || 1;
}

// Account creation validation
function validateRealAccountCreation(userData) {
    const errors = [];
    
    // Validate real name
    if (userData.fullName) {
        const fullNameLower = userData.fullName.toLowerCase();
        if (SECURITY_INDICATORS.WEAK_PASSWORDS.some(name => fullNameLower.includes(name))) {
            errors.push('Please use a real person\'s name');
        }
    }
    
    // Validate real email
    if (userData.email) {
        const emailLower = userData.email.toLowerCase();
        if (SECURITY_INDICATORS.WEAK_PASSWORDS.some(email => emailLower.includes(email))) {
            errors.push('Please use a real email address');
        }
    }
    
    // Validate real username
    if (userData.username) {
        const usernameLower = userData.username.toLowerCase();
        if (SECURITY_INDICATORS.WEAK_PASSWORDS.some(name => usernameLower === name)) {
            errors.push('Please use a real username');
        }
    }
    
    // Validate password strength
    if (userData.password) {
        if (userData.password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        
        if (!/[A-Z]/.test(userData.password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        
        if (!/[a-z]/.test(userData.password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        
        if (!/[0-9]/.test(userData.password)) {
            errors.push('Password must contain at least one number');
        }
        
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(userData.password)) {
            errors.push('Password must contain at least one special character');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Enhanced notification system
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add styles if not already present
    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                animation: slideIn 0.3s ease-out;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px 20px;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                color: white;
            }
            
            .notification-success {
                background: #28a745;
            }
            
            .notification-error {
                background: #dc3545;
            }
            
            .notification-warning {
                background: #ffc107;
                color: #212529;
            }
            
            .notification-info {
                background: #17a2b8;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: inherit;
                font-size: 18px;
                cursor: pointer;
                margin-left: 10px;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Export functions for use in other files
window.checkAuth = checkAuth;
window.logout = logout;
window.redirectToDashboard = redirectToDashboard;
window.goToDashboard = goToDashboard;
window.addAuditLog = addAuditLog;
window.validateRealAccountCreation = validateRealAccountCreation;
window.showNotification = showNotification; 