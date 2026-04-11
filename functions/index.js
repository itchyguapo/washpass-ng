const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const crypto = require("crypto");
const cors = require("cors")({ origin: true });

admin.initializeApp();

/**
 * Normalizes phone number to phoneKey format (E.164 digits only, e.g., 2348012345678)
 */
function toPhoneKey(phone) {
    if (!phone) return "";
    return phone.replace(/\D/g, "");
}

/**
 * SHA-256 hash a string to hex (matches client-side hashing)
 */
function hashPin(pin) {
    return crypto.createHash("sha256").update(pin).digest("hex");
}

/**
 * pinLogin: Exchange phone + 6-digit PIN for a Firebase Custom Token
 * if and only if the PIN matches the stored hash in Firestore.
 */
exports.pinLogin = onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method !== "POST") {
            return res.status(405).send({ error: "Method not allowed" });
        }

        const { phone, pin } = req.body;
        
        if (!phone || !pin || pin.length !== 6) {
            return res.status(400).send({ error: "Invalid request payload" });
        }

        try {
            const phoneKey = toPhoneKey(phone);
            const pinHash = hashPin(pin);

            // 1. Lookup the phone_index document
            const snap = await admin.firestore().collection("phone_index").doc(phoneKey).get();

            if (!snap.exists) {
                // Return 401 (Unauthorized) but generic message
                return res.status(401).send({ error: "Invalid credentials" });
            }

            const data = snap.data();

            // 2. Validate PIN hash
            if (!data.hasPin || data.pinHash !== pinHash) {
                return res.status(401).send({ error: "Invalid credentials" });
            }

            // 3. Create Custom Token
            // Optional: You can add custom claims here if needed (e.g., { authMethod: 'pin' })
            const customToken = await admin.auth().createCustomToken(data.uid);

            return res.status(200).send({ customToken });

        } catch (error) {
            console.error("[WashPass] PIN Login Error:", error);
            return res.status(500).send({ error: "Internal server error" });
        }
    });
});
