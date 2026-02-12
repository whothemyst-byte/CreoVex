export interface AppSettings {
    brushSizeDefault: number;
    eraserSizeDefault: number;
    defaultFps: number;
    onionSkinDefault: boolean;
    autosaveIntervalSec: number;
}

const SETTINGS_KEY = 'creovox.settings.v1';

const DEFAULT_SETTINGS: AppSettings = {
    brushSizeDefault: 4,
    eraserSizeDefault: 20,
    defaultFps: 24,
    onionSkinDefault: false,
    autosaveIntervalSec: 30
};

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return fallback;
    }
    return Math.max(min, Math.min(max, Math.round(value)));
}

function validateSettings(input: Partial<AppSettings>): AppSettings {
    return {
        brushSizeDefault: clampNumber(input.brushSizeDefault, 1, 100, DEFAULT_SETTINGS.brushSizeDefault),
        eraserSizeDefault: clampNumber(input.eraserSizeDefault, 1, 200, DEFAULT_SETTINGS.eraserSizeDefault),
        defaultFps: clampNumber(input.defaultFps, 1, 120, DEFAULT_SETTINGS.defaultFps),
        onionSkinDefault: typeof input.onionSkinDefault === 'boolean'
            ? input.onionSkinDefault
            : DEFAULT_SETTINGS.onionSkinDefault,
        autosaveIntervalSec: clampNumber(input.autosaveIntervalSec, 5, 300, DEFAULT_SETTINGS.autosaveIntervalSec)
    };
}

export function getDefaultSettings(): AppSettings {
    return { ...DEFAULT_SETTINGS };
}

export function loadSettings(): AppSettings {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) {
            return getDefaultSettings();
        }

        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        return validateSettings(parsed);
    } catch {
        return getDefaultSettings();
    }
}

export function saveSettings(settings: AppSettings): void {
    const sanitized = validateSettings(settings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(sanitized));
}
