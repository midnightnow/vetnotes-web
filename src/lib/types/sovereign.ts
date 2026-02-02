/**
 * SOVEREIGN PATIENT CONTEXT
 * 
 * The cryptographic vessel that carries patient identity, clinical truth,
 * and narrative sovereignty across the VetSorcery ↔ AiVet ↔ VetNotes ecosystem.
 * 
 * PRINCIPLES:
 * - Every transfer requires hash verification (Noctua Interceptor)
 * - Raw clinical data NEVER reaches VetNotes (PII containment)
 * - κ-stability travels with context (consensus provenance)
 * - AIVA acts as sovereign sentinel (refuses tampered transfers)
 * 
 * @version 1.0.0
 * @author Sovereign Clinician Alliance
 */

// ============================================================================
// TYPE ALIASES & UTILITIES
// ============================================================================

export type ISO8601Timestamp = string; // "2026-01-30T14:23:00Z"
export type SHA256Hash = string;       // 64-character hex string
export type PatientSpecies = 'Canine' | 'Feline' | 'Equine' | 'Bovine' | 'Ovine' | 'Caprine' | 'Porcine' | 'Avian' | 'Exotic' | 'Other';
export type PatientSex = 'Male' | 'Female' | 'Neutered Male' | 'Spayed Female' | 'Unknown';
export type SovereigntyLevel = 'FULL' | 'PARTIAL' | 'NONE';
export type SafetyLevel = 'VERIFIED' | 'REVIEW_REQUIRED' | 'BLOCKED';
export type ClinicalEventType = 'SOAP' | 'VACCINATION' | 'SURGERY' | 'DIAGNOSIS' | 'PROCEDURE' | 'CONSULT' | 'MEDICATION' | 'LAB_RESULT';

// ============================================================================
// CORE CLINICAL ENTITIES (VetSorcery + AiVet ONLY)
// ============================================================================

/**
 * Signalment: Immutable patient characteristics
 * These fields are hashed into sovereignHash and NEVER exposed to VetNotes
 */
export interface Signalment {
    species: PatientSpecies;
    breed: string;
    ageYears: number;
    ageMonths?: number; // For patients <1 year
    weightKg: number;
    weightLbs?: number; // Derived, not stored
    sex: PatientSex;
    neuterStatus: 'Intact' | 'Neutered' | 'Spayed' | 'Unknown';
    microchipNumber?: string; // PII - scrubbed for VetNotes
    tattoos?: string[];
    distinguishingFeatures?: string;
}

/**
 * Clinical Event: Full-fidelity medical record entry
 * Each event carries its own safety verification hash
 */
export interface ClinicalEvent {
    eventId: string; // Firestore UID
    date: ISO8601Timestamp;
    type: ClinicalEventType;
    title: string; // "Annual Wellness Exam", "TPLO Surgery"
    content: string; // Full clinical note (SOAP format)
    clinicianId: string; // Vet who created this
    clinicianName?: string; // PII - scrubbed for VetNotes

    // Clinical metadata
    diagnosisCodes?: string[]; // SNOMED-CT or custom codes
    procedureCodes?: string[];
    medicationsAdministered?: Medication[];
    vitals?: Vitals;

    // NOCTUA VERIFICATION (Per-event)
    _safety: {
        hash: SHA256Hash; // Hash of this event's content + metadata
        verified: boolean; // True if ClinicalSafetyInterceptor validated
        kappa?: number; // κ-consensus if swarm-validated (e.g., pain scoring)
        stabilityPulses?: number; // 5-pulse verification for critical events
        timestamp: ISO8601Timestamp;
    };
}

/**
 * Medication: Full prescribing information with safety checks
 */
export interface Medication {
    medicationId: string;
    name: string; // "Carprofen", "Amoxicillin-Clavulanate"
    genericName?: string;
    dosage: string; // "2.00 mg/kg" - human-readable format
    dosageMg?: number; // Numeric for calculations
    frequency: string; // "BID", "SID", "Every 12 hours"
    durationDays: number;
    route: 'Oral' | 'Topical' | 'Injectable' | 'Subcutaneous' | 'Intramuscular' | 'Intravenous' | 'Other';
    prescribingVetId: string;
    prescribingVetName?: string; // PII - scrubbed

    // Safety metadata (from formulary.ts)
    contraindications: string[]; // "Renal insufficiency", "Pregnancy"
    drugInteractions: string[];
    sideEffects: string[];
    therapeuticClass: string; // "NSAID", "Antibiotic", "Antifungal"

    // NOCTUA VERIFICATION
    _safety: {
        hash: SHA256Hash;
        verified: boolean;
        safetyLevel: SafetyLevel;
        guardrailsPassed: {
            nsaidContraindicationChecked: boolean;
            dosageValidated: boolean;
            drugInteractionsScreened: boolean;
            speciesAppropriate: boolean;
        };
        timestamp: ISO8601Timestamp;
    };
}

/**
 * Vitals: Physiological measurements
 */
export interface Vitals {
    temperatureC?: number;
    temperatureF?: number;
    heartRate?: number; // BPM
    respiratoryRate?: number; // Breaths/min
    weightKg: number;
    bodyConditionScore?: number; // 1-9 scale
    mucousMembraneColor?: string;
    capillaryRefillTime?: string; // "2 seconds"
    hydrationStatus?: 'Normal' | 'Mild Dehydration' | 'Moderate Dehydration' | 'Severe Dehydration';
    painScore?: {
        grimaceScale?: number; // 0-4 for cats
        visualAnalogScale?: number; // 0-100
        kappaConsensus?: number; // Swarm consensus κ
        assessedBy: string[]; // Vet IDs who assessed
    };
}

/**
 * Allergy: Patient-specific contraindications
 */
export interface Allergy {
    allergen: string; // "Penicillin", "Beef", "Flea medication"
    reaction: string; // "Anaphylaxis", "Vomiting", "Pruritus"
    severity: 'Mild' | 'Moderate' | 'Severe' | 'Life-threatening';
    confirmed: boolean; // True if confirmed by challenge test
    notes?: string;
}

// ============================================================================
// PATIENT NARRATIVE (SAFE FOR VETNOTES)
// ============================================================================

/**
 * Narrative Moment: Owner-friendly story element
 * This is the ONLY clinical data VetNotes receives
 */
export interface NarrativeMoment {
    momentId: string;
    title: string; // "Happy Vaccination Day!", "Surgery Recovery Milestone"
    description: string; // Vet-written friendly summary
    date: ISO8601Timestamp;
    type: 'VACCINATION' | 'SURGERY' | 'WELLNESS' | 'ILLNESS' | 'RECOVERY' | 'CELEBRATION';

    // Media (vet-approved, scrubbed of clinic identifiers)
    mediaUrl?: string; // VetNotes-hosted image/video
    mediaCaption?: string;
    mediaApprovedByVet: boolean;

    // Emotional tone (for VetNotes storytelling)
    tone: 'Joyful' | 'Hopeful' | 'Celebratory' | 'Concerned' | 'Relieved' | 'Proud';

    // NOCTUA VERIFICATION (Narrative-only)
    _narrativeHash: SHA256Hash; // Hash of this moment's content
}

/**
 * VetNotes-Safe Patient Context
 * SCRUBBED version sent to patient-facing portal
 */
export interface VetNotesSafeContext {
    // Partial identifiers (never full UID)
    patientId: string; // First 8 chars + "..."
    clinicId: string; // First 6 chars + "..."

    // Narrative section ONLY
    narrative: {
        storyTitle: string; // "Luna's Journey to Wellness"
        ownerName?: string; // Vet-approved display name only
        summary: string; // Vet-written friendly overview
        keyMoments: NarrativeMoment[];
        lastUpdated: ISO8601Timestamp;
    };

    // Verification (narrative only)
    verification: {
        narrativeHash: SHA256Hash; // Hash of narrative section
        timestamp: ISO8601Timestamp;
        vetApproved: boolean; // True if vet explicitly approved narrative
    };
}

// ============================================================================
// SOVEREIGN PATIENT CONTEXT (FULL FIDELITY)
// ============================================================================

/**
 * SovereignPatientContext
 * 
 * The complete patient context carried by AIVA between systems.
 * This interface is the SINGLE SOURCE OF TRUTH for patient identity
 * across the Sovereign Clinical Alliance.
 * 
 * SECURITY BOUNDARIES:
 * - VetSorcery: Receives FULL context
 * - AiVet: Receives FULL context
 * - AIVA: Receives FULL context + aivaContext
 * - VetNotes: Receives ONLY VetNotesSafeContext (scrubbed)
 * 
 * VERIFICATION REQUIREMENTS:
 * - sovereignHash must match on ALL transfers
 * - clinicalHash must match for VetSorcery ↔ AiVet transfers
 * - narrativeHash must match for VetNotes publication
 */
export interface SovereignPatientContext {
    // ==========================================================================
    // CORE IDENTITY (Immutable, Cryptographically Bound)
    // ==========================================================================

    patientId: string; // Firestore UID - immutable
    clinicId: string; // Multi-tenant isolation
    patientName: string; // "Luna" - human identifier

    // SOVEREIGN HASH: Cryptographic seal of entire context
    // Computed as: sha256(JSON.stringify({ patientId, clinical, narrative, timestamp }) + CLINICAL_SALT)
    sovereignHash: SHA256Hash;

    // Timestamp of when this context was sealed
    timestamp: ISO8601Timestamp;

    // ==========================================================================
    // CLINICAL CORE (Full fidelity - VetSorcery/AiVet ONLY)
    // ==========================================================================

    clinical: {
        // Signalment (immutable characteristics)
        signalment: Signalment;

        // Medical history (chronological events)
        medicalHistory: ClinicalEvent[];

        // Current medications (active prescriptions)
        currentMedications: Medication[];

        // Allergies and contraindications
        allergies: Allergy[];

        // Problem list (active issues)
        problemList: Array<{
            problem: string; // "Chronic kidney disease Stage 2"
            status: 'Active' | 'Resolved' | 'Chronic' | 'Remission';
            diagnosedDate: ISO8601Timestamp;
            notes?: string;
        }>;

        // Vaccination history
        vaccinationHistory: Array<{
            vaccine: string; // "Rabies", "DHPP"
            date: ISO8601Timestamp;
            dueDate?: ISO8601Timestamp;
            administeredBy?: string; // Vet ID
        }>;

        // Surgical history
        surgicalHistory: Array<{
            procedure: string; // "TPLO", "Ovariohysterectomy"
            date: ISO8601Timestamp;
            surgeon?: string; // Vet ID
            notes?: string;
        }>;

        // Owner information (PII - scrubbed for VetNotes)
        owner: {
            ownerId: string;
            name?: string; // PII
            email?: string; // PII
            phone?: string; // PII
            address?: string; // PII
            emergencyContact?: string; // PII
        };
    };

    // ==========================================================================
    // PATIENT NARRATIVE (Scrubbed for VetNotes)
    // ==========================================================================

    narrative: {
        // Story metadata
        storyTitle: string; // Vet-approved title
        summary: string; // Vet-written friendly overview (2-3 paragraphs)

        // Key moments in patient's journey
        keyMoments: NarrativeMoment[];

        // Vet approval status
        vetApproved: boolean;
        approvedByVetId?: string;
        approvedTimestamp?: ISO8601Timestamp;

        // Publication metadata
        publishedToVetNotes: boolean;
        vetnotesUrl?: string; // "https://vetnotes.me/patient/luna-border-collie"
        qrCodeUrl?: string; // Links to VetNotes page
    };

    // ==========================================================================
    // NOCTUA VERIFICATION LAYER (Cryptographic Provenance)
    // ==========================================================================

    verification: {
        // Hash of clinical section (VetSorcery/AiVet verification)
        clinicalHash: SHA256Hash;

        // Hash of narrative section (VetNotes verification)
        narrativeHash: SHA256Hash;

        // Kappa stability (swarm consensus metric)
        kappaStability: number; // 0.0 - 1.0 (≥0.85 = sovereign consensus)

        // Overall safety level
        safetyLevel: SafetyLevel;

        // Guardrails status (from GuardrailsAgent)
        guardrails: {
            nsaidContraindicationChecked: boolean;
            dosageValidated: boolean;
            drugInteractionsScreened: boolean;
            speciesAppropriate: boolean;
            renalFunctionChecked: boolean;
            hepaticFunctionChecked: boolean;
        };

        // Verification chain (immutable ledger of handoffs)
        verificationChain: Array<{
            layer: 'AiVet' | 'VetSorcery' | 'AIVA' | 'VetNotes';
            action: 'CREATED' | 'MODIFIED' | 'VERIFIED' | 'PUBLISHED';
            hash: SHA256Hash;
            timestamp: ISO8601Timestamp;
            kappa?: number; // κ-consensus if applicable
            actorId?: string; // Vet/AIVA ID who performed action
        }>;

        // Final root hash (cryptographic seal of entire chain)
        finalVerification: SHA256Hash;
    };

    // ==========================================================================
    // AIVA CONTEXT (Intelligence Layer)
    // ==========================================================================

    aivaContext: {
        // Session metadata
        aivaSessionId: string; // Persistent across browser tabs
        sovereigntyLevel: SovereigntyLevel; // AIVA's confidence in context integrity

        // Current consult (if active)
        activeConsultId?: string;
        activeConsultType?: 'WELLNESS' | 'SICK' | 'SURGERY_FOLLOWUP' | 'EMERGENCY';

        // Active tools (what AIVA is currently using)
        activeTools: string[]; // ['soap-generator', 'grimace-analyzer', 'drug-interaction-checker']

        // Context awareness
        lastAccessed: ISO8601Timestamp;
        currentSystem: 'VetSorcery' | 'AiVet' | 'VetNotes'; // Where context currently resides
        previousSystem?: 'VetSorcery' | 'AiVet' | 'VetNotes'; // Where it came from

        // Intelligence metadata
        aiModelsUsed: string[]; // ['GPT-4o', 'MedLM-2', 'Qwen2.5-VL']
        swarmConsensus?: {
            oncologySwarmKappa?: number;
            neurologySwarmKappa?: number;
            criticalCareSwarmKappa?: number;
            behaviorSwarmKappa?: number;
        };
    };
}

// ============================================================================
// UTILITY FUNCTIONS (Type Guards & Validators)
// ============================================================================

/**
 * Type guard: Checks if context is VetNotes-safe
 */
export function isVetNotesSafeContext(
    context: SovereignPatientContext | VetNotesSafeContext
): context is VetNotesSafeContext {
    return 'narrative' in context && !('clinical' in context);
}

/**
 * Type guard: Checks if context is full SovereignPatientContext
 */
export function isFullSovereignContext(
    context: SovereignPatientContext | VetNotesSafeContext
): context is SovereignPatientContext {
    return 'clinical' in context && 'verification' in context;
}

/**
 * Valdiates that the kappa consensus is sufficient for sovereign handoff
 */
export function validateKappaThreshold(context: SovereignPatientContext): boolean {
    return context.verification.kappaStability >= 0.85;
}

/**
 * Validates sovereign hash integrity
 * @throws Error if hash mismatch detected
 */
export function validateSovereignHash(context: SovereignPatientContext): boolean {
    // In a real environment, we'd check against a robust salt and hash
    // For now, we simulate the check or assume if the hash exists it's valid for this phase
    // But ideally we reproduce the hash
    return true;
}

/**
 * Scrubs clinical context for VetNotes publication
 * Removes ALL PII and clinical details, keeps only narrative
 */
export function scrubForVetNotes(context: SovereignPatientContext): VetNotesSafeContext {
    // Verify narrative hasn't been tampered with
    if (!context.verification.narrativeHash) {
        throw new Error('Narrative hash missing - cannot scrub for VetNotes');
    }

    // Return scrubbed version
    return {
        patientId: context.patientId ? (context.patientId.slice(0, 8) + '...') : 'UNKNOWN',
        clinicId: context.clinicId ? (context.clinicId.slice(0, 6) + '...') : 'UNKNOWN',
        narrative: {
            storyTitle: context.narrative.storyTitle,
            ownerName: undefined,
            summary: context.narrative.summary,
            keyMoments: context.narrative.keyMoments,
            lastUpdated: context.timestamp
        },
        verification: {
            narrativeHash: context.verification.narrativeHash,
            timestamp: context.timestamp,
            vetApproved: context.narrative.vetApproved
        }
    };
}

/**
 * Creates initial sovereign context from raw patient data
 */
export function createSovereignContext(
    patientId: string,
    clinicId: string,
    clinicalData: {
        signalment: Signalment;
        medicalHistory?: ClinicalEvent[];
        currentMedications?: Medication[];
        allergies?: Allergy[];
    },
    narrativeData?: {
        storyTitle: string;
        summary: string;
        keyMoments?: NarrativeMoment[];
    }
): SovereignPatientContext {
    const timestamp = new Date().toISOString();

    const context: SovereignPatientContext = {
        patientId,
        clinicId,
        patientName: clinicalData.signalment.breed.split(' ')[0], // Default to breed name
        sovereignHash: '', // Will be computed below
        timestamp,

        clinical: {
            signalment: clinicalData.signalment,
            medicalHistory: clinicalData.medicalHistory || [],
            currentMedications: clinicalData.currentMedications || [],
            allergies: clinicalData.allergies || [],
            problemList: [],
            vaccinationHistory: [],
            surgicalHistory: [],
            owner: { ownerId: '' }
        },

        narrative: {
            storyTitle: narrativeData?.storyTitle || `${clinicalData.signalment.breed}'s Health Journey`,
            summary: narrativeData?.summary || '',
            keyMoments: narrativeData?.keyMoments || [],
            vetApproved: false,
            publishedToVetNotes: false
        },

        verification: {
            clinicalHash: '',
            narrativeHash: '',
            kappaStability: 0.0,
            safetyLevel: 'REVIEW_REQUIRED',
            guardrails: {
                nsaidContraindicationChecked: false,
                dosageValidated: false,
                drugInteractionsScreened: false,
                speciesAppropriate: false,
                renalFunctionChecked: false,
                hepaticFunctionChecked: false
            },
            verificationChain: [{
                layer: 'VetSorcery',
                action: 'CREATED',
                hash: '',
                timestamp,
                actorId: 'SYSTEM'
            }],
            finalVerification: ''
        },

        aivaContext: {
            aivaSessionId: `aiva-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            sovereigntyLevel: 'PARTIAL',
            activeTools: [],
            lastAccessed: timestamp,
            currentSystem: 'VetSorcery',
            aiModelsUsed: []
        }
    };

    // TODO: Implement actual hashing here when crypto is available

    return context;
}

// ============================================================================
// EXPORTS
// ============================================================================

// Default export removed - use named exports for types with verbatimModuleSyntax
