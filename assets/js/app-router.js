/**
 * SPA Router and State Management for WashPass NG
 */

const state = {
    currentSection: 'home',
    cart: [],
    user: Auth.getUser()
};

/**
 * Switch between app sections
 * @param {string} sectionId - The ID of the section to show
 */
function switchSection(sectionId) {
    console.log(`Switching to section: ${sectionId}`);
    
    // Update State
    state.currentSection = sectionId;

    // Hide all sections
    document.querySelectorAll('.app-section').forEach(section => {
        section.classList.remove('active');
    });

    // Signed-in (Firebase phone session and/or PIN path) required for app sections
    const user = Auth.getUser();
    if (!user || !user.isLoggedIn) {
        if (sectionId !== 'welcome') {
            sectionId = 'welcome';
        }
    }

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        state.currentSection = sectionId;
        window.location.hash = sectionId;
    }

    // Toggle Bottom Nav Visibility (Hide on Welcome)
    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav) {
        if (sectionId === 'welcome') {
            bottomNav.style.display = 'none';
        } else {
            bottomNav.style.display = 'flex';
        }
    }

    // Update Bottom Nav UI
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        // Check if this nav item links to the current section
        const onclickAttr = item.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(`'${sectionId}'`)) {
            item.classList.add('active');
        }
    });

    // Special handling for Cart UI
    if (sectionId === 'cart') {
        renderCart();
    }
}

/**
 * Add item to cart
 * @param {string} name - Item name
 * @param {number} price - Item price
 */
function addToCart(name, price) {
    state.cart.push({ name, price, id: Date.now() });
    
    // Update Notification Badge instead of jumping to cart
    const badge = document.getElementById('cartBadge');
    if (badge) {
        badge.textContent = state.cart.length;
        badge.style.display = 'flex';
        // Re-trigger animation
        badge.style.animation = 'none';
        badge.offsetHeight; // trigger reflow
        badge.style.animation = 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }
    
    // Vibrate device if supported to provide premium haptic feedback
    if (navigator.vibrate) navigator.vibrate([50]);
}

/**
 * Render Cart contents
 */
function renderCart() {
    const cartContainer = document.getElementById('cart-items');
    const totalElement = document.getElementById('cart-total');
    
    if (!cartContainer) return;

    if (state.cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 40px 20px;">
                <i class="fas fa-shopping-basket" style="font-size: 48px; color: var(--text-muted); margin-bottom: 16px;"></i>
                <p style="color: var(--text-muted);">Your cart is empty</p>
                <button class="btn" onclick="switchSection('home')" style="margin-top: 16px;">Browse Services</button>
            </div>
        `;
        if (totalElement) totalElement.textContent = '₦0';
        return;
    }

    let total = 0;
    cartContainer.innerHTML = state.cart.map(item => {
        total += item.price;
        return `
            <div class="cart-card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h4 style="margin: 0; font-size: 15px;">${item.name}</h4>
                        <p style="margin: 4px 0 0; font-size: 12px; color: var(--text-muted);">Premium Service</p>
                    </div>
                    <span class="font-bold">₦${item.price.toLocaleString()}</span>
                </div>
            </div>
        `;
    }).join('');

    if (totalElement) totalElement.textContent = `₦${total.toLocaleString()}`;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    const user = Auth.getUser();
    if (user) {
        document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name || 'Welcome');
    }

    const hash = window.location.hash.replace('#', '');
    const userLoggedIn = user && user.isLoggedIn;

    if (hash && document.getElementById(hash) && hash !== 'welcome' && userLoggedIn) {
        switchSection(hash);
    } else if (!userLoggedIn) {
        switchSection('welcome');
    } else {
        switchSection('home');
    }
});

// Native SPA Auth Modal Logic
window.openAuthModal = function() {
    if (typeof Auth !== 'undefined' && typeof Auth.prepareAuthModal === 'function') {
        Auth.prepareAuthModal();
    }
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.add('active');
};

window.closeAuthModal = function() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.remove('active');
};
