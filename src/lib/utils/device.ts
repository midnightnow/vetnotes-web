export interface DeviceMetadata {
    userAgent: string;
    language: string;
    os: string;
    platform: string;
}

export function getDeviceMetadata(): DeviceMetadata {
    if (typeof window === 'undefined') {
        return {
            userAgent: 'server',
            language: 'unknown',
            os: 'unknown',
            platform: 'unknown'
        };
    }

    const ua = window.navigator.userAgent;
    let os = "Unknown OS";
    if (ua.indexOf("Win") != -1) os = "Windows";
    if (ua.indexOf("Mac") != -1) os = "MacOS";
    if (ua.indexOf("X11") != -1) os = "UNIX";
    if (ua.indexOf("Linux") != -1) os = "Linux";
    if (ua.indexOf("Android") != -1) os = "Android";
    if (ua.indexOf("like Mac") != -1) os = "iOS";

    return {
        userAgent: ua,
        language: window.navigator.language,
        os: os,
        platform: (window.navigator as any).platform || 'unknown'
    };
}
