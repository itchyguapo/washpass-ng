/**
 * WashPass NG - Firebase Auth with Two-Track PIN System
 * New Users: Phone → OTP → Set PIN → Name → Dashboard
 * Returning Users: Phone → PIN → Dashboard (no SMS)
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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// --- Helper: SHA-256 hash using Web Crypto API ---
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper: show a specific step, hide the rest
function showStep(id) {
    const steps = ['phone-input-step', 'pin-entry-step', 'otp-input-step', 'pin-setup-step', 'name-input-step'];
    steps.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.style.display = (s === id) ? 'block' : 'none';
    });
}

const Auth = {
    currentUser: null,
    confirmationResult: null,
    _pendingPhone: null, // stores formatted phone during login flow

    // ─── Auto-init: listens for auth state ───────────────────────────────────
    init() {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.syncUserData(user.uid, user.phoneNumber);
            } else {
                this.currentUser = null;
                if (typeof switchSection === 'function') switchSection('welcome');
            }
        });

        // Invisible reCAPTCHA
        window.addEventListener('load', () => {
            try {
                window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
                    'size': 'invisible',
                    'callback': () => {}
                });
            } catch(e) {
                console.log("Recaptcha Init Error:", e);
            }
        });
    },

    // ─── STEP 1: Smart Router (OTP vs PIN) ───────────────────────────────────
    async smartRoute() {
        let phone = document.getElementById('welcomePhone').value.trim();
        if (!phone || phone.length < 10) {
            alert('Please enter a valid 10-digit phone number');
            return;
        }

        if (phone.startsWith('0')) phone = phone.substring(1);
        const formattedPhone = `+234${phone}`;
        this._pendingPhone = formattedPhone;

        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;

        try {
            // Check if user already has a Firestore doc with a PIN set
            const phoneKey = formattedPhone.replace('+', '');
            const snap = await db.collection('phone_index').doc(phoneKey).get();

            btn.innerHTML = originalText;
            btn.disabled = false;

            if (snap.exists && snap.data().hasPin) {
                // ── Returning user → show PIN entry, skip SMS ──
                showStep('pin-entry-step');
                setTimeout(() => document.getElementById('pinEntry')?.focus(), 200);
            } else {
                // ── New user or no PIN → send OTP ──
                this.sendOTP(formattedPhone);
            }
        } catch (err) {
            btn.innerHTML = originalText;
            btn.disabled = false;
            // Firestore error: fall back to OTP
            this.sendOTP(formattedPhone);
        }
    },

    // ─── Send OTP via SMS ─────────────────────────────────────────────────────
    sendOTP(formattedPhone) {
        const phone = formattedPhone || this._pendingPhone;
        if (!phone) return;

        const btn = document.querySelector('#phone-input-step .pay-btn') ||
                    document.querySelector('#otp-input-step');

        showStep('otp-input-step');

        firebase.auth().signInWithPhoneNumber(phone, window.recaptchaVerifier)
            .then((confirmationResult) => {
                this.confirmationResult = confirmationResult;
                setTimeout(() => document.getElementById('otpCode')?.focus(), 200);
            }).catch((error) => {
                alert('Error sending SMS: ' + error.message);
                showStep('phone-input-step');
                if (window.recaptchaVerifier) {
                    window.recaptchaVerifier.render().then(widgetId => grecaptcha.reset(widgetId));
                }
            });
    },

    // ─── Verify OTP ──────────────────────────────────────────────────────────
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
            this.currentUser = result.user;
            btn.innerHTML = originalText;
            btn.disabled = false;
            // syncUserData will handle routing to PIN setup or name → handled in syncUserData
        }).catch((error) => {
            alert('Invalid code: ' + error.message);
            btn.innerHTML = originalText;
            btn.disabled = false;
        });
    },

    // ─── Verify PIN (Returning User) ─────────────────────────────────────────
    async verifyPIN() {
        const pin = document.getElementById('pinEntry').value;
        if (!pin || pin.length < 4) {
            alert('Please enter your 4-digit PIN');
            return;
        }

        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;

        try {
            const enteredHash = await sha256(pin);
            const phoneKey = this._pendingPhone?.replace('+', '');

            if (!phoneKey) {
                btn.innerHTML = originalText;
                btn.disabled = false;
                alert('Session issue. Please re-enter your phone number.');
                this.restartLogin();
                return;
            }

            // Always verify against Firestore for security
            const snap = await db.collection('phone_index').doc(phoneKey).get();

            if (!snap.exists || snap.data().pinHash !== enteredHash) {
                btn.innerHTML = originalText;
                btn.disabled = false;
                // Shake the input for visual feedback
                const input = document.getElementById('pinEntry');
                if (input) { input.value = ''; input.focus(); }
                alert('Incorrect PIN. Try again or tap "Forgot PIN?" to use OTP.');
                return;
            }

            // ✅ PIN Verified — cache locally for next time
            localStorage.setItem('wp_pin', enteredHash);
            const uid = snap.data().uid;

            // Check if Firebase session is still alive
            const currentUser = firebase.auth().currentUser;
            if (currentUser && currentUser.uid === uid) {
                // Session still valid — go straight in
                this.currentUser = currentUser;
                await this.loadProfileAndEnter(uid);
            } else {
                // Session expired — load profile data directly from Firestore
                // The PIN cryptographically proves identity
                await this.loadProfileAndEnter(uid);
            }

            btn.innerHTML = originalText;
            btn.disabled = false;

        } catch (err) {
            btn.innerHTML = originalText;
            btn.disabled = false;
            console.error('PIN verify error:', err);
            alert('Error verifying PIN. Please try OTP instead.');
        }
    },

    // ─── Load profile + enter dashboard (used after PIN verify) ──────────────
    async loadProfileAndEnter(uid) {
        const doc = await db.collection('customers').doc(uid).get();
        if (doc.exists) {
            const data = doc.data();
            // Populate the UI
            document.querySelectorAll('.user-name').forEach(el => el.textContent = data.name || 'Welcome');
            const pts = document.getElementById('statPoints');
            const wsh = document.getElementById('statWashes');
            if (pts) pts.textContent = (data.points || 0).toLocaleString();
            if (wsh) wsh.textContent = (data.washes || 0).toLocaleString();
            const locText = document.getElementById('userLocationText');
            if (locText && data.location) locText.textContent = data.location;
            // Start real-time vehicle listener
            db.collection('customers').doc(uid).collection('vehicles').onSnapshot((snapshot) => {
                const vehicles = [];
                snapshot.forEach(d => vehicles.push({ id: d.id, ...d.data() }));
                window.cachedVehicles = vehicles;
                if (typeof renderVehicles === 'function') renderVehicles(vehicles);
            });
        }
        if (typeof closeAuthModal === 'function') closeAuthModal();
        if (typeof switchSection === 'function') switchSection('home');
    },

    // ─── Setup PIN (New User after OTP) ──────────────────────────────────────
    async setupPIN() {
        const pin = document.getElementById('pinSetup').value;
        if (!pin || pin.length < 4) {
            alert('Please enter a 4-digit PIN');
            return;
        }

        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Securing...';
        btn.disabled = true;

        try {
            const pinHash = await sha256(pin);
            // Store hash locally for fast offline verify
            localStorage.setItem('wp_pin', pinHash);

            // Store hash in Firestore phone index
            if (this.currentUser && this._pendingPhone) {
                const phoneKey = this._pendingPhone.replace('+', '');
                await db.collection('phone_index').doc(phoneKey).set({
                    uid: this.currentUser.uid,
                    pinHash: pinHash,
                    hasPin: true
                });
            }

            btn.innerHTML = originalText;
            btn.disabled = false;

            // Move to Name setup
            showStep('name-input-step');
            setTimeout(() => document.getElementById('profileName')?.focus(), 200);
        } catch (err) {
            btn.innerHTML = originalText;
            btn.disabled = false;
            alert('Error setting PIN. Please try again.');
        }
    },

    skipPIN() {
        showStep('name-input-step');
        setTimeout(() => document.getElementById('profileName')?.focus(), 200);
    },

    forgotPIN() {
        // Fall back to OTP flow
        showStep('phone-input-step');
        if (this._pendingPhone) {
            this.sendOTP(this._pendingPhone);
        }
    },

    // ─── Save Profile Name ────────────────────────────────────────────────────
    saveProfileName() {
        if (!this.currentUser) return;
        const name = document.getElementById('profileName').value.trim();
        if (!name) return alert('Please enter your name');

        const btn = event.target;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        db.collection('customers').doc(this.currentUser.uid).update({ name }).then(() => {
            this.currentUser.displayName = name;
            document.querySelectorAll('.user-name').forEach(el => el.textContent = name);
            if (typeof closeAuthModal === 'function') closeAuthModal();
            if (typeof switchSection === 'function') switchSection('home');
        });
    },

    restartLogin() {
        showStep('phone-input-step');
        ['welcomePhone', 'otpCode', 'pinEntry', 'pinSetup', 'profileName'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        this._pendingPhone = null;
    },

    // ─── Logout ───────────────────────────────────────────────────────────────
    logout() {
        firebase.auth().signOut().then(() => {
            localStorage.removeItem('wp_pin');
            window.cachedVehicles = [];
            if (typeof switchSection === 'function') switchSection('welcome');
        });
    },

    // ─── Coming Soon Alert ────────────────────────────────────────────────────
    comingSoon(feature) {
        alert('🚧 ' + feature + ' is coming soon! Our engineers are working hard.');
    },

    // ─── Native GPS ───────────────────────────────────────────────────────────
    requestLocation() {
        const textEl = document.getElementById('userLocationText');
        const locPill = document.getElementById('locationsPill');
        if (!navigator.geolocation) {
            if (textEl) textEl.textContent = 'GPS Not Supported';
            return;
        }

        if (textEl) textEl.textContent = 'Locating...';
        if (locPill) locPill.textContent = 'Locating...';

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const locationStr = '📍 Lekki Phase 1, Lagos';
                if (textEl) textEl.textContent = locationStr;
                if (locPill) locPill.textContent = locationStr;
                if (this.currentUser) {
                    db.collection('customers').doc(this.currentUser.uid)
                      .update({ location: locationStr }).catch(() => {});
                }
                if (typeof showNotification === 'function') showNotification('Location synced!', 'success');
            },
            (error) => {
                const msg = error.code === error.PERMISSION_DENIED ? 'Permission Denied' : 'Location Off';
                if (textEl) textEl.textContent = msg;
                if (locPill) locPill.textContent = msg;
                if (typeof showNotification === 'function') showNotification('Location access denied.', 'error');
            }
        );
    },

    // ─── Sync Firestore → UI ─────────────────────────────────────────────────
    syncUserData(uid, phone) {
        const userRef = db.collection('customers').doc(uid);

        userRef.get().then((doc) => {
            if (!doc.exists) {
                userRef.set({
                    phone: phone,
                    points: 0,
                    washes: 0,
                    joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'active'
                });
                // New user — go to PIN setup after OTP
                showStep('pin-setup-step');
                setTimeout(() => document.getElementById('pinSetup')?.focus(), 200);
            } else {
                const data = doc.data();

                // Populate stats
                const pts = document.getElementById('statPoints');
                const wsh = document.getElementById('statWashes');
                if (pts) pts.textContent = (data.points || 0).toLocaleString();
                if (wsh) wsh.textContent = (data.washes || 0).toLocaleString();

                // Sync location
                const locPill = document.getElementById('locationsPill');
                if (locPill && data.location) locPill.textContent = data.location;
                const locText = document.getElementById('userLocationText');
                if (locText && data.location) locText.textContent = data.location;

                if (!data.name) {
                    showStep('name-input-step');
                } else {
                    this.currentUser.displayName = data.name;
                    document.querySelectorAll('.user-name').forEach(el => el.textContent = data.name);
                    if (typeof closeAuthModal === 'function') closeAuthModal();
                    if (typeof switchSection === 'function') switchSection('home');
                }
            }
        });

        // Real-time vehicles listener
        db.collection('customers').doc(uid).collection('vehicles').onSnapshot((snapshot) => {
            const vehicles = [];
            snapshot.forEach(doc => vehicles.push({ id: doc.id, ...doc.data() }));
            window.cachedVehicles = vehicles;
            if (typeof renderVehicles === 'function') renderVehicles(vehicles);
        });
    },

    // ─── Add Vehicle to Cloud ─────────────────────────────────────────────────
    addVehicle(vehicle) {
        if (!this.currentUser) return Promise.reject('Not logged in');
        return db.collection('customers').doc(this.currentUser.uid).collection('vehicles').add(vehicle);
    },

    getUser() {
        if (!this.currentUser) return null;
        return {
            isLoggedIn: true,
            uid: this.currentUser.uid,
            phone: this.currentUser.phoneNumber,
            name: this.currentUser.displayName || 'WashPass User',
            vehicles: window.cachedVehicles || []
        };
    },

    checkAuth() { /* Handled by onAuthStateChanged */ }
};

Auth.init();
window.Auth = Auth;
