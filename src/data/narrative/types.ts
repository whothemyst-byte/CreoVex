/**
 * Narrative Spine - Core Data Models
 * 
 * Director-first workflow types for Scenes, Shots, and Script.
 * 
 * Architecture: Data Layer
 * Authority: narrative_spine_plan.md
 */

/**
 * Script Block (Optional, Lightweight)
 * Plain text only, no formatting rules
 */
export type ScriptBlock = {
    id: string;
    sceneId?: string;
    text: string;
};

/**
 * Scene (Story Container)
 * Owns Shots, defines story flow
 */
export type Scene = {
    id: string;
    name: string;
    description?: string;
    order: number;
    shots: Shot[];
};

/**
 * Shot (Director-First)
 * Owns duration, camera, and workflow state
 */
export type Shot = {
    id: string;
    sceneId: string;
    name: string;
    purpose?: string; // e.g., "Establishing", "Close-up", "Action"
    startFrame: number;
    endFrame: number;
    cameraId?: string;
    hasStoryboard: boolean;
    hasAnimation: boolean;
};

/**
 * Workflow Stage Navigation
 */
export enum Stage {
    Script = 'script',
    Scenes = 'scenes',
    Shots = 'shots',
    Storyboard = 'storyboard',
    Animation = 'animation',
    EditExport = 'edit-export'
}

/**
 * Narrative Snapshot for Serialization
 */
export interface NarrativeSnapshot {
    scenes: Scene[];
    scriptBlocks: ScriptBlock[];
}
