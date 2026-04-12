/**
 * WashPass — Firebase phone auth (OTP) + optional 6-digit PIN
 * Returning users with a PIN can skip SMS only while a Firebase session is still valid;
 * if the session expired, a fresh OTP is sent (no “virtual” Firestore access without auth).
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

// Task 1: Backend endpoint for PIN sign-in
// UPDATE THIS URL after deployment (e.g., https://pinlogin-####.a.run.app)
const PIN_LOGIN_URL = "https://pinlogin-da2oafsoia-uc.a.run.app";

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

const PIN_LENGTH = 6;

function notifyAuth(msg, type) {
    if (typeof showNotification === 'function') {
        showNotification(msg, type || 'info');
        return;
    }
    if (msg) window.alert(msg);
}

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

const AUTH_STEP_IDS = ['phone-input-step', 'pin-entry-step', 'otp-input-step', 'pin-setup-step', 'name-input-step'];

function showStep(id) {
    AUTH_STEP_IDS.forEach((s) => {
        const el = document.getElementById(s);
        if (el) el.style.display = s === id ? 'block' : 'none';
    });
}

const Auth = {
    currentUser: null,
    pinVerified: false,
    confirmationResult: null,
    _pendingPhone: null,
    _vehicleUnsub: null,

    init() {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.syncUserData(user.uid, user.phoneNumber);
            } else {
                this.currentUser = null;
                if (typeof switchSection === 'function' && !this.pinVerified) {
                    switchSection('welcome');
                }
            }
        });

        window.addEventListener('load', () => {
            try {
                window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
                    size: 'invisible',
                    callback: () => {}
                });
            } catch (e) {
                console.warn('Recaptcha init:', e);
            }
        });
    },

    /** When opening the auth sheet, start at phone entry. */
    prepareAuthModal() {
        showStep('phone-input-step');
    },

    async smartRoute(ev) {
        let phone = document.getElementById('welcomePhone').value.trim();
        if (!phone || phone.length < 10) {
            notifyAuth('Please enter a valid 10-digit phone number.', 'error');
            return;
        }

        if (phone.startsWith('0')) phone = phone.substring(1);
        const formattedPhone = `+234${phone}`;
        this._pendingPhone = formattedPhone;

        const btn = ev && ev.target ? ev.target.closest('button') : null;
        const originalText = btn ? btn.innerHTML : '';
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btn.disabled = true;
        }

        try {
            const phoneKey = formattedPhone.replace('+', '');
            const snap = await db.collection('phone_index').doc(phoneKey).get();

            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }

            if (snap.exists && snap.data().hasPin) {
                showStep('pin-entry-step');
                setTimeout(() => document.getElementById('pinEntry')?.focus(), 200);
            } else {
                await this.sendOTP(formattedPhone);
            }
        } catch (err) {
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
            await this.sendOTP(formattedPhone);
        }
    },

    sendOTP(formattedPhone) {
        const phone = formattedPhone || this._pendingPhone;
        if (!phone) return Promise.resolve();

        showStep('otp-input-step');

        return firebase.auth().signInWithPhoneNumber(phone, window.recaptchaVerifier)
            .then((confirmationResult) => {
                this.confirmationResult = confirmationResult;
                setTimeout(() => document.getElementById('otpCode')?.focus(), 200);
            })
            .catch((error) => {
                notifyAuth('Could not send SMS: ' + (error.message || 'Unknown error'), 'error');
                showStep('phone-input-step');
                if (window.recaptchaVerifier && typeof grecaptcha !== 'undefined') {
                    window.recaptchaVerifier.render().then((widgetId) => grecaptcha.reset(widgetId)).catch(() => {});
                }
            });
    },

    verifyOTP(ev) {
        const code = document.getElementById('otpCode').value;
        if (!code || code.length < 6) {
            notifyAuth('Please enter the 6-digit code.', 'error');
            return;
        }

        const btn = ev && ev.target ? ev.target.closest('button') : document.querySelector('#otp-input-step .pay-btn');
        const originalText = btn ? btn.innerHTML : '';
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
            btn.disabled = true;
        }

        this.confirmationResult.confirm(code).then(() => {
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }).catch((error) => {
            notifyAuth('Invalid code: ' + (error.message || 'Try again'), 'error');
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    },

    async verifyPIN(ev) {
        const pin = document.getElementById('pinEntry').value;
        if (!pin || pin.length !== PIN_LENGTH || !/^\d+$/.test(pin)) {
            notifyAuth(`Enter your ${PIN_LENGTH}-digit PIN (numbers only).`, 'error');
            return;
        }

        const btn = ev && ev.target ? ev.target.closest('button') : document.querySelector('#pin-entry-step .pay-btn');
        const originalText = btn ? btn.innerHTML : '';
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btn.disabled = true;
        }

        try {
            const enteredHash = await sha256(pin);
            const phoneKey = this._pendingPhone?.replace('+', '');

            if (!phoneKey) {
                if (btn) {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
                notifyAuth('Please enter your phone number again.', 'error');
                this.restartLogin();
                return;
            }

            const snap = await db.collection('phone_index').doc(phoneKey).get();

            if (!snap.exists || snap.data().pinHash !== enteredHash) {
                if (btn) {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
                const input = document.getElementById('pinEntry');
                if (input) {
                    input.value = '';
                    input.focus();
                }
                notifyAuth('Incorrect PIN. Try again or use “Forgot PIN?” for SMS.', 'error');
                return;
            }

            const uid = snap.data().uid;
            const firebaseUser = firebase.auth().currentUser;

            if (firebaseUser && firebaseUser.uid === uid) {
                localStorage.setItem('wp_pin', enteredHash);
                this.pinVerified = true;
                this.currentUser = firebaseUser;
                await this.loadProfileAndEnter(uid);
            } else {
                // Task 1 Implementation: Try PIN login via backend if session is expired
                try {
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authorizing...';
                    const response = await fetch(PIN_LOGIN_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            phone: this._pendingPhone,
                            pin: pin
                        })
                    });

                    const result = await response.json();

                    if (response.ok && result.customToken) {
                        // Success! Session restored via JWT
                        await firebase.auth().signInWithCustomToken(result.customToken);
                        localStorage.setItem('wp_pin', enteredHash);
                        this.pinVerified = true;
                        // onAuthStateChanged will trigger loadProfileAndEnter
                    } else {
                        // Fallback to OTP if backend fails or doesn't match
                        console.warn("[WashPass] PIN backend failed:", result.error || "Unknown");
                        notifyAuth('Sending a fresh code to your phone to sign you in securely…', 'info');
                        await this.sendOTP(this._pendingPhone);
                    }
                } catch (apiErr) {
                    console.error("[WashPass] API Error:", apiErr);
                    notifyAuth('Sending a fresh code to your phone to sign you in securely…', 'info');
                    await this.sendOTP(this._pendingPhone);
                }
            }

            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        } catch (err) {
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
            console.error('[WashPass] PIN verify:', err);
            notifyAuth('Could not verify PIN. Try SMS code instead.', 'error');
        }
    },

    async loadProfileAndEnter(uid) {
        if (!uid) return;

        // Task 2: Real-time listener for Customer Profile (Subscription, Points, Name)
        this._detachProfileListener();
        this._profileUnsub = db.collection('customers').doc(uid).onSnapshot((doc) => {
            if (!doc.exists) return;
            const data = doc.data();

            // Update UI Globals
            document.querySelectorAll('.user-name').forEach((el) => {
                el.textContent = data.name || 'Welcome';
            });

            // Update Stats
            const pts = document.getElementById('statPoints');
            const wsh = document.getElementById('statWashes');
            if (pts) pts.textContent = (data.points || 0).toLocaleString();
            
            // Link to Dashboard-specific plan UI
            if (typeof updatePlanUI === 'function') {
                updatePlanUI(data);
            }

            const locText = document.getElementById('userLocationText');
            if (locText && data.location) locText.textContent = data.location;
            
            // Cache current state
            this.userData = data;
        });

        // Vehicles Listener (Subcollection)
        this._detachVehicleListener();
        this._vehicleUnsub = db.collection('customers').doc(uid).collection('vehicles').onSnapshot((snapshot) => {
            const vehicles = [];
            snapshot.forEach((d) => vehicles.push({ id: d.id, ...d.data() }));
            window.cachedVehicles = vehicles;
            if (typeof renderVehicles === 'function') renderVehicles(vehicles);
        });

        if (typeof closeAuthModal === 'function') closeAuthModal();
        if (typeof switchSection === 'function') switchSection('home');
    },

    _detachProfileListener() {
        if (this._profileUnsub) {
            this._profileUnsub();
            this._profileUnsub = null;
        }
    },

    /**
     * Task 2 & 3: Redeem a wash from subscription
     */
    async redeemWash(vehicleId, washType = 'Standard') {
        if (!this.currentUser) return;
        const uid = this.currentUser.uid;
        const sub = this.userData?.subscription;

        if (!sub || sub.status !== 'active') {
            throw new Error('No active subscription found.');
        }

        if (sub.washesRemaining <= 0 && sub.planId !== 'gold') {
            throw new Error('No washes remaining on your current plan.');
        }

        const batch = db.batch();
        const userRef = db.collection('customers').doc(uid);
        const logRef = db.collection('wash_logs').doc();

        // 1. Decrement wash count (unless unlimited/gold)
        if (sub.planId !== 'gold') {
            batch.update(userRef, {
                'subscription.washesRemaining': firebase.firestore.FieldValue.increment(-1),
                'washes': firebase.firestore.FieldValue.increment(1),
                'points': firebase.firestore.FieldValue.increment(50) // 50 pts per wash
            });
        } else {
            batch.update(userRef, {
                'washes': firebase.firestore.FieldValue.increment(1),
                'points': firebase.firestore.FieldValue.increment(150) // 3x points for Gold
            });
        }

        // 2. Create log entry
        batch.set(logRef, {
            uid,
            vehicleId,
            washType,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'completed',
            hubId: 'lekki_hub_1' // Placeholder for now
        });

        await batch.commit();
        return true;
    },

    async setupPIN(ev) {
        const pin = document.getElementById('pinSetup').value;
        if (!pin || pin.length !== PIN_LENGTH || !/^\d+$/.test(pin)) {
            notifyAuth(`Choose a ${PIN_LENGTH}-digit PIN (numbers only).`, 'error');
            return;
        }

        const btn = ev && ev.target ? ev.target.closest('button') : document.querySelector('#pin-setup-step .pay-btn');
        const originalText = btn ? btn.innerHTML : '';
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Securing...';
            btn.disabled = true;
        }

        try {
            const pinHash = await sha256(pin);
            localStorage.setItem('wp_pin', pinHash);

            if (this.currentUser && this._pendingPhone) {
                const phoneKey = this._pendingPhone.replace('+', '');
                await db.collection('phone_index').doc(phoneKey).set({
                    uid: this.currentUser.uid,
                    pinHash,
                    hasPin: true
                });
            }

            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }

            showStep('name-input-step');
            setTimeout(() => document.getElementById('profileName')?.focus(), 200);
        } catch (err) {
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
            notifyAuth('Could not save PIN. Please try again.', 'error');
        }
    },

    skipPIN() {
        showStep('name-input-step');
        setTimeout(() => document.getElementById('profileName')?.focus(), 200);
    },

    forgotPIN() {
        showStep('phone-input-step');
        if (this._pendingPhone) {
            this.sendOTP(this._pendingPhone);
        }
    },

    saveProfileName(ev) {
        if (!this.currentUser) return;
        const name = document.getElementById('profileName').value.trim();
        if (!name) {
            notifyAuth('Please enter your name.', 'error');
            return;
        }

        const btn = ev && ev.target ? ev.target.closest('button') : document.querySelector('#name-input-step .pay-btn');
        const original = btn ? btn.innerHTML : '';
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            btn.disabled = true;
        }

        db.collection('customers').doc(this.currentUser.uid).update({ name }).then(() => {
            this.currentUser.displayName = name;
            document.querySelectorAll('.user-name').forEach((el) => { el.textContent = name; });
            if (typeof closeAuthModal === 'function') closeAuthModal();
            if (typeof switchSection === 'function') switchSection('home');
        }).catch((e) => {
            notifyAuth(e.message || 'Could not save name', 'error');
        }).finally(() => {
            if (btn) {
                btn.innerHTML = original;
                btn.disabled = false;
            }
        });
    },

    restartLogin() {
        showStep('phone-input-step');
        ['welcomePhone', 'otpCode', 'pinEntry', 'pinSetup', 'profileName'].forEach((id) => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        this._pendingPhone = null;
    },

    logout() {
        this.pinVerified = false;
        this._detachVehicleListener();
        firebase.auth().signOut().then(() => {
            localStorage.removeItem('wp_pin');
            window.cachedVehicles = [];
            if (typeof switchSection === 'function') switchSection('welcome');
        });
    },

    _detachVehicleListener() {
        if (typeof this._vehicleUnsub === 'function') {
            this._vehicleUnsub();
            this._vehicleUnsub = null;
        }
    },

    comingSoon(feature) {
        notifyAuth(feature + ' is coming soon.', 'info');
    },

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
            () => {
                const locationStr = '📍 Lekki Phase 1, Lagos';
                if (textEl) textEl.textContent = locationStr;
                if (locPill) locPill.textContent = locationStr;
                if (this.currentUser && this.currentUser.uid) {
                    db.collection('customers').doc(this.currentUser.uid)
                        .update({ location: locationStr }).catch(() => {});
                }
                notifyAuth('Location synced!', 'success');
            },
            (error) => {
                const msg = error.code === error.PERMISSION_DENIED ? 'Permission Denied' : 'Location Off';
                if (textEl) textEl.textContent = msg;
                if (locPill) locPill.textContent = msg;
                notifyAuth('Location access denied.', 'error');
            }
        );
    },

    syncUserData(uid, phone) {
        this._detachVehicleListener();
        const userRef = db.collection('customers').doc(uid);

        userRef.get().then((doc) => {
            if (!doc.exists) {
                userRef.set({
                    phone,
                    points: 0,
                    washes: 0,
                    joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    status: 'active'
                });
                showStep('pin-setup-step');
                setTimeout(() => document.getElementById('pinSetup')?.focus(), 200);
            } else {
                const data = doc.data();

                const pts = document.getElementById('statPoints');
                const wsh = document.getElementById('statWashes');
                if (pts) pts.textContent = (data.points || 0).toLocaleString();
                if (wsh) wsh.textContent = (data.washes || 0).toLocaleString();

                const locPill = document.getElementById('locationsPill');
                if (locPill && data.location) locPill.textContent = data.location;
                const locText = document.getElementById('userLocationText');
                if (locText && data.location) locText.textContent = data.location;

                if (!data.name) {
                    showStep('name-input-step');
                } else {
                    if (this.currentUser) this.currentUser.displayName = data.name;
                    document.querySelectorAll('.user-name').forEach((el) => { el.textContent = data.name; });
                    if (typeof closeAuthModal === 'function') closeAuthModal();
                    if (typeof switchSection === 'function') switchSection('home');
                }
            }
        });

        this._detachVehicleListener();
        this._vehicleUnsub = db.collection('customers').doc(uid).collection('vehicles').onSnapshot((snapshot) => {
            const vehicles = [];
            snapshot.forEach((d) => vehicles.push({ id: d.id, ...d.data() }));
            window.cachedVehicles = vehicles;
            if (typeof renderVehicles === 'function') renderVehicles(vehicles);
        });
    },

    addVehicle(vehicle) {
        if (!this.currentUser) return Promise.reject(new Error('Not logged in'));
        return db.collection('customers').doc(this.currentUser.uid).collection('vehicles').add(vehicle);
    },

    getUser() {
        if (!this.currentUser && !this.pinVerified) return null;
        const user = this.currentUser || {};
        return {
            isLoggedIn: true,
            isPinned: this.pinVerified,
            uid: user.uid,
            phone: user.phoneNumber,
            name: user.displayName || 'WashPass User',
            vehicles: window.cachedVehicles || []
        };
    },

    checkAuth() {}
};

Auth.init();
window.Auth = Auth;
