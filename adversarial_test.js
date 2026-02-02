/**
 * adversarial_test.js
 * 
 * Simulates a 'Save-Scumming' attack on the Valley Vet Exam Session.
 * Verifies that the StateSigner correctly detects and rejects tampered data.
 */

import { StateSigner } from './src/lib/security/StateSigner';

async function runTest() {
    console.log("🛡️ Starting Adversarial Stress Test on Integrity Shield...");

    const validState = {
        sessionId: "test_session_123",
        currentCase: 2,
        completedCases: [1],
        status: "active"
    };

    // 1. Seal a valid state
    const envelope = await StateSigner.seal(validState);
    console.log("✅ Sealed valid state.");

    // 2. Verify valid state
    const verified = await StateSigner.open(envelope);
    if (verified) {
        console.log("✅ Verified valid signature.");
    } else {
        console.error("❌ FAILED: Valid signature rejected.");
        process.exit(1);
    }

    // 3. TAMPER: Attempt to skip to case 10
    console.log("😈 Attempting TAMPER: Increasing case count manually...");
    envelope.payload.currentCase = 10;
    envelope.payload.completedCases = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    // 4. Verify tampered state
    const tampered = await StateSigner.open(envelope);
    if (tampered === null) {
        console.log("🛡️ SUCCESS: Integrity violation detected! Tampered data rejected.");
    } else {
        console.error("❌ CRITICAL FAILURE: Tampered state was accepted!");
        process.exit(1);
    }

    console.log("\n🏆 Adversarial Stress Test: PASSED");
}

runTest().catch(console.error);
