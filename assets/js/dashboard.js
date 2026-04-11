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

// Plan & Credits UI (Task 2: Linked to Firestore Listener)
function updatePlanUI(user) {
    const activeCard = document.getElementById('activeSubscriptionCard');
    if (!activeCard) return;

    if (user.subscription && user.subscription.status === 'active') {
        activeCard.style.display = 'block';
        
        const planName = document.getElementById('userPlanName');
        const planStatus = document.getElementById('userPlanStatus');
        const washesLeft = document.getElementById('userWashesLeft');
        const progress = document.getElementById('usageProgress');
        const unlimitedText = document.getElementById('unlimitedText');
        const usageContainer = document.getElementById('usageContainer');
        const iconContainer = document.getElementById('planIconContainer');

        const sub = user.subscription;
        const planId = sub.planId || 'silver';
        
        planName.textContent = planId.charAt(0).toUpperCase() + planId.slice(1) + " Plan";
        
        if (planId === 'gold') {
            unlimitedText.style.display = 'block';
            usageContainer.style.display = 'none';
            iconContainer.style.background = '#F59E0B'; // Gold theme
            iconContainer.innerHTML = '<i class="fas fa-crown"></i>';
            activeCard.style.background = 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(15, 23, 42, 0.8))';
            activeCard.style.borderColor = 'rgba(245, 158, 11, 0.3)';
        } else {
            unlimitedText.style.display = 'none';
            usageContainer.style.display = 'block';
            iconContainer.style.background = 'var(--primary)'; // Silver/Primary theme
            iconContainer.innerHTML = '<i class="fas fa-shield-alt"></i>';
            activeCard.style.background = 'linear-gradient(135deg, rgba(0, 230, 118, 0.15), rgba(15, 23, 42, 0.8))';
            activeCard.style.borderColor = 'rgba(0, 230, 118, 0.3)';

            const remaining = sub.washesRemaining || 0;
            const total = sub.totalWashes || 2; // Default for Silver
            washesLeft.textContent = remaining;
            const pct = (remaining / total) * 100;
            progress.style.width = `${pct}%`;
        }
    } else {
        activeCard.style.display = 'none';
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

// Update Stats (Task 2: Real Data)
function updateStats(user) {
    const totalWashes = document.getElementById('statWashes');
    const waterSavedText = document.getElementById('waterSaved');
    const loyaltyPoints = document.getElementById('statPoints');
    
    const count = user.washes || 0;
    if (totalWashes) totalWashes.textContent = count.toLocaleString();
    
    if (waterSavedText) {
        const saved = count * 150; // Use the 150L per wash factor
        waterSavedText.textContent = saved.toLocaleString() + 'L';
    }
    
    if (loyaltyPoints) {
        loyaltyPoints.textContent = (user.points || 0).toLocaleString();
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
                handleScannedHub(decodedText);
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
            // Reset Views
            document.getElementById('qrScannerView').style.display = 'block';
            document.getElementById('qrSelectionView').style.display = 'none';
        }).catch(() => {
            html5Qrcode = null;
        });
    }
}

/**
 * Task 3: Handle the hub identification and show vehicle picker
 */
function handleScannedHub(hubId) {
    console.log("[WashPass] Scanned Hub:", hubId);
    
    // Switch Views
    const scannerView = document.getElementById('qrScannerView');
    const selectionView = document.getElementById('qrSelectionView');
    const vehicleList = document.getElementById('qrVehicleList');
    
    if (scannerView) scannerView.style.display = 'none';
    if (selectionView) selectionView.style.display = 'block';
    
    // Stop camera now that we have the data
    if (html5Qrcode) {
        html5Qrcode.stop().then(() => { html5Qrcode = null; });
    }

    const vehicles = window.cachedVehicles || [];
    if (vehicles.length === 0) {
        vehicleList.innerHTML = `<p style="color: var(--error); font-size: 13px;">No vehicles found in your garage. Add one first!</p>`;
        return;
    }

    vehicleList.innerHTML = vehicles.map(v => `
        <button class="btn-pill" style="justify-content: space-between; padding: 0 20px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03);" onclick="confirmRedemption('${v.id}', '${hubId}')">
            <span>${v.make} ${v.model}</span>
            <span style="font-family: monospace; color: var(--primary); font-size: 11px;">${v.plate}</span>
        </button>
    `).join('');
}

/**
 * Task 3: Execute the final redemption
 */
async function confirmRedemption(vehicleId, hubId) {
    const list = document.getElementById('qrVehicleList');
    const processing = document.getElementById('qrProcessingState');
    
    if (list) list.style.display = 'none';
    if (processing) processing.style.display = 'block';

    try {
        await Auth.redeemWash(vehicleId, 'Standard');
        
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
        showNotification('Wash Redeemed Successfully! 🚿✨', 'success');
        
        // Final Success State UI
        const selectionView = document.getElementById('qrSelectionView');
        if (selectionView) {
            selectionView.innerHTML = `
                <div style="color: var(--primary); font-size: 64px; margin-bottom: 20px;">
                    <i class="fas fa-check-double"></i>
                </div>
                <h3 style="font-weight: 800; font-size: 24px; color: white;">Verified!</h3>
                <p style="color: var(--text-muted); font-size: 14px;">Your wash is authorized. Enjoy your shine!</p>
            `;
        }

        setTimeout(() => closeQRScanner(), 3000);
    } catch (err) {
        console.error("[WashPass] Redemption failed:", err);
        showNotification(err.message || 'Redemption failed', 'error');
        if (list) list.style.display = 'flex';
        if (processing) processing.style.display = 'none';
    }
}

function handleLogout() {
    toggleCarLoader(true, "Parking and logging out...");
    setTimeout(() => {
        Auth.logout();
    }, 1500);
}
