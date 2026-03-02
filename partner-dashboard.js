// Partner Dashboard specific JavaScript

// Partner status toggle
function toggleStatus() {
    const statusBtn = document.querySelector('.btn-success');
    const statusIndicator = document.querySelector('.status-item.online');
    
    if (statusBtn.textContent.includes('Go Offline')) {
        statusBtn.innerHTML = '<i class="fas fa-power-off"></i> Go Online';
        statusBtn.classList.remove('btn-success');
        statusBtn.classList.add('btn-secondary');
        
        statusIndicator.innerHTML = '<i class="fas fa-circle"></i><span>Offline</span>';
        statusIndicator.classList.remove('online');
        statusIndicator.querySelector('i').style.color = 'var(--text-secondary)';
        
        showNotification('Your location is now offline', 'info');
    } else {
        statusBtn.innerHTML = '<i class="fas fa-power-off"></i> Go Offline';
        statusBtn.classList.remove('btn-secondary');
        statusBtn.classList.add('btn-success');
        
        statusIndicator.innerHTML = '<i class="fas fa-circle"></i><span>Online</span>';
        statusIndicator.classList.add('online');
        statusIndicator.querySelector('i').style.color = '#10b981';
        
        showNotification('Your location is now online and accepting customers', 'success');
    }
}

// QR Scanner for partners
function showPartnerQR() {
    const modal = document.getElementById('partnerQRModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Start scanner animation
    setTimeout(() => {
        const scannerLine = document.querySelector('#partnerQRModal .scanner-line');
        if (scannerLine) {
            scannerLine.style.animation = 'scan 2s linear infinite';
        }
    }, 100);
}

function closePartnerQR() {
    const modal = document.getElementById('partnerQRModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
document.getElementById('partnerQRModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closePartnerQR();
    }
});

// QR Scanner button
document.querySelectorAll('.btn-primary').forEach(button => {
    if (button.textContent.includes('Scan QR')) {
        button.addEventListener('click', showPartnerQR);
    }
});

// Manual QR code validation
document.querySelector('.input-group button')?.addEventListener('click', function() {
    const input = document.querySelector('.form-input');
    const code = input.value.trim();
    
    if (code && code.match(/^WP-\d{4}-\d{4}-\d{4}$/)) {
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validating...';
        this.disabled = true;
        
        setTimeout(() => {
            this.innerHTML = 'Validate';
            this.disabled = false;
            input.value = '';
            
            closePartnerQR();
            showNotification('Customer validated successfully! Added to queue.', 'success');
            
            // Add new customer to queue
            addCustomerToQueue();
        }, 2000);
    } else {
        showNotification('Invalid customer code format. Please check and try again.', 'error');
    }
});

// Add customer to queue dynamically
function addCustomerToQueue() {
    const queueList = document.querySelector('.queue-list');
    const newQueueItem = document.createElement('div');
    newQueueItem.className = 'queue-item';
    newQueueItem.style.opacity = '0';
    newQueueItem.innerHTML = `
        <div class="queue-number">#4</div>
        <div class="customer-info">
            <h4>New Customer</h4>
            <p>Vehicle • Service Type</p>
            <div class="time-info">
                <i class="fas fa-clock"></i>
                <span>Just added</span>
            </div>
        </div>
        <div class="queue-actions">
            <button class="btn btn-sm btn-outline" disabled>
                <i class="fas fa-hourglass-half"></i>
                Waiting
            </button>
        </div>
    `;
    
    queueList.appendChild(newQueueItem);
    
    // Animate in
    setTimeout(() => {
        newQueueItem.style.transition = 'opacity 0.5s ease';
        newQueueItem.style.opacity = '1';
    }, 100);
    
    updateQueueNumbers();
}

// Update queue numbers
function updateQueueNumbers() {
    const queueItems = document.querySelectorAll('.queue-item');
    queueItems.forEach((item, index) => {
        const queueNumber = item.querySelector('.queue-number');
        if (queueNumber) {
            queueNumber.textContent = `#${index + 1}`;
        }
    });
}

// Queue action handlers
document.querySelectorAll('.queue-actions button').forEach(button => {
    button.addEventListener('click', function() {
        const queueItem = this.closest('.queue-item');
        const customerName = queueItem.querySelector('h4').textContent;
        
        if (this.textContent.includes('Complete')) {
            completeWash(queueItem, customerName);
        } else if (this.textContent.includes('Start')) {
            startWash(queueItem, customerName);
        } else if (this.textContent.includes('Pause')) {
            pauseWash(queueItem, customerName);
        }
    });
});

function completeWash(queueItem, customerName) {
    const completeBtn = queueItem.querySelector('.btn-success');
    completeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Completing...';
    completeBtn.disabled = true;
    
    setTimeout(() => {
        // Move to recent washes
        moveToRecentWashes(customerName);
        
        // Remove from queue with animation
        queueItem.style.transition = 'all 0.5s ease';
        queueItem.style.transform = 'translateX(100%)';
        queueItem.style.opacity = '0';
        
        setTimeout(() => {
            queueItem.remove();
            updateQueueNumbers();
            updateEarnings();
        }, 500);
        
        showNotification(`Wash completed for ${customerName}`, 'success');
    }, 2000);
}

function startWash(queueItem, customerName) {
    // Remove active class from current active item
    document.querySelector('.queue-item.active')?.classList.remove('active');
    
    // Add active class to this item
    queueItem.classList.add('active');
    
    // Update button
    const startBtn = queueItem.querySelector('.btn-primary');
    startBtn.innerHTML = '<i class="fas fa-check"></i> Complete';
    startBtn.classList.remove('btn-primary');
    startBtn.classList.add('btn-success');
    
    // Add pause button
    const actionsDiv = queueItem.querySelector('.queue-actions');
    const pauseBtn = document.createElement('button');
    pauseBtn.className = 'btn btn-sm btn-outline';
    pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    pauseBtn.addEventListener('click', () => pauseWash(queueItem, customerName));
    actionsDiv.appendChild(pauseBtn);
    
    // Update time info
    const timeInfo = queueItem.querySelector('.time-info span');
    timeInfo.textContent = 'Started just now';
    
    showNotification(`Started wash for ${customerName}`, 'info');
}

function pauseWash(queueItem, customerName) {
    const pauseBtn = queueItem.querySelector('.btn-outline');
    const timeInfo = queueItem.querySelector('.time-info span');
    
    if (pauseBtn.textContent.includes('Pause')) {
        pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
        timeInfo.textContent = 'Paused';
        showNotification(`Wash paused for ${customerName}`, 'info');
    } else {
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
        timeInfo.textContent = 'Resumed';
        showNotification(`Wash resumed for ${customerName}`, 'info');
    }
}

function moveToRecentWashes(customerName) {
    const washesList = document.querySelector('.washes-list');
    const newWashItem = document.createElement('div');
    newWashItem.className = 'wash-item';
    newWashItem.style.opacity = '0';
    
    const serviceType = ['Premium Wash', 'Standard Wash', 'Basic Wash'][Math.floor(Math.random() * 3)];
    const vehicle = ['Toyota Camry', 'Honda CR-V', 'Mercedes C-Class', 'BMW 3 Series'][Math.floor(Math.random() * 4)];
    const amount = serviceType === 'Premium Wash' ? '₦4,200' : serviceType === 'Standard Wash' ? '₦2,500' : '₦1,800';
    const duration = serviceType === 'Premium Wash' ? '45 mins' : serviceType === 'Standard Wash' ? '25 mins' : '20 mins';
    
    newWashItem.innerHTML = `
        <div class="wash-icon completed">
            <i class="fas fa-check"></i>
        </div>
        <div class="wash-details">
            <h4>${serviceType}</h4>
            <p>${customerName} • ${vehicle}</p>
            <span class="wash-time">Just now</span>
        </div>
        <div class="wash-earnings">
            <span class="amount">${amount}</span>
            <span class="duration">${duration}</span>
        </div>
    `;
    
    washesList.insertBefore(newWashItem, washesList.firstChild);
    
    // Animate in
    setTimeout(() => {
        newWashItem.style.transition = 'opacity 0.5s ease';
        newWashItem.style.opacity = '1';
    }, 100);
    
    // Remove last item if list is too long
    if (washesList.children.length > 5) {
        washesList.removeChild(washesList.lastChild);
    }
}

function updateEarnings() {
    // Update today's earnings
    const earningsElement = document.querySelector('.stat-card.large .stat-number');
    if (earningsElement) {
        const currentEarnings = parseInt(earningsElement.textContent.replace(/[₦,]/g, ''));
        const newEarnings = currentEarnings + Math.floor(Math.random() * 3000) + 1500;
        earningsElement.textContent = `₦${newEarnings.toLocaleString()}`;
    }
    
    // Update customers served
    const customersElement = document.querySelectorAll('.stat-card.large .stat-number')[1];
    if (customersElement) {
        const currentCustomers = parseInt(customersElement.textContent);
        customersElement.textContent = currentCustomers + 1;
    }
}

// Period selector functionality
document.querySelectorAll('.period-btn').forEach(button => {
    button.addEventListener('click', function() {
        document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Update earnings data based on period
        updateEarningsData(this.textContent);
    });
});

function updateEarningsData(period) {
    const earningsData = {
        'Today': { gross: '₦45,750', net: '₦38,888', commission: '₦6,862' },
        'Week': { gross: '₦285,400', net: '₦242,590', commission: '₦42,810' },
        'Month': { gross: '₦1,245,800', net: '₦1,058,930', commission: '₦186,870' },
        'Year': { gross: '₦14,949,600', net: '₦12,707,160', commission: '₦2,242,440' }
    };
    
    const data = earningsData[period];
    if (data) {
        const amounts = document.querySelectorAll('.earnings-card .amount');
        if (amounts[0]) amounts[0].textContent = data.gross;
        if (amounts[1]) amounts[1].textContent = data.commission;
        if (amounts[2]) amounts[2].textContent = data.net;
    }
}

// Simulate real-time updates
function simulatePartnerUpdates() {
    // Update queue status
    setInterval(() => {
        const activeItem = document.querySelector('.queue-item.active');
        if (activeItem && Math.random() > 0.7) {
            const timeInfo = activeItem.querySelector('.time-info span');
            const currentTime = timeInfo.textContent;
            
            if (currentTime.includes('Started')) {
                const minutes = Math.floor(Math.random() * 20) + 5;
                timeInfo.textContent = `In progress - ${minutes} mins`;
            }
        }
    }, 30000);
    
    // Add new customers occasionally
    setInterval(() => {
        if (Math.random() > 0.8) {
            showNotification('New customer arrived!', 'info');
            // Could add to queue here
        }
    }, 60000);
}

// Initialize real-time updates
simulatePartnerUpdates();

// Manual add wash button
document.querySelector('.btn-outline')?.addEventListener('click', function() {
    if (this.textContent.includes('Add Manual')) {
        showNotification('Manual wash entry form would open here', 'info');
    }
});

// Export report functionality
document.querySelector('.btn-outline')?.addEventListener('click', function() {
    if (this.textContent.includes('Export Report')) {
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        this.disabled = true;
        
        setTimeout(() => {
            this.innerHTML = '<i class="fas fa-download"></i> Export Report';
            this.disabled = false;
            showNotification('Report generated successfully! Download will start shortly.', 'success');
        }, 2000);
    }
});

// Chart placeholders (would be replaced with actual chart library)
document.addEventListener('DOMContentLoaded', () => {
    const revenueChart = document.getElementById('revenueChart');
    const serviceChart = document.getElementById('serviceChart');
    
    if (revenueChart) {
        revenueChart.getContext('2d').fillText('Revenue Chart - Daily Trend', 150, 100);
        revenueChart.getContext('2d').fillText('₦45,750', 150, 120);
    }
    
    if (serviceChart) {
        serviceChart.getContext('2d').fillText('Service Distribution', 150, 80);
        serviceChart.getContext('2d').fillText('Premium: 60%', 150, 100);
        serviceChart.getContext('2d').fillText('Standard: 30%', 150, 120);
        serviceChart.getContext('2d').fillText('Basic: 10%', 150, 140);
    }
});

console.log('WashPass NG Partner Dashboard - Interface Loaded');
