import { writable } from 'svelte/store';
import { StateSigner } from '../security/StateSigner';

export interface ExamSession {
    sessionId: string;
    studentId: string;
    startTime: Date;
    endTime: Date;
    currentCase: number; // 1-10
    completedCases: number[];
    status: 'active' | 'paused' | 'completed' | 'failed' | 'integrity_failure';
    lastAutoSave: number;
}

function createExamStore() {
    const initialState: ExamSession = {
        sessionId: '',
        studentId: '',
        startTime: new Date(),
        endTime: new Date(Date.now() + 180 * 60 * 1000), // 3 hours
        currentCase: 1,
        completedCases: [],
        status: 'active',
        lastAutoSave: Date.now()
    };

    const { subscribe, set, update } = writable<ExamSession>(initialState);

    return {
        subscribe,
        startSession: (studentId: string) => {
            const sessionId = `exam_${Date.now()}_${studentId}`;
            const state: ExamSession = {
                ...initialState,
                sessionId,
                studentId,
                startTime: new Date(),
                endTime: new Date(Date.now() + 180 * 60 * 1000)
            };
            set(state);
            saveToLocal(state);
        },
        nextCase: () => {
            update(state => {
                if (state.currentCase < 10) {
                    const newState = {
                        ...state,
                        completedCases: [...state.completedCases, state.currentCase],
                        currentCase: state.currentCase + 1,
                        lastAutoSave: Date.now()
                    };
                    saveToLocal(newState);
                    return newState;
                }
                return state;
            });
        },
        completeExam: () => {
            update(state => {
                const newState = { ...state, status: 'completed' as const };
                saveToLocal(newState);
                return newState;
            });
        },
        restore: async () => {
            if (typeof window !== 'undefined') {
                const saved = localStorage.getItem('valleyvet_exam_session_secure');
                if (saved) {
                    try {
                        const envelope = JSON.parse(saved);
                        const data = await StateSigner.open(envelope);

                        if (data) {
                            // Revive dates (which became strings in JSON)
                            data.startTime = new Date(data.startTime);
                            data.endTime = new Date(data.endTime);
                            set(data);
                        } else {
                            // Integrity failure detected
                            update(s => ({ ...s, status: 'integrity_failure' }));
                            console.error("⚠️ SECURITY ALERT: Exam session signature mismatch. State reset.");
                        }
                    } catch (e) {
                        console.error("Failed to restore exam session", e);
                    }
                }
            }
        }
    };
}

async function saveToLocal(state: ExamSession) {
    if (typeof window !== 'undefined') {
        try {
            // Seal the state with a cryptographic signature
            const envelope = await StateSigner.seal(state);
            localStorage.setItem('valleyvet_exam_session_secure', JSON.stringify(envelope));
        } catch (e) {
            console.error("Failed to secure exam state", e);
        }
    }
}

export const examSession = createExamStore();
