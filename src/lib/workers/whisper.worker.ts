import { pipeline, env } from '@xenova/transformers';

// Configure environment for browser usage
// Disable local models to force CDN fetch which avoids FS errors in browser
env.allowLocalModels = false;
env.useBrowserCache = true;
// Ensure no auth token is accidentally sent for public models
// env.useAuthToken = false; // Not a standard property but good to keep in mind if using custom fetch

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let transcriber: any = null;

interface WorkerMessage {
    type: 'load' | 'transcribe';
    audio?: Float32Array;
}

self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
    const message = event.data;

    if (message.type === 'load') {
        try {
            // Using whisper-tiny.en for maximum MVP reliability and speed
            transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
            self.postMessage({ status: 'ready' });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            self.postMessage({ status: 'error', error: errorMessage });
        }
    }

    if (message.type === 'transcribe') {
        if (!transcriber) return;

        // message.audio is Float32Array
        try {
            const output = await transcriber(message.audio, {
                chunk_length_s: 30,
                stride_length_s: 5,
                language: 'english',
                task: 'transcribe',
            });

            self.postMessage({
                status: 'complete',
                text: output.text || output[0]?.text
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            self.postMessage({ status: 'error', error: errorMessage });
        }
    }
});
