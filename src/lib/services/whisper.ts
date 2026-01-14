// Whisper Service using Transformers.js for local browser-based transcription
import { pipeline } from '@xenova/transformers';

let whisperPipeline = null;
let isLoading = false;

export async function loadWhisper() {
    if (whisperPipeline) return whisperPipeline;
    if (isLoading) {
        // Wait for existing load to complete
        while (isLoading) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return whisperPipeline;
    }

    isLoading = true;
    try {
        // Use the tiny model for faster loading in browser
        whisperPipeline = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
            quantized: true,
        });
        return whisperPipeline;
    } catch (error) {
        console.error('Failed to load Whisper model:', error);
        throw error;
    } finally {
        isLoading = false;
    }
}

export async function transcribeAudio(audioBlob) {
    const transcriber = await loadWhisper();

    // Convert blob to array buffer
    const arrayBuffer = await audioBlob.arrayBuffer();

    // Decode audio data
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Get mono channel data
    const channelData = audioBuffer.getChannelData(0);

    // Run transcription
    const result = await transcriber(channelData, {
        chunk_length_s: 30,
        stride_length_s: 5,
        language: 'english',
        task: 'transcribe',
    });

    return result.text;
}

export function isModelLoaded() {
    return whisperPipeline !== null;
}
