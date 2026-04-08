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
            // The UI routing is now handled safely by syncUserData after fetching checking if name exists.
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
        document.getElementById('name-input-step').style.display = 'none';
        document.getElementById('welcomePhone').value = '';
        document.getElementById('otpCode').value = '';
    },

    // Save Name Action (Final Step for new users)
    saveProfileName() {
        if (!this.currentUser) return;
        const name = document.getElementById('profileName').value.trim();
        if (!name) return alert('Please enter your name');

        const btn = event.target;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        db.collection('customers').doc(this.currentUser.uid).update({ name: name }).then(() => {
            this.currentUser.displayName = name;
            document.querySelectorAll('.user-name').forEach(el => el.textContent = name);
            if (typeof closeAuthModal === 'function') closeAuthModal();
            if (typeof switchSection === 'function') switchSection('home');
        });
    },

    // Logout
    logout() {
        firebase.auth().signOut().then(() => {
            if (typeof switchSection === 'function') switchSection('welcome');
            window.cachedVehicles = [];
            // Remove the hard redirect to index.html
        });
    },

    // Coming Soon Alert
    comingSoon(feature) {
        if (typeof showNotification === 'function') {
            showNotification(feature + " is coming soon! 🚧", "info");
        } else {
            alert(feature + " is coming soon! 🚧");
        }
    },

    // Native GPS Location Request
    requestLocation() {
        const textEl = document.getElementById('userLocationText');
        if (!navigator.geolocation) {
            textEl.textContent = "GPS Not Supported";
            return;
        }
        
        textEl.textContent = "Locating...";
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // In a real app we'd reverse geocode here based on lat/lng.
                // For the prototype, we simulate a successful local match.
                textEl.textContent = "📍 Lekki Phase 1, Lagos";
                if (typeof showNotification === 'function') {
                    showNotification("Location synced successfully!", "success");
                }
            },
            (error) => {
                let msg = "Location Off";
                if (error.code === error.PERMISSION_DENIED) msg = "Permission Denied";
                textEl.textContent = msg;
                if (typeof showNotification === 'function') {
                    showNotification("Location access denied.", "error");
                }
            }
        );
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
                // Slide to Name capture
                document.getElementById('phone-input-step').style.display = 'none';
                document.getElementById('otp-input-step').style.display = 'none';
                document.getElementById('name-input-step').style.display = 'block';
            } else {
                const data = doc.data();
                if (!data.name) {
                    // Profile exists but no name yet
                    document.getElementById('phone-input-step').style.display = 'none';
                    document.getElementById('otp-input-step').style.display = 'none';
                    document.getElementById('name-input-step').style.display = 'block';
                } else {
                    // Fully onboarded user -> let them in!
                    this.currentUser.displayName = data.name;
                    document.querySelectorAll('.user-name').forEach(el => el.textContent = data.name);
                    if (typeof closeAuthModal === 'function') closeAuthModal();
                    if (typeof switchSection === 'function') switchSection('home');
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
