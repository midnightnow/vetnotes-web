export interface VetFile {
    version: "1.0";
    metadata: {
        client_id: string;
        patient_id: string;
        created_at: number;
        updated_at: number;
        author_id: string;
        clinic_id: string;
    };
    problems: ProblemItem[];
    clinical_narrative: string; // The raw or processed voice stream
    attachments: Attachment[];
}

export interface ProblemItem {
    id: string;
    title: string;
    status: "active" | "resolved" | "chronic" | "rule_out";
    soap: {
        s: KeyValueItem[];
        o: KeyValueItem[];
        a: string;
        p: PlanItem[];
    };
}

export interface KeyValueItem {
    key: string;
    value: string;
    timestamp?: number;
}

export interface PlanItem {
    type: "medication" | "diagnostic" | "procedure" | "education";
    description: string;
    status: "ordered" | "completed" | "declined";
}

export interface Attachment {
    id: string;
    type: "image" | "pdf" | "dicom" | "audio";
    uri: string;
    label: string;
}

// Helper to create a blank .vet file
export const createVetFile = (
    authorId: string = "local_user",
    clinicId: string = "default_clinic"
): VetFile => ({
    version: "1.0",
    metadata: {
        client_id: "",
        patient_id: "",
        created_at: Date.now(),
        updated_at: Date.now(),
        author_id: authorId,
        clinic_id: clinicId,
    },
    problems: [],
    clinical_narrative: "",
    attachments: [],
});
