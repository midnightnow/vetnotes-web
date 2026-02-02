import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { RedactionValidator } from '$lib/security/redactionValidator';

/**
 * POST /api/publish
 * Receives a VetNotesSafeContext, validates it, and stores it (mocked).
 */
export async function POST({ request }: RequestEvent) {
    try {
        const body = await request.json();

        // 1. Strict Validation using the deployed RedactionValidator
        try {
            RedactionValidator.strictValidate(body);
        } catch (validationError: any) {
            console.error('VetNotes Validation Failed:', validationError);
            return json(
                { error: 'Security Violation: Context rejected by RedactionValidator', details: validationError.message },
                { status: 403 }
            );
        }

        // 2. Check for simulation flag or store
        // For this demo, we'll just log it and return a success with a generated slug
        console.log('✅ Received Verified VetNote:', body.narrative.storyTitle);
        console.log('SHA Signature:', body.verification.narrativeHash);

        // Generate a random slug for the patient
        // In a real app, we'd upsert this into a database using the patientId hash as key
        const safeName = body.patientId.replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 10);
        const randomString = Math.random().toString(36).substring(2, 6);
        const patientSlug = `${safeName}-${randomString}`;

        return json({
            success: true,
            patientSlug: patientSlug,
            url: `https://vetnotes.me/patient/${patientSlug}`
        });

    } catch (error) {
        console.error('Publishing error:', error);
        return json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
