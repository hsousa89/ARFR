/**
 * Verifies the admin PIN.
 * @param {string} pin The PIN entered by the user.
 * @returns {boolean} True if the PIN is correct.
 */
function apiVerifyPin(pin) {
    // Hardcode your secret PIN here!
    const SECRET_PIN = adminPin;

    // Optional: In the future, you could read this from DB_CONFIG or Script Properties
    return pin === SECRET_PIN;
}