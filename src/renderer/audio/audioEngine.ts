/**
 * Audio Engine (Beta-stable streaming backend)
 *
 * Uses HTMLAudioElement to avoid large in-memory decode spikes from WebAudio.
 * This is a pragmatic stability path for beta playback.
 */

export class AudioEngine {
    private loadedTracks: Map<string, HTMLAudioElement> = new Map();
    private activeTracks: Map<string, HTMLAudioElement> = new Map();
    private durations: Map<string, number> = new Map();
    private startTimes: Map<string, number> = new Map();
    private isInitialized = false;

    async initialize(): Promise<boolean> {
        this.isInitialized = true;
        return true;
    }

    async loadAudio(trackId: string, filePath: string): Promise<boolean> {
        try {
            const audio = new Audio(toFileUrl(filePath));
            audio.preload = 'metadata';

            await new Promise<void>((resolve, reject) => {
                const onLoaded = () => {
                    cleanup();
                    resolve();
                };
                const onError = () => {
                    cleanup();
                    reject(new Error(`Failed to load audio metadata: ${filePath}`));
                };
                const cleanup = () => {
                    audio.removeEventListener('loadedmetadata', onLoaded);
                    audio.removeEventListener('error', onError);
                };

                audio.addEventListener('loadedmetadata', onLoaded);
                audio.addEventListener('error', onError);
                audio.load();
            });

            this.loadedTracks.set(trackId, audio);
            this.durations.set(trackId, Number.isFinite(audio.duration) ? audio.duration : 0);
            return true;
        } catch (error) {
            console.error(`Failed to load audio ${trackId}:`, error);
            return false;
        }
    }

    isLoaded(trackId: string): boolean {
        return this.loadedTracks.has(trackId);
    }

    getDuration(trackId: string): number {
        return this.durations.get(trackId) || 0;
    }

    play(trackId: string, offset: number = 0, volume: number = 1.0): void {
        if (!this.isInitialized) return;

        const source = this.loadedTracks.get(trackId);
        if (!source) return;

        this.stop(trackId);

        const player = source.cloneNode(true) as HTMLAudioElement;
        player.volume = Math.max(0, Math.min(1, volume));

        try {
            player.currentTime = Math.max(0, offset);
        } catch {
            // Some formats/browsers can reject currentTime before enough data is buffered.
        }

        player.play().catch((error) => {
            console.warn(`Audio play failed for ${trackId}:`, error);
        });

        this.activeTracks.set(trackId, player);
        this.startTimes.set(trackId, performance.now() / 1000 - Math.max(0, offset));
    }

    stop(trackId: string): void {
        const player = this.activeTracks.get(trackId);
        if (player) {
            player.pause();
            player.src = '';
            player.load();
            this.activeTracks.delete(trackId);
            this.startTimes.delete(trackId);
        }
    }

    stopAll(): void {
        for (const trackId of this.activeTracks.keys()) {
            this.stop(trackId);
        }
    }

    getCurrentTime(trackId: string): number {
        const player = this.activeTracks.get(trackId);
        if (player) {
            return player.currentTime || 0;
        }

        const start = this.startTimes.get(trackId);
        if (start === undefined) return 0;
        return Math.max(0, performance.now() / 1000 - start);
    }

    setVolume(trackId: string, volume: number): void {
        const player = this.activeTracks.get(trackId);
        if (player) {
            player.volume = Math.max(0, Math.min(1, volume));
        }
    }

    dispose(): void {
        this.stopAll();
        this.loadedTracks.clear();
        this.activeTracks.clear();
        this.durations.clear();
        this.startTimes.clear();
        this.isInitialized = false;
    }
}

function toFileUrl(filePath: string): string {
    let normalized = filePath.replace(/\\/g, '/');
    normalized = encodeURI(normalized);

    if (/^[A-Za-z]:/.test(normalized)) {
        return `file:///${normalized}`;
    }
    return `file://${normalized}`;
}

let audioEngineInstance: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
    if (!audioEngineInstance) {
        audioEngineInstance = new AudioEngine();
    }
    return audioEngineInstance;
}
