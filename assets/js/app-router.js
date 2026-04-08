/**
 * SPA Router and State Management for WashPass NG
 */

const state = {
    currentSection: 'home',
    cart: [],
    user: Auth.getUser() || {
        name: 'Ade',
        location: 'Lekki Phase 1, Lagos'
    }
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

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        window.scrollTo(0, 0);
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
    alert(`${name} added to cart!`);
    switchSection('cart');
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
    // Dynamic Header Data
    const user = Auth.getUser();
    if (user) {
        document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name || 'Ade');
    }

    // Check for initial hash or default to home
    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById(hash)) {
        switchSection(hash);
    } else {
        switchSection('home');
    }
});
