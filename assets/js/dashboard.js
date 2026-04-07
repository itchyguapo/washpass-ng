// Dashboard specific JavaScript

// Auth & Personalization
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    Auth.checkAuth();
    
    // Initialize Dashboard UI
    const user = Auth.getUser();
    if (user) {
        // Update Name
        const nameElements = document.querySelectorAll('.user-name');
        nameElements.forEach(el => el.textContent = user.name || 'Adebayo');

        // Update Plan Status
        updatePlanUI(user);
    }
});

function updatePlanUI(user) {
    const planNameEl = document.getElementById('plan-name');
    const statusBadge = document.getElementById('plan-status');
    const washCountEl = document.querySelector('.wash-count .count, .usage-stats .stat-number');
    
    if (user.activePlan) {
        planNameEl.textContent = user.activePlan.charAt(0).toUpperCase() + user.activePlan.slice(1) + " Plan";
        statusBadge.textContent = "Active";
        statusBadge.className = "status-badge active";
        
        if (user.activePlan === 'premium') {
            document.querySelectorAll('.stat-number')[1].textContent = "∞";
        } else {
            // Update credits for basic/standard
            const credits = user.washCredits;
            const creditsElements = document.querySelectorAll('.stat-number');
            if (creditsElements[1]) creditsElements[1].textContent = credits;
        }
    } else {
        // No Active Plan
        planNameEl.textContent = "No Active Subscription";
        statusBadge.textContent = "Inactive";
        statusBadge.className = "status-badge inactive";
        
        // Show "Buy One-Time Wash" or "Explore Plans"
        const creditsElements = document.querySelectorAll('.stat-number');
        if (creditsElements[1]) creditsElements[1].textContent = user.washCredits || 0;
    }
}

// Logout Functionality
function handleLogout() {
    Auth.logout();
}

// Attach logout to button
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.querySelector('.btn-sm[onclick*="Logout"], .nav-menu button');
    if (logoutBtn) {
        logoutBtn.onclick = handleLogout;
    }
});

// Buy One-Time Wash
function handleBuyOneTimeWash() {
    showNotification('Processing simulated payment...', 'info');
    
    setTimeout(() => {
        Auth.buyOneTimeWash();
        const user = Auth.getUser();
        updatePlanUI(user);
        showNotification('1 Wash Credit added to your account! ₦2,500 charged.', 'success');
    }, 2000);
}

// Attach "Add Vehicle" or other buttons to One-Time Wash for demo
document.addEventListener('DOMContentLoaded', () => {
    const buyButtons = document.querySelectorAll('.quick-actions .btn-outline');
    buyButtons.forEach(btn => {
        if (btn.textContent.includes('Add Vehicle')) {
            btn.innerHTML = '<i class="fas fa-shopping-cart"></i> Buy One-Time Wash';
            btn.onclick = (e) => {
                e.preventDefault();
                handleBuyOneTimeWash();
            };
        }
    });

    // Check for temp plan from index.html registration
    const tempPlan = localStorage.getItem('temp_selected_plan');
    if (tempPlan) {
        Auth.subscribe(tempPlan);
        localStorage.removeItem('temp_selected_plan');
        updatePlanUI(Auth.getUser());
        showNotification(`Welcome! Your ${tempPlan} subscription is active.`, 'success');
    }
});

// QR Scanner Modal Functions
function showQRScanner() {
    const modal = document.getElementById('qrModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Simulate QR code scanning animation
    setTimeout(() => {
        const scannerLine = document.querySelector('.scanner-line');
        if (scannerLine) {
            scannerLine.style.animation = 'scan 2s linear infinite';
        }
    }, 100);
}

function closeQRScanner() {
    const modal = document.getElementById('qrModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
if (document.getElementById('qrModal')) {
    document.getElementById('qrModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeQRScanner();
        }
    });
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed; top: 20px; right: 20px; background: white;
                border-radius: 0.75rem; padding: 1rem 1.5rem;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                display: flex; align-items: center; gap: 1rem; z-index: 2000;
                min-width: 300px; border-left: 4px solid #2563eb;
                animation: slideIn 0.3s ease-out;
            }
            .notification.success { border-left-color: #10b981; }
            .notification-content { display: flex; align-items: center; gap: 0.75rem; flex: 1; }
            .notification i { color: #2563eb; }
            .notification.success i { color: #10b981; }
            .notification-close { background: none; border: none; color: #6b7280; cursor: pointer; }
            @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
            @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    });
}

// Static UI enhancements
document.querySelectorAll('.stat-card, .vehicle-card, .activity-item, .location-item').forEach(card => {
    card.addEventListener('mouseenter', function() { this.style.transform = 'translateY(-2px)'; });
    card.addEventListener('mouseleave', function() { this.style.transform = 'translateY(0)'; });
});

console.log('WashPass NG Dashboard - User Interface Loaded');
