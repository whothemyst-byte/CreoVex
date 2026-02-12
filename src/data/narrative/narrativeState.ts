/**
 * Narrative State Management
 * 
 * Zustand store for Scenes, Shots, Script, and Stage navigation.
 * 
 * Architecture: Data Layer
 * Authority: narrative_spine_plan.md
 */

import { create } from 'zustand';
import { Scene, Shot, ScriptBlock, Stage, NarrativeSnapshot } from './types';

interface NarrativeState {
    // ===== Data =====
    scenes: Scene[];
    scriptBlocks: ScriptBlock[];
    currentStage: Stage;
    selectedSceneId?: string;
    selectedShotId?: string;

    // ===== Scene Actions =====
    addScene: (name: string, description?: string) => void;
    removeScene: (id: string) => void;
    renameScene: (id: string, name: string, description?: string) => void;
    reorderScenes: (sceneIds: string[]) => void;

    // ===== Shot Actions =====
    addShot: (sceneId: string, shot: Omit<Shot, 'id' | 'sceneId'>) => void;
    removeShot: (shotId: string) => void;
    updateShot: (shotId: string, updates: Partial<Shot>) => void;
    getShotById: (shotId: string) => Shot | undefined;

    // ===== Script Actions =====
    addScriptBlock: (text: string, sceneId?: string) => void;
    removeScriptBlock: (id: string) => void;
    updateScriptBlock: (id: string, text: string) => void;

    // ===== Navigation Actions =====
    setStage: (stage: Stage) => void;
    selectScene: (id?: string) => void;
    selectShot: (id?: string) => void;

    // ===== Serialization =====
    serialize: () => NarrativeSnapshot;
    deserialize: (snapshot: NarrativeSnapshot) => void;
    reset: () => void;
}

export const useNarrativeState = create<NarrativeState>((set, get) => ({
    // Initial state
    scenes: [],
    scriptBlocks: [],
    currentStage: Stage.Animation, // Default to animation (backward compatible)
    selectedSceneId: undefined,
    selectedShotId: undefined,

    // ===== Scene Actions =====

    addScene: (name, description) => {
        const newScene: Scene = {
            id: `scene-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            description,
            order: get().scenes.length,
            shots: []
        };
        set(state => ({
            scenes: [...state.scenes, newScene]
        }));
    },

    removeScene: (id) => {
        set(state => ({
            scenes: state.scenes.filter(s => s.id !== id),
            selectedSceneId: state.selectedSceneId === id ? undefined : state.selectedSceneId,
            selectedShotId: undefined // Clear shot selection when scene removed
        }));
    },

    renameScene: (id, name, description) => {
        set(state => ({
            scenes: state.scenes.map(s =>
                s.id === id ? { ...s, name, description } : s
            )
        }));
    },

    reorderScenes: (sceneIds) => {
        const sceneMap = new Map(get().scenes.map(s => [s.id, s]));
        const reorderedScenes = sceneIds
            .map((id, index) => {
                const scene = sceneMap.get(id);
                return scene ? { ...scene, order: index } : null;
            })
            .filter((s): s is Scene => s !== null);

        set({ scenes: reorderedScenes });
    },

    // ===== Shot Actions =====

    addShot: (sceneId, shotData) => {
        const newShot: Shot = {
            id: `shot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sceneId,
            ...shotData
        };

        set(state => ({
            scenes: state.scenes.map(scene =>
                scene.id === sceneId
                    ? { ...scene, shots: [...scene.shots, newShot] }
                    : scene
            )
        }));
    },

    removeShot: (shotId) => {
        set(state => ({
            scenes: state.scenes.map(scene => ({
                ...scene,
                shots: scene.shots.filter(shot => shot.id !== shotId)
            })),
            selectedShotId: state.selectedShotId === shotId ? undefined : state.selectedShotId
        }));
    },

    updateShot: (shotId, updates) => {
        set(state => ({
            scenes: state.scenes.map(scene => ({
                ...scene,
                shots: scene.shots.map(shot =>
                    shot.id === shotId ? { ...shot, ...updates } : shot
                )
            }))
        }));
    },

    getShotById: (shotId) => {
        const scenes = get().scenes;
        for (const scene of scenes) {
            const shot = scene.shots.find(s => s.id === shotId);
            if (shot) return shot;
        }
        return undefined;
    },

    // ===== Script Actions =====

    addScriptBlock: (text, sceneId) => {
        const newBlock: ScriptBlock = {
            id: `script-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sceneId,
            text
        };
        set(state => ({
            scriptBlocks: [...state.scriptBlocks, newBlock]
        }));
    },

    removeScriptBlock: (id) => {
        set(state => ({
            scriptBlocks: state.scriptBlocks.filter(b => b.id !== id)
        }));
    },

    updateScriptBlock: (id, text) => {
        set(state => ({
            scriptBlocks: state.scriptBlocks.map(b =>
                b.id === id ? { ...b, text } : b
            )
        }));
    },

    // ===== Navigation Actions =====

    setStage: (stage) => {
        set({ currentStage: stage });
    },

    selectScene: (id) => {
        set({
            selectedSceneId: id,
            selectedShotId: undefined // Clear shot when changing scenes
        });
    },

    selectShot: (id) => {
        set({ selectedShotId: id });
    },

    // ===== Serialization =====

    serialize: () => {
        const state = get();
        return {
            scenes: state.scenes,
            scriptBlocks: state.scriptBlocks
        };
    },

    deserialize: (snapshot) => {
        set({
            scenes: snapshot.scenes || [],
            scriptBlocks: snapshot.scriptBlocks || [],
            selectedSceneId: undefined,
            selectedShotId: undefined,
            currentStage: Stage.Animation // Reset to animation stage
        });
    },

    reset: () => {
        set({
            scenes: [],
            scriptBlocks: [],
            selectedSceneId: undefined,
            selectedShotId: undefined,
            currentStage: Stage.Animation
        });
    }
}));
