/**
 * Main Application Component
 * Studio-Grade Layout
 * 
 * 4-Zone Structure:
 * - Tool Rail (left): Icon-based minimal tools
 * - Canvas Stage (center): Hero drawing area
 * - Film-Strip Timeline (bottom): Cinematic frame strip
 * - Inspector Panel (right): Context-aware properties
 * 
 * Architecture: UI Layer
 * Authority: system_architecture.md, CLAUDE.md
 */

import React, { useEffect, useState } from 'react';
import DrawingCanvas from './components/DrawingCanvas';
import TimelineBar from './components/TimelineBar';
import ToolRail from './components/ToolRail';
import { useFrameState } from './state/frameState';
import { useKeyboardShortcuts } from './utils/keyboardShortcuts';
import './App.css';
import { getAudioEngine } from './audio/audioEngine';
import { exportToUSD, validateUSDExport } from './export/usdExporter';
import { exportToOTIO, validateOTIOExport } from './export/otioExporter';
import { startAutosave, stopAutosave, updateAutosavePath, triggerAutosave } from './utils/autosave';
import { logger } from './utils/logger';
import { getReadableError } from './utils/errorMessages';
import { StageNav } from './components/StageNav';
import { ScenePanel } from './components/ScenePanel';
import { ShotPanel } from './components/ShotPanel';
import { WarningToast } from './components/WarningToast';
import { StoryboardTools } from './components/StoryboardTools';
import { Stage, useNarrativeState } from '../data/narrative';

function App() {
    const {
        serializeProject,
        deserializeProject,
        clearProject,
        fps,
        maxFrames,
        addAudioTrack,
        audioTracks,
        cameraKeyframes,
        getStrokes
    } = useFrameState();
    const [saveStatus, setSaveStatus] = useState<string>('');
    const [projectPath, setProjectPath] = useState<string | undefined>(undefined);
    const [isDirty, setIsDirty] = useState<boolean>(false);
    const [warning, setWarning] = useState<string | null>(null);

    // Enable keyboard shortcuts globally
    useKeyboardShortcuts();

    // Narrative state
    const { currentStage } = useNarrativeState();

    // Initialize Wasm engine on mount
    useEffect(() => {
        // Wasm loading is optional - app works without it
        // Dynamic imports not supported in dev mode, skip for now
        // TODO: Add static Wasm bridge import when engine is ready
        console.log('ℹ️ Wasm engine integration pending');
    }, []);

    // Warning system - narrative guidance
    useEffect(() => {
        // Check narrative state
        const narrativeState = useNarrativeState.getState();
        const { scenes } = narrativeState;

        // Warning: Exporting without scenes
        if (currentStage === Stage.EditExport && scenes.length === 0) {
            setWarning('ℹ️ No scenes defined. Exporting timeline as-is without narrative metadata.');
            const timer = setTimeout(() => setWarning(null), 7000);
            return () => clearTimeout(timer);
        }
    }, [currentStage]);

    // Listen for menu commands from main process
    useEffect(() => {
        // Only set up Electron listeners if running in Electron context
        if (!window.electronAPI) {
            console.warn('Running in browser mode - Electron APIs not available');
            return;
        }

        // Use cleanup functions returned by menu listeners
        const cleanupSave = window.electronAPI.menu.onSave(() => handleSave());
        const cleanupSaveAs = window.electronAPI.menu.onSaveAs(() => handleSaveAs());
        const cleanupLoad = window.electronAPI.menu.onLoad(() => handleLoad());
        const cleanupImportAudio = window.electronAPI.menu.onImportAudio(() => handleImportAudio());
        const cleanupExportUSD = window.electronAPI.menu.onExportUSD(() => handleExportUSD());
        const cleanupExportOTIO = window.electronAPI.menu.onExportOTIO(() => handleExportOTIO());

        return () => {
            cleanupSave();
            cleanupSaveAs();
            cleanupLoad();
            cleanupImportAudio();
            cleanupExportUSD();
            cleanupExportOTIO();
        };
    }, [projectPath]); // Re-attach when projectPath changes

    // Initialize autosave system
    useEffect(() => {
        logger.info('Initializing autosave system', { projectPath });
        startAutosave(serializeProject, projectPath);

        return () => {
            logger.info('Cleaning up autosave system');
            stopAutosave();
        };
    }, []);

    // Update autosave path when project path changes
    useEffect(() => {
        updateAutosavePath(projectPath);
    }, [projectPath]);

    // Block window close if there are unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = ''; // Chrome requires returnValue to be set
                return ''; // Some browsers require a return value
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    /**
     * Save project to disk
     * If no path exists, opens Save As dialog
     */
    const handleSave = async () => {
        // TASK 2: Check if project has a path
        if (!projectPath) {
            // No path yet - this is a new project, use Save As
            await handleSaveAs();
            return;
        }

        // TASK 2: Project has a path - save directly
        try {
            setSaveStatus('Saving...');

            const snapshot = serializeProject();
            const jsonData = JSON.stringify(snapshot, null, 2);

            // TASK 4: IPC contract safety - pass explicit path
            const result = await window.electronAPI.file.saveProjectToPath(projectPath, jsonData);

            if (result.success) {
                setSaveStatus(`✓ Saved`);
                setTimeout(() => setSaveStatus(''), 2000);
                // Clear dirty flag on successful save
                setIsDirty(false);
                // Trigger autosave to update autosave file
                triggerAutosave();
            } else {
                const userMessage = getReadableError(result.error);
                setSaveStatus(`❌ ${userMessage}`);
            }
        } catch (error) {
            logger.error('Save failed', { error, projectPath });
            const userMessage = getReadableError(error);
            setSaveStatus(`❌ ${userMessage}`);
        }
    };

    /**
     * TASK 3: Save As - always prompt for path
     */
    const handleSaveAs = async () => {
        if (!window.electronAPI) {
            console.warn('SaveAs not available in browser mode');
            setSaveStatus('Save As requires Electron environment');
            return;
        }

        try {
            setSaveStatus('Save As...');

            const snapshot = serializeProject();
            const jsonData = JSON.stringify(snapshot, null, 2);

            // Open save dialog
            const result = await window.electronAPI.file.saveProject(jsonData);

            if (result.success && result.filePath) {
                // TASK 3: Store path for future saves
                setProjectPath(result.filePath);
                setSaveStatus(`✓ Saved: ${result.filePath}`);
                setTimeout(() => setSaveStatus(''), 3000);
                // Clear dirty flag on successful save
                setIsDirty(false);
                // Trigger autosave to create autosave file for this path
                triggerAutosave();
            } else if (result.canceled) {
                setSaveStatus('');
            } else {
                const userMessage = getReadableError(result.error);
                setSaveStatus(`❌ ${userMessage}`);
            }
        } catch (error) {
            logger.error('Save As failed', { error });
            const userMessage = getReadableError(error);
            setSaveStatus(`❌ ${userMessage}`);
        }
    };

    /**
     * Load project from disk
     */
    const handleLoad = async () => {
        if (!window.electronAPI) {
            console.warn('Load not available in browser mode');
            setSaveStatus('Load requires Electron environment');
            return;
        }

        try {
            setSaveStatus('Loading...');

            const result = await window.electronAPI.file.loadProject();

            if (result.success && result.data) {
                const snapshot = JSON.parse(result.data);

                // Clear existing project
                clearProject();

                // Load new project
                deserializeProject(snapshot);

                // TASK 3: Store loaded project path
                if (result.filePath) {
                    setProjectPath(result.filePath);
                }

                setSaveStatus(`✓ Loaded: ${result.filePath}`);
                setTimeout(() => setSaveStatus(''), 3000);
                // Trigger autosave for loaded project
                triggerAutosave();
            } else if (result.canceled) {
                setSaveStatus('');
            } else {
                const userMessage = getReadableError(result.error);
                setSaveStatus(`❌ ${userMessage}`);
            }
        } catch (error) {
            logger.error('Load failed', { error });
            const userMessage = getReadableError(error);
            setSaveStatus(`❌ ${userMessage}`);
        }
    };

    /**
     * Import audio file
     */
    const handleImportAudio = async () => {
        if (!window.electronAPI) {
            console.warn('Audio import not available in browser mode');
            setSaveStatus('Audio import requires Electron environment');
            return;
        }

        try {
            setSaveStatus('Importing audio...');

            const result = await window.electronAPI.audio.importAudio();

            if (result.success && result.filePath) {
                // Load audio with Web Audio API to get duration
                const { getAudioEngine } = await import('./audio/audioEngine');
                const audioEngine = getAudioEngine();

                await audioEngine.initialize();

                const trackId = `audio_${Date.now()}`;
                const loaded = await audioEngine.loadAudio(trackId, result.filePath);

                if (loaded) {
                    const durationSeconds = audioEngine.getDuration(trackId);
                    const durationFrames = Math.ceil(durationSeconds * fps);

                    // Create audio track
                    addAudioTrack({
                        id: trackId,
                        filePath: result.filePath,
                        startFrame: 1,
                        durationFrames,
                        volume: 1.0
                    });

                    setSaveStatus(`Imported: ${result.fileName} (${durationFrames} frames)`);
                    setTimeout(() => setSaveStatus(''), 3000);
                } else {
                    setSaveStatus('Failed to load audio');
                }
            } else if (result.canceled) {
                setSaveStatus('');
            } else {
                setSaveStatus(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error('Audio import failed:', error);
            setSaveStatus('Audio import failed - check console');
        }
    };

    /**
     * Export to USD (Pixar Universal Scene Description)
     */
    const handleExportUSD = async () => {
        if (!window.electronAPI) {
            console.warn('USD export not available in browser mode');
            setSaveStatus('Export requires Electron environment');
            return;
        }

        try {
            // Gather frame data
            const frameStore = new Map<number, any[]>();
            for (let i = 1; i <= maxFrames; i++) {
                const strokes = getStrokes(i);
                if (strokes && strokes.length > 0) {
                    frameStore.set(i, strokes);
                }
            }

            // Validate
            const errors = validateUSDExport({
                projectName: 'CreoVox Project',
                version: '0.1.0',
                fps,
                startFrame: 1,
                endFrame: maxFrames,
                frames: frameStore,
                cameraKeyframes
            });

            if (errors.length > 0) {
                setSaveStatus(`Export failed: ${errors.join(', ')}`);
                return;
            }

            // Select file path
            const pathResult = await window.electronAPI.export.selectUSDPath();
            if (!pathResult.success || pathResult.canceled) {
                return;
            }

            const filePath = pathResult.path!;

            // Generate USD
            const usdContent = exportToUSD({
                projectName: 'CreoVox Project',
                version: '0.1.0',
                fps,
                startFrame: 1,
                endFrame: maxFrames,
                frames: frameStore,
                cameraKeyframes
            });

            // Save
            const saveResult = await window.electronAPI.export.saveUSD(usdContent, filePath);

            if (saveResult.success) {
                setSaveStatus('USD exported successfully');
                setTimeout(() => setSaveStatus(''), 2000);
            } else {
                setSaveStatus(`Export failed: ${saveResult.error}`);
            }
        } catch (error) {
            console.error('USD export error:', error);
            setSaveStatus(`Export error: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
    };

    /**
     * Export to OTIO (OpenTimelineIO)
     */
    const handleExportOTIO = async () => {
        if (!window.electronAPI) {
            console.warn('OTIO export not available in browser mode');
            setSaveStatus('Export requires Electron environment');
            return;
        }

        try {
            // Validate
            const validation = validateOTIOExport({
                projectName: 'CreoVox Project',
                version: '0.1.0',
                fps,
                maxFrames,
                audioTracks,
                usdScenePath: '' // Will be set by user
            });

            if (validation.errors.length > 0) {
                setSaveStatus(`Export failed: ${validation.errors.join(', ')}`);
                return;
            }

            // Show warnings
            if (validation.warnings.length > 0) {
                console.warn('OTIO export warnings:', validation.warnings);
            }

            // Select file path
            const pathResult = await window.electronAPI.export.selectOTIOPath();
            if (!pathResult.success || pathResult.canceled) {
                return;
            }

            const filePath = pathResult.path!;

            // Derive USD path (same directory, different extension)
            const usdPath = filePath.replace(/\.otio$/, '.usda');

            // Generate OTIO
            const otioContent = exportToOTIO({
                projectName: 'CreoVox Project',
                version: '0.1.0',
                fps,
                maxFrames,
                audioTracks,
                usdScenePath: usdPath
            });

            // Save
            const saveResult = await window.electronAPI.export.saveOTIO(otioContent, filePath);

            if (saveResult.success) {
                setSaveStatus('OTIO exported successfully');
                setTimeout(() => setSaveStatus(''), 2000);
            } else {
                setSaveStatus(`Export failed: ${saveResult.error}`);
            }
        } catch (error) {
            console.error('OTIO export error:', error);
            setSaveStatus(`Export error: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
    };

    return (
        <div className="app-layout">
            {/* Unified Header Bar */}
            <header className="app-header">
                <div className="app-name">CreoVox</div>
                <div className="header-center">
                    <StageNav />
                </div>
                <div className="header-right">
                    {saveStatus && <span className="save-status">{saveStatus}</span>}
                </div>
            </header>

            {/* Tool Rail (left) */}
            <div className="tool-rail">
                <ToolRail />
            </div>

            {/* Narrative Panels (left sidebar - conditional) */}
            {(currentStage === Stage.Scenes || currentStage === Stage.Shots || currentStage === Stage.Storyboard) && (
                <div className="narrative-sidebar">
                    {currentStage === Stage.Scenes && <ScenePanel />}
                    {(currentStage === Stage.Shots || currentStage === Stage.Storyboard) && (
                        <>
                            <div className="sidebar-section">
                                <ScenePanel />
                            </div>
                            <div className="sidebar-section">
                                <ShotPanel />
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Canvas Stage (center hero) */}
            <div className="canvas-stage">
                <DrawingCanvas />

                {/* Storyboard Tools Overlay */}
                {currentStage === Stage.Storyboard && <StoryboardTools />}
            </div>

            {/* Timeline (bottom) */}
            <div className="timeline-container">
                <TimelineBar />
            </div>

            {/* Warning Toast */}
            {warning && (
                <WarningToast
                    message={warning}
                    onDismiss={() => setWarning(null)}
                />
            )}

            {/* Inspector Panel (right, hidden by default) */}
            <div className="inspector-panel">
                {/* TODO: Context-aware property inspector */}
            </div>
        </div>
    );
}

export default App;
