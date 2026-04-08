/**
 * Live Firebase Authentication & Firestore Integration for WashPass NG
 */

const firebaseConfig = {
    apiKey: "AIzaSyBjX7ZxFwcnXVTubC-9337Qde56KXesKZk",
    authDomain: "washpass-ng.firebaseapp.com",
    projectId: "washpass-ng",
    storageBucket: "washpass-ng.firebasestorage.app",
    messagingSenderId: "790558524838",
    appId: "1:790558524838:web:7ea4ddb76be0a23da67b67",
    measurementId: "G-YLCTPTS624"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

const Auth = {
    currentUser: null,
    confirmationResult: null,

    // Auto-init listener
    init() {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.syncUserData(user.uid, user.phoneNumber);
            } else {
                this.currentUser = null;
                // Only redirect to welcome if not already there
                if (window.location.hash !== '#welcome') {
                    if (typeof switchSection === 'function') switchSection('welcome');
                }
            }
        });

        // Setup Recaptcha once DOM is loaded
        window.addEventListener('load', () => {
            try {
                window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
                    'size': 'invisible',
                    'callback': (response) => {
                        // reCAPTCHA solved
                    }
                });
            } catch(e) {
                console.log("Recaptcha Init Error", e);
            }
        });
    },

    // Get current user mapped for the legacy UI
    getUser() {
        if (!this.currentUser) return null;
        
        // Return a mapped version of the data for the UI
        return {
            isLoggedIn: true,
            uid: this.currentUser.uid,
            phone: this.currentUser.phoneNumber,
            name: this.currentUser.displayName || 'WashPass User', // Will be fetched from firestore
            vehicles: window.cachedVehicles || [] 
        };
    },

    // Step 1: Send OTP via SMS
    sendOTP() {
        let phone = document.getElementById('welcomePhone').value;
        if (!phone || phone.length < 10) {
            alert('Please enter a valid phone number (e.g. 8012345678)');
            return;
        }

        // Format to Nigerian standard +234
        if (phone.startsWith('0')) phone = phone.substring(1);
        const formattedPhone = `+234${phone}`;

        // UI Loading State
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;

        const appVerifier = window.recaptchaVerifier;

        firebase.auth().signInWithPhoneNumber(formattedPhone, appVerifier)
            .then((confirmationResult) => {
                // SMS sent.
                this.confirmationResult = confirmationResult;
                
                // Toggle UI to OTP Input
                document.getElementById('phone-input-step').style.display = 'none';
                document.getElementById('otp-input-step').style.display = 'block';
                
                btn.innerHTML = originalText;
                btn.disabled = false;
            }).catch((error) => {
                alert('Error sending SMS: ' + error.message);
                btn.innerHTML = originalText;
                btn.disabled = false;
                // Reset recaptcha
                if (window.recaptchaVerifier) window.recaptchaVerifier.render().then(widgetId => grecaptcha.reset(widgetId));
            });
    },

    // Step 2: Verify OTP
    verifyOTP() {
        const code = document.getElementById('otpCode').value;
        if (!code || code.length < 6) {
            alert('Please enter the 6-digit code');
            return;
        }

        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
        btn.disabled = true;

        this.confirmationResult.confirm(code).then((result) => {
            // User signed in successfully.
            const user = result.user;
            console.log("Logged in as:", user.phoneNumber);
            
            // UI will automatically switch to dashboard via onAuthStateChanged
            // but we can force it here for immediate UX
            if (typeof switchSection === 'function') switchSection('home');
            
            btn.innerHTML = originalText;
            btn.disabled = false;
        }).catch((error) => {
            alert('Invalid verification code: ' + error.message);
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
    },

    // Cancel Login Action
    restartLogin() {
        document.getElementById('phone-input-step').style.display = 'block';
        document.getElementById('otp-input-step').style.display = 'none';
        document.getElementById('welcomePhone').value = '';
        document.getElementById('otpCode').value = '';
    },

    // Logout
    logout() {
        firebase.auth().signOut().then(() => {
            if (typeof switchSection === 'function') switchSection('welcome');
            window.cachedVehicles = [];
            // Remove the hard redirect to index.html
        });
    },

    // Sync Data with Firestore
    syncUserData(uid, phone) {
        const userRef = db.collection('customers').doc(uid);
        
        userRef.get().then((doc) => {
            if (!doc.exists) {
                // Create new customer profile
                userRef.set({
                    phone: phone,
                    joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'active'
                });
            } else {
                // User exists, update UI with their specific name if they have one
                const data = doc.data();
                if (data.name) {
                    this.currentUser.displayName = data.name;
                    document.querySelectorAll('.user-name').forEach(el => el.textContent = data.name);
                }
            }
        });

        // Listen for their vehicles in real-time
        db.collection('customers').doc(uid).collection('vehicles').onSnapshot((snapshot) => {
            const vehicles = [];
            snapshot.forEach(doc => {
                vehicles.push({ id: doc.id, ...doc.data() });
            });
            window.cachedVehicles = vehicles; // Store globally for the UI
            
            // Re-render vehicles if the dashboard function exists
            if (typeof renderVehicles === 'function') {
                renderVehicles(vehicles);
            }
        });
    },

    // Add vehicle to cloud Database
    addVehicle(vehicle) {
        if (!this.currentUser) return;
        return db.collection('customers').doc(this.currentUser.uid).collection('vehicles').add(vehicle);
    },

    checkAuth() {
        // Handled automatically via onAuthStateChanged now.
    }
};

// Auto-init on script load
Auth.init();
window.Auth = Auth; // Make global for other scripts
