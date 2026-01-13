import { pipeline, env } from '@xenova/transformers';

// Skip local model checks for now (download from HuggingFace Hub)
env.allowLocalModels = false;
env.useBrowserCache = true;

let transcriber = null;

self.addEventListener('message', async (event) => {
    const message = event.data;

    if (message.type === 'load') {
        try {
            // Use quantized distil-whisper for speed in browser
            transcriber = await pipeline('automatic-speech-recognition', 'Xenova/distil-whisper-small.en');
            self.postMessage({ status: 'ready' });
        } catch (error) {
            self.postMessage({ status: 'error', error: error.message });
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
        } catch (error) {
            self.postMessage({ status: 'error', error: error.message });
        }
    }
});
