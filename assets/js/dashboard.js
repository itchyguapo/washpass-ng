// Dashboard specific JavaScript

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
document.getElementById('qrModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeQRScanner();
    }
});

// Navigation active state
document.querySelectorAll('.dashboard-nav .nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.dashboard-nav .nav-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
    });
});

// Animate stats on page load
function animateValue(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        
        if (element.textContent.includes('∞')) {
            element.textContent = '∞';
        } else if (element.textContent.includes('L')) {
            element.textContent = Math.floor(current).toLocaleString() + 'L';
        } else if (element.textContent.includes('pts')) {
            element.textContent = Math.floor(current) + ' pts';
        } else if (element.textContent.includes('h')) {
            element.textContent = current.toFixed(1) + 'h';
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

// Trigger animations when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Animate subscription stats
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                entry.target.classList.add('animated');
                
                const statNumbers = entry.target.querySelectorAll('.stat-number');
                statNumbers.forEach(stat => {
                    const text = stat.textContent;
                    if (text.includes('12')) {
                        animateValue(stat, 0, 12, 1000);
                    } else if (text.includes('8')) {
                        animateValue(stat, 0, 8, 1000);
                    } else if (text.includes('2,450')) {
                        animateValue(stat, 0, 2450, 1500);
                    } else if (text.includes('850')) {
                        animateValue(stat, 0, 850, 1500);
                    } else if (text.includes('4.5')) {
                        animateValue(stat, 0, 4.5, 1500);
                    }
                });
            }
        });
    }, { threshold: 0.5 });
    
    // Observe stats cards
    document.querySelectorAll('.stats-grid .stat-card').forEach(card => {
        observer.observe(card);
    });
    
    // Observe subscription card
    const subscriptionCard = document.querySelector('.subscription-card');
    if (subscriptionCard) {
        observer.observe(subscriptionCard);
    }
});

// Location navigation
document.querySelectorAll('.location-item button').forEach(button => {
    button.addEventListener('click', function() {
        const locationName = this.closest('.location-item').querySelector('h4').textContent;
        
        // Simulate navigation action
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Opening Maps...';
        this.disabled = true;
        
        setTimeout(() => {
            this.innerHTML = 'Navigate';
            this.disabled = false;
            
            // Show success message
            showNotification(`Opening navigation to ${locationName}`, 'success');
        }, 1500);
    });
});

// Add vehicle functionality
document.querySelectorAll('.btn-outline').forEach(button => {
    if (button.textContent.includes('Add Vehicle')) {
        button.addEventListener('click', function() {
            showNotification('Vehicle addition feature coming soon!', 'info');
        });
    }
});

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
    
    // Add notification styles if not already present
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 0.75rem;
                padding: 1rem 1.5rem;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
                display: flex;
                align-items: center;
                gap: 1rem;
                z-index: 2000;
                min-width: 300px;
                border-left: 4px solid var(--primary-color);
                animation: slideIn 0.3s ease-out;
            }
            
            .notification.success {
                border-left-color: var(--secondary-color);
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                flex: 1;
            }
            
            .notification i {
                color: var(--primary-color);
            }
            
            .notification.success i {
                color: var(--secondary-color);
            }
            
            .notification-close {
                background: none;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                padding: 0.25rem;
                border-radius: 0.25rem;
                transition: all 0.3s ease;
            }
            
            .notification-close:hover {
                background: var(--bg-tertiary);
                color: var(--text-primary);
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Manual close
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    });
}

// Simulate real-time updates
function simulateRealTimeUpdates() {
    // Update nearby locations occasionally
    setInterval(() => {
        const nearbyStat = document.querySelector('.stat-card:first-child .stat-number');
        if (nearbyStat && Math.random() > 0.8) {
            const currentCount = parseInt(nearbyStat.textContent);
            const newCount = Math.max(5, Math.min(12, currentCount + (Math.random() > 0.5 ? 1 : -1)));
            nearbyStat.textContent = newCount;
        }
    }, 30000);
    
    // Update loyalty points occasionally
    setInterval(() => {
        const pointsStat = document.querySelector('.stat-card:nth-child(3) .stat-number');
        if (pointsStat && Math.random() > 0.9) {
            const currentPoints = parseInt(pointsStat.textContent);
            const newPoints = currentPoints + Math.floor(Math.random() * 20) + 5;
            pointsStat.textContent = newPoints;
            
            showNotification(`+${newPoints - currentPoints} loyalty points earned!`, 'success');
        }
    }, 45000);
}

// Initialize real-time updates
simulateRealTimeUpdates();

// Mobile menu toggle (if needed)
const mobileMenuToggle = document.querySelector('.nav-toggle');
if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', function() {
        const navMenu = document.querySelector('.dashboard-nav .nav-menu');
        navMenu.classList.toggle('mobile-active');
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add hover effects to cards
document.querySelectorAll('.stat-card, .vehicle-card, .activity-item, .location-item').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// Simulate QR code scan success
function simulateQRScan() {
    const qrPlaceholder = document.querySelector('.qr-placeholder');
    if (qrPlaceholder) {
        setTimeout(() => {
            qrPlaceholder.innerHTML = `
                <i class="fas fa-check-circle" style="color: var(--secondary-color); font-size: 3rem;"></i>
                <p style="color: var(--secondary-color); font-weight: 600;">QR Code Scanned Successfully!</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">Show this screen to the attendant</p>
            `;
            
            setTimeout(() => {
                closeQRScanner();
                showNotification('Wash session started! Enjoy your service.', 'success');
            }, 2000);
        }, 3000);
    }
}

// Trigger QR scan simulation when modal opens
document.querySelector('.btn-primary').addEventListener('click', function() {
    if (this.textContent.includes('Scan to Wash')) {
        setTimeout(simulateQRScan, 1000);
    }
});

console.log('WashPass NG Dashboard - User Interface Loaded');
