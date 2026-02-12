/**
 * Autosave System
 * 
 * Provides automatic and event-triggered project saving to prevent data loss.
 * 
 * Features:
 * - Timer-based autosave (30 seconds)
 * - Event-triggered autosave (strokes, frames, camera)
 * - Pauses during render/export operations
 * - Silent operation (no UI spam)
 * - Separate .autosave file (never overwrites main project)
 */

import { logger } from './logger';
import { getReadableError } from './errorMessages';

// Type for the function that gets current project data
type ProjectDataGetter = () => any;

// Autosave state
let autosaveTimer: NodeJS.Timeout | null = null;
let isPaused = false;
let currentProjectPath: string | undefined;
let getProjectData: ProjectDataGetter | null = null;
let lastAutosaveTime = 0;

// Autosave interval (30 seconds)
const AUTOSAVE_INTERVAL_MS = 30 * 1000;

// Minimum time between autosaves (prevent spam)
const MIN_AUTOSAVE_INTERVAL_MS = 5 * 1000;

/**
 * Start autosave system
 * 
 * @param dataGetter - Function that returns current project data
 * @param projectPath - Optional project file path (if project is saved)
 */
export function startAutosave(dataGetter: ProjectDataGetter, projectPath?: string): void {
    logger.info('Starting autosave system', { projectPath });

    getProjectData = dataGetter;
    currentProjectPath = projectPath;

    // Clear any existing timer
    if (autosaveTimer) {
        clearInterval(autosaveTimer);
    }

    // Start 30-second autosave timer
    autosaveTimer = setInterval(() => {
        if (!isPaused) {
            performAutosave();
        }
    }, AUTOSAVE_INTERVAL_MS);
}

/**
 * Stop autosave system (cleanup)
 */
export function stopAutosave(): void {
    logger.info('Stopping autosave system');

    if (autosaveTimer) {
        clearInterval(autosaveTimer);
        autosaveTimer = null;
    }

    getProjectData = null;
    currentProjectPath = undefined;
}

/**
 * Pause autosave (e.g., during render/export)
 */
export function pauseAutosave(): void {
    logger.info('Autosave paused');
    isPaused = true;
}

/**
 * Resume autosave
 */
export function resumeAutosave(): void {
    logger.info('Autosave resumed');
    isPaused = false;
}

/**
 * Manually trigger autosave (for event-based saving)
 * 
 * This is called after important events like:
 * - Stroke committed
 * - Frame changed
 * - Camera keyframe edited
 */
export function triggerAutosave(): void {
    if (isPaused) {
        logger.info('Autosave triggered but paused, skipping');
        return;
    }

    // Debounce: don't autosave too frequently
    const now = Date.now();
    if (now - lastAutosaveTime < MIN_AUTOSAVE_INTERVAL_MS) {
        logger.info('Autosave triggered but too soon, skipping');
        return;
    }

    performAutosave();
}

/**
 * Update project path (when user saves or loads)
 */
export function updateAutosavePath(projectPath: string | undefined): void {
    logger.info('Autosave path updated', { projectPath });
    currentProjectPath = projectPath;
}

/**
 * Perform the actual autosave operation
 */
async function performAutosave(): Promise<void> {
    // Guard: Electron API must be available
    if (!window.electronAPI) {
        logger.warn('Autosave skipped: Electron API not available (browser mode)');
        return;
    }

    // Guard: Project must have a path  
    if (!currentProjectPath) {
        logger.info('Autosave skipped: No project path set');
        return;
    }

    if (!getProjectData) {
        logger.warn('Autosave attempted but no data getter registered');
        return;
    }

    try {
        lastAutosaveTime = Date.now();

        // Get current project data
        const projectData = getProjectData();
        const jsonData = JSON.stringify(projectData, null, 2);

        // Determine autosave path
        const autosavePath = getAutosavePath();

        // Save to autosave file
        const result = await window.electronAPI.file.saveProjectToPath(autosavePath, jsonData);

        if (result.success) {
            logger.info('Autosave successful', { path: autosavePath, size: jsonData.length });
        } else {
            logger.error('Autosave failed', { error: result.error });
        }
    } catch (error) {
        logger.error('Autosave error', { error: getReadableError(error) });
    }
}

/**
 * Get autosave file path
 * 
 * If project has been saved: <projectPath>.autosave
 * If new project: temp directory autosave
 */
function getAutosavePath(): string {
    if (currentProjectPath) {
        // Saved project: append .autosave to the project path
        return `${currentProjectPath}.autosave`;
    } else {
        // New unsaved project: use temp directory
        // Format: creovox_autosave_<timestamp>.creovox.autosave
        const timestamp = Date.now();
        return `creovox_autosave_${timestamp}.creovox.autosave`;
    }
}
