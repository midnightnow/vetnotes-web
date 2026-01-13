class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.bufferSize = 4096;
        this.buffer = new Float32Array(this.bufferSize);
        this.bytesWritten = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (!input || input.length === 0) return true;

        const channelData = input[0];

        // We just pass the raw float32 data back to the main thread
        // The main thread (or another worker) will handle downsampling if needed
        // But for optimized Whisper, we usually want 16kHz mono.
        // Since AudioWorklet runs at system sample rate, we might need to buffer.

        // For MVP, we send chunks.
        this.port.postMessage(channelData);

        return true;
    }
}

registerProcessor('audio-processor', AudioProcessor);
