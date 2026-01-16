/**
 * Sound and Haptic Service
 * Orchestrates the "Magical" feedback for the viral loop.
 */

export const playSound = (type: 'scan' | 'success_low' | 'success_high') => {
    // CDN links to high-quality UI sounds
    const sounds = {
        scan: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
        success_low: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
        success_high: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3'
    };

    const audio = new Audio(sounds[type]);
    audio.volume = 0.5;
    audio.play().catch(e => console.warn("Audio play blocked", e));
};

export const triggerHaptic = (severity: 'light' | 'heavy') => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        if (severity === 'heavy') {
            navigator.vibrate([100, 50, 100, 50, 200]);
        } else {
            navigator.vibrate(50);
        }
    }
};
