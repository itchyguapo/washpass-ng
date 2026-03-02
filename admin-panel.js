// Admin Panel specific JavaScript

// Export report functionality
function exportReport() {
    const exportBtn = document.querySelector('.header-actions .btn-primary');
    exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    exportBtn.disabled = true;
    
    setTimeout(() => {
        exportBtn.innerHTML = '<i class="fas fa-download"></i> Export Report';
        exportBtn.disabled = false;
        showNotification('Report generated successfully! Download will start shortly.', 'success');
    }, 2000);
}

// Animate metrics on page load
function animateMetrics() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                entry.target.classList.add('animated');
                
                const metricNumbers = entry.target.querySelectorAll('.metric-number');
                metricNumbers.forEach(metric => {
                    const text = metric.textContent;
                    if (text.includes('52,847')) {
                        animateValue(metric, 0, 52847, 2000);
                    } else if (text.includes('234')) {
                        animateValue(metric, 0, 234, 1500);
                    } else if (text.includes('₦18.5M')) {
                        animateValue(metric, 0, 18.5, 2000, true);
                    } else if (text.includes('128,456')) {
                        animateValue(metric, 0, 128456, 2500);
                    }
                });
            }
        });
    }, { threshold: 0.5 });
    
    document.querySelectorAll('.metric-card').forEach(card => {
        observer.observe(card);
    });
}

// Value animation function
function animateValue(element, start, end, duration, isMillion = false) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        
        if (isMillion) {
            element.textContent = `₦${current.toFixed(1)}M`;
        } else if (element.textContent.includes('₦')) {
            element.textContent = `₦${Math.floor(current).toLocaleString()}`;
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

// Initialize chart placeholders
function initializeCharts() {
    // Revenue Trend Chart
    const revenueTrendChart = document.getElementById('revenueTrendChart');
    if (revenueTrendChart) {
        const ctx = revenueTrendChart.getContext('2d');
        
        // Simple line chart simulation
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        const points = [
            {x: 50, y: 250},
            {x: 150, y: 200},
            {x: 250, y: 180},
            {x: 350, y: 120},
            {x: 450, y: 100},
            {x: 550, y: 80},
            {x: 650, y: 60},
            {x: 750, y: 40}
        ];
        
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach(point => {
            ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
        
        // Add profit line
        ctx.strokeStyle = '#10b981';
        ctx.beginPath();
        const profitPoints = [
            {x: 50, y: 270},
            {x: 150, y: 240},
            {x: 250, y: 220},
            {x: 350, y: 180},
            {x: 450, y: 160},
            {x: 550, y: 140},
            {x: 650, y: 120},
            {x: 750, y: 100}
        ];
        
        ctx.moveTo(profitPoints[0].x, profitPoints[0].y);
        profitPoints.forEach(point => {
            ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
    }
    
    // User Distribution Chart (Pie Chart)
    const userDistributionChart = document.getElementById('userDistributionChart');
    if (userDistributionChart) {
        const ctx = userDistributionChart.getContext('2d');
        const centerX = 200;
        const centerY = 150;
        const radius = 80;
        
        // Premium users (45%)
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, -Math.PI/2, Math.PI/2);
        ctx.closePath();
        ctx.fill();
        
        // Standard users (35%)
        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, Math.PI/2, Math.PI * 1.8);
        ctx.closePath();
        ctx.fill();
        
        // Basic users (20%)
        ctx.fillStyle = '#6b7280';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, Math.PI * 1.8, -Math.PI/2);
        ctx.closePath();
        ctx.fill();
        
        // Add labels
        ctx.fillStyle = '#1f2937';
        ctx.font = '12px Inter';
        ctx.fillText('Premium: 45%', 10, 20);
        ctx.fillText('Standard: 35%', 10, 40);
        ctx.fillText('Basic: 20%', 10, 60);
    }
    
    // Service Popularity Chart (Bar Chart)
    const servicePopularityChart = document.getElementById('servicePopularityChart');
    if (servicePopularityChart) {
        const ctx = servicePopularityChart.getContext('2d');
        
        const services = [
            {name: 'Premium', value: 60, color: '#8b5cf6'},
            {name: 'Standard', value: 30, color: '#2563eb'},
            {name: 'Basic', value: 10, color: '#6b7280'}
        ];
        
        const barWidth = 80;
        const barSpacing = 40;
        const startX = 50;
        const startY = 250;
        const maxHeight = 150;
        
        services.forEach((service, index) => {
            const x = startX + (barWidth + barSpacing) * index;
            const height = (service.value / 100) * maxHeight;
            const y = startY - height;
            
            // Draw bar
            ctx.fillStyle = service.color;
            ctx.fillRect(x, y, barWidth, height);
            
            // Draw label
            ctx.fillStyle = '#1f2937';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(service.name, x + barWidth/2, startY + 20);
            ctx.fillText(service.value + '%', x + barWidth/2, y - 10);
        });
    }
    
    // Mini charts for metric cards
    const miniCharts = ['usersChart', 'partnersChart', 'revenueChart', 'washesChart'];
    miniCharts.forEach((chartId, index) => {
        const chart = document.getElementById(chartId);
        if (chart) {
            const ctx = chart.getContext('2d');
            ctx.strokeStyle = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'][index];
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            const points = [];
            for (let i = 0; i < 10; i++) {
                points.push({
                    x: i * 10,
                    y: 20 + Math.random() * 20
                });
            }
            
            ctx.moveTo(points[0].x, points[0].y);
            points.forEach(point => {
                ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
        }
    });
}

// System health monitoring
function updateSystemHealth() {
    const healthBars = document.querySelectorAll('.health-fill');
    
    setInterval(() => {
        healthBars.forEach(bar => {
            const currentWidth = parseInt(bar.style.width);
            const change = (Math.random() - 0.5) * 10;
            const newWidth = Math.max(60, Math.min(100, currentWidth + change));
            
            bar.style.width = newWidth + '%';
            
            // Update health text
            const healthText = bar.closest('.health-item').querySelector('.health-text');
            if (healthText) {
                healthText.textContent = newWidth.toFixed(0) + '% ' + 
                    (newWidth >= 90 ? 'Excellent' : newWidth >= 75 ? 'Good' : 'Warning');
            }
            
            // Update health fill color
            bar.classList.remove('good', 'warning', 'danger');
            if (newWidth >= 90) {
                bar.classList.add('good');
            } else if (newWidth >= 75) {
                bar.classList.add('warning');
            } else {
                bar.classList.add('danger');
            }
        });
    }, 5000);
}

// Refresh system status
document.querySelector('.system-actions .btn-outline')?.addEventListener('click', function() {
    if (this.textContent.includes('Refresh')) {
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        this.disabled = true;
        
        setTimeout(() => {
            this.innerHTML = '<i class="fas fa-sync"></i> Refresh Status';
            this.disabled = false;
            showNotification('System status refreshed successfully', 'success');
            
            // Update health bars with random values
            const healthBars = document.querySelectorAll('.health-fill');
            healthBars.forEach(bar => {
                const newWidth = 75 + Math.random() * 25;
                bar.style.width = newWidth + '%';
            });
        }, 1500);
    }
});

// Configure alerts
document.querySelectorAll('.system-actions .btn-outline')[1]?.addEventListener('click', function() {
    if (this.textContent.includes('Configure')) {
        showNotification('Alert configuration panel would open here', 'info');
    }
});

// User management actions
document.querySelectorAll('.btn-icon').forEach(button => {
    button.addEventListener('click', function() {
        const title = this.getAttribute('title');
        const userName = this.closest('tr').querySelector('.user-name').textContent;
        
        if (title === 'View') {
            showNotification(`Viewing user details for ${userName}`, 'info');
        } else if (title === 'Edit') {
            showNotification(`Editing user ${userName}`, 'info');
        } else if (title === 'Suspend') {
            if (confirm(`Are you sure you want to suspend ${userName}?`)) {
                const statusBadge = this.closest('tr').querySelector('.status-badge');
                statusBadge.textContent = 'Suspended';
                statusBadge.className = 'status-badge warning';
                showNotification(`User ${userName} has been suspended`, 'warning');
            }
        } else if (title === 'Activate') {
            const statusBadge = this.closest('tr').querySelector('.status-badge');
            statusBadge.textContent = 'Active';
            statusBadge.className = 'status-badge active';
            showNotification(`User ${userName} has been activated`, 'success');
        }
    });
});

// Search functionality
document.querySelector('.search-box .form-input')?.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('.data-table tbody tr');
    
    rows.forEach(row => {
        const userName = row.querySelector('.user-name').textContent.toLowerCase();
        const userEmail = row.querySelector('.user-email').textContent.toLowerCase();
        
        if (userName.includes(searchTerm) || userEmail.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});

// Add user functionality
document.querySelector('.table-actions .btn-primary')?.addEventListener('click', function() {
    if (this.textContent.includes('Add User')) {
        showNotification('Add user form would open here', 'info');
    }
});

// Pagination
document.querySelectorAll('.pagination-controls button').forEach(button => {
    button.addEventListener('click', function() {
        if (!this.disabled) {
            document.querySelectorAll('.pagination-controls button').forEach(btn => {
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-outline');
            });
            
            this.classList.remove('btn-outline');
            this.classList.add('btn-primary');
            
            showNotification(`Loading page ${this.textContent}...`, 'info');
        }
    });
});

// Date range selector
document.querySelector('.form-select')?.addEventListener('change', function() {
    const selectedRange = this.value;
    showNotification(`Updating analytics for ${selectedRange}`, 'info');
    
    // Simulate data update
    setTimeout(() => {
        initializeCharts();
        showNotification('Analytics updated successfully', 'success');
    }, 1000);
});

// Add new system activity
function addSystemActivity(type, title, description) {
    const activitiesList = document.querySelector('.activities-list');
    const newActivity = document.createElement('div');
    newActivity.className = `activity-item ${type}`;
    newActivity.style.opacity = '0';
    
    const iconClass = type === 'high' ? 'exclamation-triangle' : 
                     type === 'medium' ? 'info-circle' : 'check-circle';
    
    newActivity.innerHTML = `
        <div class="activity-icon">
            <i class="fas fa-${iconClass}"></i>
        </div>
        <div class="activity-details">
            <h4>${title}</h4>
            <p>${description}</p>
            <span class="activity-time">Just now</span>
        </div>
        <div class="activity-status">
            <span class="status-badge ${type === 'high' ? 'warning' : 'success'}">New</span>
        </div>
    `;
    
    activitiesList.insertBefore(newActivity, activitiesList.firstChild);
    
    // Animate in
    setTimeout(() => {
        newActivity.style.transition = 'opacity 0.5s ease';
        newActivity.style.opacity = '1';
    }, 100);
    
    // Remove last activity if list is too long
    if (activitiesList.children.length > 10) {
        activitiesList.removeChild(activitiesList.lastChild);
    }
}

// Simulate real-time system activities
function simulateSystemActivities() {
    const activities = [
        {
            type: 'low',
            title: 'Database Optimization',
            description: 'Routine maintenance completed successfully'
        },
        {
            type: 'medium',
            title: 'New Feature Deployment',
            description: 'Mobile app v2.1.0 rolled out to all users'
        },
        {
            type: 'high',
            title: 'Security Alert',
            description: 'Unusual login patterns detected - Investigation started'
        }
    ];
    
    setInterval(() => {
        if (Math.random() > 0.8) {
            const activity = activities[Math.floor(Math.random() * activities.length)];
            addSystemActivity(activity.type, activity.title, activity.description);
        }
    }, 30000);
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', () => {
    animateMetrics();
    initializeCharts();
    updateSystemHealth();
    simulateSystemActivities();
});

console.log('WashPass NG Admin Panel - Interface Loaded');
