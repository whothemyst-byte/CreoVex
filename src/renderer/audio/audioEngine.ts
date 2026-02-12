/**
 * Audio Engine
 * Web Audio API integration for playback sync
 * 
 * Responsibilities:
 * - Load audio files into AudioBuffer
 * - Play audio in sync with timeline
 * - Stop/pause/seek audio playback
 * - Provide audio clock as authoritative time source
 * 
 * Architecture: Renderer Process (Audio Layer)
 * Authority: audio_render_plan.md
 */

export class AudioEngine {
    private context: AudioContext | null = null;
    private buffers: Map<string, AudioBuffer> = new Map();
    private sources: Map<string, AudioBufferSourceNode> = new Map();
    private gainNodes: Map<string, GainNode> = new Map();
    private startTimes: Map<string, number> = new Map();
    private isInitialized = false;

    /**
     * Initialize Audio Context
     * Must be called after user interaction
     */
    async initialize(): Promise<boolean> {
        try {
            if (!this.context) {
                this.context = new AudioContext();
            }

            if (this.context.state === 'suspended') {
                await this.context.resume();
            }

            this.isInitialized = true;
            console.log('AudioEngine initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize AudioContext:', error);
            return false;
        }
    }

    /**
     * Load audio file into buffer
     * @param trackId Unique track identifier
     * @param filePath Path to audio file
     */
    async loadAudio(trackId: string, filePath: string): Promise<boolean> {
        try {
            if (!this.context) {
                await this.initialize();
            }

            if (!this.context) {
                throw new Error('AudioContext not available');
            }

            // Read file as ArrayBuffer
            const response = await fetch(`file://${filePath}`);
            const arrayBuffer = await response.arrayBuffer();

            // Decode audio data
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);

            this.buffers.set(trackId, audioBuffer);

            console.log(`Audio loaded: ${trackId}, duration: ${audioBuffer.duration}s`);
            return true;
        } catch (error) {
            console.error(`Failed to load audio ${trackId}:`, error);
            return false;
        }
    }

    /**
     * Get audio buffer duration in seconds
     */
    getDuration(trackId: string): number {
        const buffer = this.buffers.get(trackId);
        return buffer ? buffer.duration : 0;
    }

    /**
     * Play audio track from specified offset
     * @param trackId Track identifier
     * @param offset Start offset in seconds
     * @param volume Volume level (0-1)
     */
    play(trackId: string, offset: number = 0, volume: number = 1.0): void {
        if (!this.context || !this.isInitialized) {
            console.warn('AudioEngine not initialized');
            return;
        }

        const buffer = this.buffers.get(trackId);
        if (!buffer) {
            console.warn(`Audio buffer not found: ${trackId}`);
            return;
        }

        // Stop existing source if playing
        this.stop(trackId);

        // Create new source
        const source = this.context.createBufferSource();
        source.buffer = buffer;

        // Create gain node for volume control
        const gainNode = this.context.createGain();
        gainNode.gain.value = Math.max(0, Math.min(1, volume));

        // Connect: source → gain → destination
        source.connect(gainNode);
        gainNode.connect(this.context.destination);

        // Start playback
        source.start(0, offset);

        // Store references
        this.sources.set(trackId, source);
        this.gainNodes.set(trackId, gainNode);
        this.startTimes.set(trackId, this.context.currentTime - offset);
    }

    /**
     * Stop audio track
     */
    stop(trackId: string): void {
        const source = this.sources.get(trackId);
        if (source) {
            try {
                source.stop();
            } catch (error) {
                // Already stopped, ignore
            }
            this.sources.delete(trackId);
            this.gainNodes.delete(trackId);
            this.startTimes.delete(trackId);
        }
    }

    /**
     * Stop all audio tracks
     */
    stopAll(): void {
        for (const trackId of this.sources.keys()) {
            this.stop(trackId);
        }
    }

    /**
     * Get current playback time for a track
     */
    getCurrentTime(trackId: string): number {
        if (!this.context) return 0;

        const startTime = this.startTimes.get(trackId);
        if (startTime === undefined) return 0;

        return this.context.currentTime - startTime;
    }

    /**
     * Set volume for a track
     */
    setVolume(trackId: string, volume: number): void {
        const gainNode = this.gainNodes.get(trackId);
        if (gainNode) {
            gainNode.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    /**
     * Cleanup and dispose resources
     */
    dispose(): void {
        this.stopAll();
        this.buffers.clear();

        if (this.context) {
            this.context.close();
            this.context = null;
        }

        this.isInitialized = false;
    }
}

// Singleton instance
let audioEngineInstance: AudioEngine | null = null;

export function getAudioEngine(): AudioEngine {
    if (!audioEngineInstance) {
        audioEngineInstance = new AudioEngine();
    }
    return audioEngineInstance;
}

// TODO: Real-time audio scrubbing
// TODO: Audio effects (reverb, EQ)
// TODO: Multiple audio buses
// TODO: Audio fades (in/out)
// TODO: Volume automation with keyframes
