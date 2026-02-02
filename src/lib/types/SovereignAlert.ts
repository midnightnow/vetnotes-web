export type ISO8601Timestamp = string;

/**
 * SOVEREIGN ALERT SCHEMA
 * A cryptographically-bound notification that orbits the clinical center.
 * 
 * DESIGN PRINCIPLES:
 * - No alert without verification (Noctua Seal)
 * - No alert without consensus (κ ≥ 0.85)
 * - No PII leakage (Scrubbed for VetNotes)
 */
export interface SovereignAlert {
    // === CORE IDENTITY ===
    alertId: string;                    // ULID (monotonic timestamp + randomness)
    patientId: string;                  // SovereignPatientContext.patientId
    timestamp: ISO8601Timestamp;        // When alert was generated
    sovereignHash: string;              // SHA-256 of entire alert + CLINICAL_SALT

    // === CLINICAL CONTEXT ===
    alertType:
    | 'PAIN_SIGNAL'
    | 'HYPOTHERMIA'
    | 'SENSOR_DEGRADATION'
    | 'VITAL_ANOMALY'
    | 'MEDICATION_RISK';

    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

    physiologicalContext: {
        // Pain Signal
        grimaceScale?: number;            // 0-4 Feline Grimace Scale
        kappaConsensus?: number;          // κ from Specialist Swarm
        observationDurationSec?: number;  // How long signal persisted

        // Hypothermia
        coreTemperatureC?: number;        // Actual temp reading
        speciesThresholdC?: number;       // Species-specific normal range
        deviationFromNorm?: number;       // Δ from expected baseline

        // Sensor Degradation
        sensorUid?: string;               // Hardware identifier
        signalLossDurationSec?: number;
        dataQualityScore?: number;        // 0.0-1.0 (1.0 = pristine)

        // Vital Anomaly
        heartRateBpm?: number;
        respiratoryRateRpm?: number;
        speciesNormRange?: { min: number; max: number };

        // Medication Risk
        drugName?: string;
        dosage?: string;
        contraindication?: string;        // e.g., "NSAID + renal impairment"
        timeSinceLastDoseMin?: number;
    };

    // === SOVEREIGN VERIFICATION LAYER ===
    verification: {
        // Source verification
        sourceSystem: 'AiVet_Watchtower' | 'GuardrailsAgent' | 'ContinuousObserver';
        sourceHash: string;               // Hash from originating system

        // Clinical validation
        kappaStability: number;           // κ ≥ 0.85 = sovereign consensus
        safetyLevel: 'VERIFIED' | 'REVIEW_REQUIRED';

        // Cryptographic chain
        parentContextHash: string;        // Links to SovereignPatientContext.sovereignHash
        alertChain: Array<{
            layer: string;                  // 'sensor' → 'watchtower' → 'aiva_triage' → 'vetsorcery'
            hash: string;
            timestamp: ISO8601Timestamp;
        }>;
    };

    // === ACTIONABLE INTELLIGENCE ===
    recommendedActions: Array<{
        action: 'NOTIFY_VET' | 'ADJUST_THERAPY' | 'REPLACE_SENSOR' | 'ESCALATE_EMERGENCY';
        priority: 1 | 2 | 3;              // 1 = immediate, 3 = routine
        clinicalRationale: string;        // "Core temp 36.8°C requires warming blanket per protocol"
        requiresAcknowledgment: boolean;  // Critical alerts MUST be acknowledged
    }>;

    // === ESCALATION STATE ===
    escalationState: {
        acknowledgedBy?: string;          // Vet UID who acknowledged
        acknowledgedAt?: ISO8601Timestamp;
        resolvedAt?: ISO8601Timestamp;
        escalationLevel: 0 | 1 | 2 | 3;   // 0 = silent → 3 = emergency dispatch
        escalationHistory: Array<{
            level: number;
            timestamp: ISO8601Timestamp;
            triggeredBy: string;            // 'time_threshold' | 'vital_deterioration' | 'manual'
        }>;
    };
}
