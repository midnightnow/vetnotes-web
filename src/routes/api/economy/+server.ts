import { json } from '@sveltejs/kit';
import { spawn } from 'child_process';
import type { RequestHandler } from './$types';

// Configuration from environment
const HARDCARD_SCRIPT_PATH = process.env.HARDCARD_SCRIPT_PATH || '/Users/studio/00 Constellation/hardcard/simulate_economy.py';
const PYTHON_EXECUTABLE = process.env.PYTHON_EXECUTABLE || 'python3';
const API_TIMEOUT_MS = parseInt(process.env.API_TIMEOUT_MS || '5000');
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3');

// Circuit breaker state
let failureCount = 0;
let lastFailureTime = 0;
const CIRCUIT_BREAKER_THRESHOLD = parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '5');
const CIRCUIT_BREAKER_RESET_MS = 60000; // 1 minute

interface EconomyRequest {
    isSacred?: boolean;
}

interface EconomyResponse {
    status: string;
    is_sacred?: boolean;
    settlement?: {
        buyer: string;
        worker: string;
        amount: string;
        payout: string;
        tax: string;
    };
    treasury?: {
        reserve: string;
        verified: boolean;
    };
    economy?: {
        inflation_rate: string;
        entropy_volatility: string;
    };
}

export const POST: RequestHandler = async ({ request }) => {
    // Parse request body with validation
    let requestData: EconomyRequest;
    try {
        requestData = await request.json();
    } catch (e) {
        return json({ error: 'Invalid request body', details: 'Expected JSON' }, { status: 400 });
    }

    const { isSacred = false } = requestData;

    // Circuit breaker check
    const now = Date.now();
    if (failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
        if (now - lastFailureTime < CIRCUIT_BREAKER_RESET_MS) {
            return json(
                {
                    error: 'Circuit breaker open',
                    details: 'Too many recent failures. Please try again later.',
                    retry_after: Math.ceil((CIRCUIT_BREAKER_RESET_MS - (now - lastFailureTime)) / 1000)
                },
                { status: 503 }
            );
        } else {
            // Reset circuit breaker
            failureCount = 0;
        }
    }

    // Validate script path exists
    try {
        const { access } = await import('fs/promises');
        await access(HARDCARD_SCRIPT_PATH);
    } catch (e) {
        console.error(`Hardcard script not found at: ${HARDCARD_SCRIPT_PATH}`);
        return json(
            { error: 'Configuration error', details: 'Economic simulation script not found' },
            { status: 500 }
        );
    }

    return new Promise((resolve) => {
        const args = [HARDCARD_SCRIPT_PATH, '--json'];
        if (isSacred) args.push('--sacred');

        const pythonProcess = spawn(PYTHON_EXECUTABLE, args);

        let stdoutData = '';
        let stderrData = '';
        let timeoutId: NodeJS.Timeout;

        // Timeout handler
        timeoutId = setTimeout(() => {
            pythonProcess.kill();
            failureCount++;
            lastFailureTime = Date.now();

            console.error(`Economy simulation timeout after ${API_TIMEOUT_MS}ms`);
            resolve(json(
                {
                    error: 'Simulation timeout',
                    details: `Process exceeded ${API_TIMEOUT_MS}ms limit`
                },
                { status: 504 }
            ));
        }, API_TIMEOUT_MS);

        pythonProcess.stdout.on('data', (data) => {
            stdoutData += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            stderrData += data.toString();
        });

        pythonProcess.on('close', (code) => {
            clearTimeout(timeoutId);

            if (code !== 0) {
                failureCount++;
                lastFailureTime = Date.now();

                console.error(`Economy simulation failed with code ${code}`);
                console.error('STDERR:', stderrData);

                resolve(json(
                    {
                        error: 'Simulation failed',
                        details: stderrData || 'Unknown error',
                        exit_code: code
                    },
                    { status: 500 }
                ));
                return;
            }

            // Parse the JSON output
            try {
                const jsonMatch = stdoutData.match(/__JSON_START__\n([\s\S]*?)\n__JSON_END__/);
                if (jsonMatch && jsonMatch[1]) {
                    const parsed: EconomyResponse = JSON.parse(jsonMatch[1]);

                    // Validate response schema
                    if (!parsed.status) {
                        throw new Error('Missing status field in response');
                    }

                    // Reset failure count on success
                    failureCount = Math.max(0, failureCount - 1);

                    resolve(json(parsed));
                } else {
                    throw new Error('JSON markers not found in output');
                }
            } catch (e) {
                failureCount++;
                lastFailureTime = Date.now();

                console.error('Failed to parse simulation output:', e);
                console.error('Raw output:', stdoutData);

                resolve(json(
                    {
                        error: 'Failed to parse simulation output',
                        details: e instanceof Error ? e.message : 'Unknown parsing error',
                        raw: stdoutData.substring(0, 500) // Truncate for safety
                    },
                    { status: 500 }
                ));
            }
        });

        pythonProcess.on('error', (err) => {
            clearTimeout(timeoutId);
            failureCount++;
            lastFailureTime = Date.now();

            console.error('Failed to spawn Python process:', err);
            resolve(json(
                {
                    error: 'Failed to start simulation',
                    details: err.message
                },
                { status: 500 }
            ));
        });
    });
};
