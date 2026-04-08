/**
 * Dashboard Logic for WashPass NG
 * Handles dynamic content rendering and 2026 car-themed interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    Auth.checkAuth();
    
    // Initial UI Update
    const user = Auth.getUser();
    updateDashboardUI(user);
    
    // Handle "Add Vehicle" button from navigation/welcome
    const addVehicleButtons = document.querySelectorAll('[onclick*="Add Vehicle"], .btn-outline i.fa-plus').forEach(btn => {
        const parent = btn.tagName === 'I' ? btn.parentElement : btn;
        parent.onclick = (e) => {
            e.preventDefault();
            showAddVehicleModal();
        };
    });
});

// Main UI Update Function
function updateDashboardUI(user) {
    if (!user) return;
    
    // Welcome Name
    const nameEl = document.querySelector('.user-name');
    if (nameEl) nameEl.textContent = user.name || 'Adebayo';
    
    // Subscription Plan
    updatePlanUI(user);
    
    // Vehicles
    renderVehicles(user.vehicles || []);
    
    // History
    renderHistory(user.history || []);
    
    // Stats
    updateStats(user);
}

// Plan & Credits UI
function updatePlanUI(user) {
    const planNameEl = document.getElementById('plan-name');
    const statusBadge = document.getElementById('plan-status');
    const washCountEl = document.querySelector('.usage-stats .stat-item:nth-child(2) .stat-number');
    
    if (user.activePlan) {
        planNameEl.textContent = user.activePlan.charAt(0).toUpperCase() + user.activePlan.slice(1) + " Plan";
        statusBadge.textContent = 'Active';
        statusBadge.className = 'status-badge active';
        if (washCountEl) washCountEl.textContent = user.washCredits === 999 ? '∞' : user.washCredits;
    } else {
        planNameEl.textContent = 'No Active Plan';
        statusBadge.textContent = 'Inactive';
        statusBadge.className = 'status-badge inactive';
        if (washCountEl) washCountEl.textContent = user.washCredits || 0;
    }
}

// Render Vehicles
function renderVehicles(vehicles) {
    const grid = document.getElementById('vehiclesGrid');
    if (!grid) return;
    
    if (vehicles.length === 0) {
        grid.innerHTML = `
            <div class="empty-state-vector">
                <i class="fas fa-warehouse empty-vector-icon"></i>
                <h4 style="font-weight: 800; font-size: 20px; margin-bottom: 8px;">Your Garage is Empty</h4>
                <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 24px;">Add a vehicle to unlock personalized bookings.</p>
                <button class="btn-pill" onclick="showAddVehicleModal()">
                    <i class="fas fa-plus"></i> Add Vehicle
                </button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = vehicles.map((v, index) => `
        <div class="vehicle-card ${index === 0 ? 'primary' : ''}">
            <div class="vehicle-header">
                <div class="vehicle-icon">
                    <i class="fas fa-car"></i>
                </div>
                ${index === 0 ? '<span class="vehicle-badge primary">Primary</span>' : ''}
            </div>
            <div class="vehicle-details">
                <h4 style="font-weight: 800; font-size: 16px;">${v.year || ''} ${v.make || ''} ${v.model}</h4>
                <p class="license-plate" style="color: var(--primary); font-family: monospace; font-size: 14px; margin-top: 4px;">${v.plate}</p>
                <p class="vehicle-color" style="color: var(--text-muted); font-size: 12px; margin-top: 2px;">Color: ${v.color}</p>
            </div>
            <div class="vehicle-stats">
                <div class="stat">
                    <span class="label">Last Wash</span>
                    <span class="value">Never</span>
                </div>
                <div class="stat">
                    <span class="label">Status</span>
                    <span class="value">Ready</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Render History
function renderHistory(history) {
    const list = document.getElementById('activityList');
    if (!list) return;
    
    if (history.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clock"></i>
                <p>No wash history yet. Your first shine is waiting!</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = history.slice(0, 5).map(h => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <div class="activity-details">
                <h4>${h.type}</h4>
                <p>${h.location}</p>
                <span class="activity-time">${h.date}</span>
            </div>
            <div class="activity-status">
                <span class="badge success">${h.status}</span>
            </div>
        </div>
    `).join('');
}

// Update Stats
function updateStats(user) {
    const totalWashes = document.getElementById('totalWashes');
    const waterSaved = document.getElementById('waterSaved');
    const loyaltyPoints = document.getElementById('loyaltyPoints');
    
    if (totalWashes) totalWashes.textContent = user.history ? user.history.length : 0;
    if (waterSaved) {
        const saved = (user.history ? user.history.length : 0) * 150; // Simulate 150L per wash
        waterSaved.textContent = saved + 'L';
    }
    if (loyaltyPoints) {
        const points = (user.history ? user.history.length : 0) * 50; // Simulate 50pts per wash
        loyaltyPoints.textContent = points;
    }
}

// Show/Hide Car Loader Utility
function toggleCarLoader(show, text = "Revving up...") {
    const loader = document.getElementById('carLoader');
    if (!loader) return;
    
    const textEl = loader.querySelector('.loading-text');
    if (textEl) textEl.textContent = text;
    
    if (show) {
        loader.classList.add('active');
    } else {
        loader.classList.remove('active');
    }
}

// Vehicle Modal Functions
function showAddVehicleModal() {
    const modal = document.getElementById('vehicleModal');
    if (modal) modal.classList.add('active');
}

function closeAddVehicleModal() {
    const modal = document.getElementById('vehicleModal');
    if (modal) modal.classList.remove('active');
}

function handleAddVehicle(event) {
    event.preventDefault();
    
    const vehicle = {
        make: document.getElementById('vehicleMake').value,
        model: document.getElementById('vehicleModel').value,
        year: document.getElementById('vehicleYear').value,
        plate: document.getElementById('vehiclePlate').value,
        color: document.getElementById('vehicleColor').value
    };
    
    toggleCarLoader(true, "Parking in cloud garage...");
    
    Auth.addVehicle(vehicle).then(() => {
        toggleCarLoader(false);
        closeAddVehicleModal();
        showNotification("Vehicle added to your Cloud Garage! 🚗", "success");
        event.target.reset();
        if (navigator.vibrate) navigator.vibrate([50]);
    }).catch(error => {
        toggleCarLoader(false);
        showNotification("Error saving vehicle: " + error.message, "error");
    });
}

// Location Search & Scanning simulation
function searchNearby() {
    const input = document.getElementById('locationInput');
    const location = input.value.trim().toLowerCase();
    
    if (!location) {
        showNotification("Please enter a location first", "info");
        return;
    }
    
    const list = document.getElementById('locationsList');
    list.classList.add('scanning-active');
    toggleCarLoader(true, `Scanning ${location} for partners...`);
    
    setTimeout(() => {
        list.classList.remove('scanning-active');
        toggleCarLoader(false);
        renderNearbyLocations(location);
    }, 2000);
}

function renderNearbyLocations(city) {
    const list = document.getElementById('locationsList');
    const isLagos = city.includes('lagos') || city.includes('lekki') || city.includes('ikeja');
    
    const mockLocations = isLagos ? [
        { name: "Lekki Phase 1 Car Wash", dist: "1.2 km", rating: "4.8", status: "Open" },
        { name: "Victoria Island Premium", dist: "2.5 km", rating: "4.9", status: "Open" },
        { name: "Ikeja City Mall Branch", dist: "4.8 km", rating: "4.7", status: "Busy" }
    ] : [
        { name: "Abuja Central Market", dist: "0.8 km", rating: "4.5", status: "Open" },
        { name: "Garki Area 1 Express", dist: "2.1 km", rating: "4.6", status: "Open" },
        { name: "Maitama Luxury Wash", dist: "3.5 km", rating: "4.9", status: "Busy" }
    ];
    
    list.innerHTML = mockLocations.map(loc => `
        <div class="location-item car-glow">
            <div class="location-info">
                <h4>${loc.name}</h4>
                <p><i class="fas fa-map-marker-alt"></i> ${loc.dist} away</p>
                <div class="location-meta">
                    <span class="rating">⭐ ${loc.rating}</span>
                    <span class="status ${loc.status.toLowerCase()}">${loc.status}</span>
                </div>
            </div>
            <button class="btn btn-sm btn-primary">Navigate</button>
        </div>
    `).join('');
}

// Global Notification Utility (if matches script.js)
function showNotification(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// QR Scanner Logic (Direct Camera - No Extra UI)
let html5Qrcode = null;

function showQRScanner() {
    const modal = document.getElementById('qrModal');
    if (modal) modal.classList.add('active');

    // Small delay to let the modal animate in before starting camera
    setTimeout(() => {
        if (html5Qrcode) return; // already running

        html5Qrcode = new Html5Qrcode('qr-reader');

        html5Qrcode.start(
            { facingMode: 'environment' }, // use rear camera
            { fps: 15, qrbox: { width: 240, height: 240 } },
            (decodedText) => {
                // Success: QR scanned
                if (navigator.vibrate) navigator.vibrate([80, 40, 80]); // success haptic
                showNotification('QR Code scanned! ✅', 'success');
                closeQRScanner();
                // TODO: process decodedText (e.g. validate wash token)
                console.log('QR Code Data:', decodedText);
            },
            () => {
                // Per-frame failure: normal, ignore silently
            }
        ).catch((err) => {
            showNotification('Camera permission denied.', 'error');
            closeQRScanner();
            console.error('QR Start Error:', err);
        });
    }, 350);
}

function closeQRScanner() {
    const modal = document.getElementById('qrModal');
    if (modal) modal.classList.remove('active');

    if (html5Qrcode) {
        html5Qrcode.stop().then(() => {
            html5Qrcode.clear();
            html5Qrcode = null;
        }).catch(() => {
            html5Qrcode = null;
        });
    }
}

function handleLogout() {
    toggleCarLoader(true, "Parking and logging out...");
    setTimeout(() => {
        Auth.logout();
    }, 1500);
}
