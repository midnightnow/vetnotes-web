/**
 * test_encryption.ts
 * 
 * Verifies the ClinicalEncryptionService functionality.
 */

import { ClinicalEncryptionService } from './ClinicalEncryptionService';

async function runTest() {
    console.log("🚀 Starting Encryption Verification...");

    const secret = "CLINIC_4879_AU";
    const sensitiveData = "Patient presented with acute lethargy and vomiting in the Edmonton rail corridor.";

    try {
        // 1. Encrypt
        console.log("Encrypting sensitive clinical data...");
        const sealed = await ClinicalEncryptionService.encrypt(sensitiveData, secret);
        console.log("✅ Data Sealed. Signature:", sealed.signature);

        // 2. Decrypt
        console.log("Decrypting sealed data...");
        const decrypted = await ClinicalEncryptionService.decrypt(sealed, secret);

        if (decrypted === sensitiveData) {
            console.log("✅ Verification Success: Decrypted data matches original.");
        } else {
            console.error("❌ Verification Failure: Data mismatch.");
        }

        // 3. Tamper Test
        console.log("Testing tampering detection...");
        sealed.payload.ciphertext = btoa("TAMPERED_CONTENT");
        try {
            await ClinicalEncryptionService.decrypt(sealed, secret);
            console.error("❌ Security Failure: Tampering was not detected!");
        } catch (e) {
            console.log("✅ Security Success: Tampering detected correctly.", e.message);
        }

    } catch (error) {
        console.error("❌ Test Error:", error);
    }
}

// In a real browser environment, this would be triggered by a test runner
// runTest();
