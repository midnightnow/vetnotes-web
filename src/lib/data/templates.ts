export interface SoapTemplate {
    name: string;
    species: string[];
    subjective_prompts: string[];
    objective_checklist: string[];
}

export const SOAP_TEMPLATES: Record<string, SoapTemplate> = {
    wellness_exam: {
        name: "Wellness Examination",
        species: ["dog", "cat"],
        subjective_prompts: [
            "Activity level and behavior at home",
            "Appetite and water consumption",
            "Urination and defecation habits",
            "Any concerns from owner"
        ],
        objective_checklist: [
            "Weight and BCS",
            "Temperature, pulse, respiration",
            "Eyes, ears, nose, throat",
            "Oral exam and dental assessment",
            "Lymph nodes",
            "Heart and lung auscultation",
            "Abdominal palpation",
            "Musculoskeletal assessment",
            "Skin and coat",
            "Neurological assessment"
        ]
    },
    sick_visit: {
        name: "Sick Patient Visit",
        species: ["dog", "cat"],
        subjective_prompts: [
            "Duration and progression of symptoms",
            "Appetite changes",
            "Vomiting/diarrhea (frequency, appearance)",
            "Energy level changes",
            "Recent travel or exposure"
        ],
        objective_checklist: [
            "Vital signs",
            "Hydration status",
            "MM color and CRT",
            "Focused exam based on symptoms",
            "Pain assessment"
        ]
    },
    vaccination: {
        name: "Vaccination Visit",
        species: ["dog", "cat"],
        subjective_prompts: [
            "Previous vaccine reactions",
            "Current health status",
            "Lifestyle factors for vaccine selection"
        ],
        objective_checklist: [
            "Weight",
            "Temperature",
            "General health assessment",
            "Injection site assessment"
        ]
    },
    dental: {
        name: "Dental Procedure",
        species: ["dog", "cat"],
        subjective_prompts: [
            "Eating habits and preferences",
            "Signs of oral pain",
            "Home dental care routine",
            "Anesthetic history"
        ],
        objective_checklist: [
            "Pre-anesthetic exam",
            "Oral exam findings",
            "Dental chart completion",
            "Radiographic findings"
        ]
    },
    equine_colic: {
        name: "Equine Colic Assessment",
        species: ["equine"],
        subjective_prompts: [
            "Duration of signs",
            "Pain level description (mild/moderate/severe)",
            "Last defecation",
            "Feed/water intake",
            "History of colic",
            "De-worming history"
        ],
        objective_checklist: [
            "Heart Rate (Critical if >60bpm)",
            "Respiratory Rate",
            "Rectal Temperature",
            "Mucous Membranes & CRT",
            "Gut Sounds (4 quadrants)",
            "Digital Pulses",
            "Nasogastric Reflux (volume/character)",
            "Rectal Exam findings"
        ]
    },
    equine_lameness: {
        name: "Equine Lameness Exam",
        species: ["equine"],
        subjective_prompts: [
            "Duration of lameness",
            "Use of horse",
            "Recent shoeing history",
            "Response to rest/exercise",
            "Previous treatments and response"
        ],
        objective_checklist: [
            "Resting posture/conformation",
            "Hoof tester response",
            "Digital pulses",
            "Joint effusion/heat",
            "Flexion tests",
            "Movement assessment (walk/trot, circles)",
            "Nerve block results"
        ]
    },
    equine_wellness: {
        name: "Equine Wellness/Vaccination",
        species: ["equine"],
        subjective_prompts: [
            "Performance level",
            "Diet and parasite control",
            "Dental history",
            "Coggins status"
        ],
        objective_checklist: [
            "Physical Exam (TPR)",
            "Weight tape/BCS",
            "Ophthalmic exam",
            "Dental check",
            "Sheath cleaning needed?"
        ]
    },
    gardening_consult: {
        name: "Plants/Gardening",
        species: ["plant", "agronomy"],
        subjective_prompts: [
            "Plant spacing and location",
            "Watering frequency",
            "Soil type and recent amendments",
            "Pest or disease signs observed"
        ],
        objective_checklist: [
            "Leaf color and turgidity",
            "Stem integrity",
            "Root system (if visible)",
            "Soil moisture level",
            "Presence of vectors"
        ]
    },
    toxicology: {
        name: "Toxicology",
        species: ["any"],
        subjective_prompts: [
            "Suspected toxin identity and amount",
            "Time of ingestion/exposure",
            "Observed clinical signs (vomiting, tremors, etc.)",
            "Previous treatments administered by owner"
        ],
        objective_checklist: [
            "Neurological status",
            "Hydration and perfusion",
            "MM color and CRT",
            "Presence of vomit/diarrhea contents",
            "Heart rate and rhythm"
        ]
    },
    pathology: {
        name: "Pathology",
        species: ["any"],
        subjective_prompts: [
            "Biopsy/Sample source",
            "Duration of abnormality",
            "Growth rate / progression",
            "Systemic clinical signs"
        ],
        objective_checklist: [
            "Morphology description",
            "Sampling method (FNA, Punch, Excisional)",
            "Location and orientation",
            "Fixative used"
        ]
    },
    lesion_description: {
        name: "Lesion Description",
        species: ["any"],
        subjective_prompts: [
            "History of lesion development",
            "Pruritus level (0-10)",
            "Previous topical or systemic treatments"
        ],
        objective_checklist: [
            "Anatomical location",
            "Distribution (solitary, multifocal, diffuse)",
            "Primary lesion type (macule, papule, pustule)",
            "Secondary changes (crust, scale, alopecia)",
            "Size, color, and margin definition"
        ]
    },
    research_study: {
        name: "Clinical Research Protocol",
        species: ["any"],
        subjective_prompts: [
            "Study Phase / ID",
            "Subject Recruitment Criteria",
            "Adverse Events Reported",
            "Protocol Deviations"
        ],
        objective_checklist: [
            "Biometrics Verification",
            "Sample Collection (Blood/Urine/Tissue)",
            "Device Readings",
            "Data Integrity Check"
        ]
    },
    plant_biosecurity: {
        name: "Toxicity/Biosecurity - Plants",
        species: ["plant", "environmental"],
        subjective_prompts: [
            "Exposure to suspected toxic flora",
            "Environmental spread / contamination history",
            "Property biosecurity breach history",
            "Recent chemical or fertilizer inputs"
        ],
        objective_checklist: [
            "Phytosanitary status",
            "Leaf/Stem lesion morphology",
            "Soil/Water sample collection",
            "Vector presence (insects/fungi)",
            "CBRN / Quarantine verification"
        ]
    },
    invasive_species: {
        name: "Invasive Species",
        species: ["insect", "pest", "any"],
        subjective_prompts: [
            "Sighting location and colony density",
            "Estimated time since first appearance",
            "Environmental or agricultural impact",
            "Previous eradication attempts"
        ],
        objective_checklist: [
            "Specimen collection & verification (e.g., Fire Ants)",
            "Nest/Colony mapping",
            "Containment integrity",
            "Baiting/Treatment effectiveness",
            "Regulatory notification status"
        ]
    },
    envenomation: {
        name: "Envenomation",
        species: ["dog", "cat", "equine", "any"],
        subjective_prompts: [
            "Observed exposure to snake/spider/insect",
            "Time since exposure",
            "Type of venomous creature suspected",
            "Progression of systemic signs (collapse, vomiting)"
        ],
        objective_checklist: [
            "Neurological status (reflexes, mentation)",
            "Clotting time (e.g., Lee-White)",
            "Presence of bite marks or swelling",
            "Cardiovascular stability",
            "Urine color (hemoglobinuria/myoglobinuria)"
        ]
    }
};

export const SPECIES_PAIN_GUIDANCE = {
    feline: {
        pain_note: "Cats are masters at hiding pain. A 'normal' appearing cat may be in significant distress.",
        behavior_cues: ["Hiding more than usual", "Decreased grooming", "Change in facial expression", "Decreased appetite"],
        exam_focus: ["Facial grimace scale", "Mobility assessment", "Abdominal palpation response"]
    },
    canine: {
        pain_note: "Dogs are more expressive but may still underreport pain, especially chronic conditions.",
        behavior_cues: ["Restlessness", "Vocalization", "Guarding behavior", "Reluctance to move"],
        exam_focus: ["Gait analysis", "Palpation response", "Range of motion"]
    },
    equine: {
        pain_note: "Horses may mask pain as prey animals. Watch for subtle behavioral changes.",
        behavior_cues: ["Weight shifting", "Pawing", "Flank watching", "Decreased feed intake"],
        exam_focus: ["Heart rate", "Gut sounds", "Digital pulses", "Posture"]
    },
    avian: {
        pain_note: "Birds strongly mask illness until severely compromised. Assume worse than presented.",
        behavior_cues: ["Fluffed feathers", "Decreased vocalization", "Position on perch", "Eye closure"],
        exam_focus: ["Weight", "Keel prominence", "Respiratory effort", "Vent condition"]
    }
};
