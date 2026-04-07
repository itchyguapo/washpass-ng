/**
 * Auth Utility for WashPass NG
 * Handles simple local state management using localStorage
 */

const Auth = {
    USER_KEY: 'washpass_user',

    // Initialize with default state if not exists
    init() {
        if (!localStorage.getItem(this.USER_KEY)) {
            // Default empty state
            const defaultUser = {
                isLoggedIn: false,
                name: '',
                phone: '',
                activePlan: null, // 'basic', 'standard', 'premium', or null
                washCredits: 0,
                history: []
            };
            this.save(defaultUser);
        }
    },

    // Get current user data
    getUser() {
        return JSON.parse(localStorage.getItem(this.USER_KEY));
    },

    // Save user data
    save(userData) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
    },

    // Register/Login a user
    login(name, phone) {
        const user = this.getUser();
        user.isLoggedIn = true;
        user.name = name;
        user.phone = phone;
        this.save(user);
    },

    // Logout
    logout() {
        const user = this.getUser();
        user.isLoggedIn = false;
        user.name = '';
        user.phone = '';
        user.activePlan = null;
        user.washCredits = 0;
        this.save(user);
        window.location.href = 'index.html';
    },

    // Subscribe to a plan
    subscribe(planId) {
        const user = this.getUser();
        user.activePlan = planId;
        
        // Add credits based on plan
        if (planId === 'basic') user.washCredits = 4;
        if (planId === 'standard') user.washCredits = 8;
        if (planId === 'premium') user.washCredits = 999; // Unlimited simulation
        
        this.save(user);
    },

    // Buy one-time wash
    buyOneTimeWash() {
        const user = this.getUser();
        user.washCredits += 1;
        this.save(user);
    },

    // Check if user is logged in
    checkAuth() {
        const user = this.getUser();
        if (!user || !user.isLoggedIn) {
            // Redirect to index if on a protected page
            const path = window.location.pathname;
            if (path.includes('dashboard.html')) {
                window.location.href = 'index.html';
            }
        }
    }
};

// Auto-init on script load
Auth.init();
window.Auth = Auth; // Make global for other scripts
