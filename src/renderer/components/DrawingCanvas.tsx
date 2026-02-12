/**
 * DrawingCanvas Component
 * 
 * Responsibilities:
 * - Capture pointer input (mouse/pen/touch) with pressure data
 * - Render strokes for current frame only with pressure-based width
 * - Render onion skin (adjacent frames) when enabled
 * - Store completed strokes per frame
 * - Provide visual feedback during drawing
 * - Apply camera transforms (pan/zoom) to view
 * - Clip drawing to canvas bounds
 * 
 * Architecture: UI Layer
 *  Authority: system_architecture.md (UI Layer), drawing_engine_architecture.md (stroke model)
 * 
 * INTEGRATION POINTS:
 * - ✅ PointerEvent API for pressure-sensitive input
 * - ✅ Pressure flows through: Input → Model → Wasm → Render
 * - ✅ Onion skin rendering (prev=red, next=blue, 30% opacity)
 * - ✅ Camera transforms (pan/zoom) affect all rendering
 * - TODO: Custom pressure curves per brush type
 * - TODO: Velocity + pressure interaction for dynamic width
 * - TODO: Tilt support (PointerEvent.tiltX, tiltY) for angle-aware brushes
 * - TODO: Pressure-to-width remapping UI controls
 * - TODO: Forward completed strokes to DataLayer.commitStroke()
 * - TODO: Replace canvas rendering with WebGL tessellated geometry from Wasm
 */

import React, { useRef, useEffect, useState } from 'react';
import { useFrameState, type Point, type Stroke } from '../state/frameState';
import { useToolState } from '../state/toolState';
import './DrawingCanvas.css';

// TASK 1: Canvas size & boundary
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

// TASK 3: Camera model
type Camera2D = {
    x: number;   // pan X (world coordinates)
    y: number;   // pan Y (world coordinates)
    zoom: number; // scale (1.0 = 100%)
};

// TODO: Keyframeable camera parameters
// TODO: Camera easing curves
// TODO: Multiple cameras
// TODO: USD camera export

const DrawingCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentStroke, setCurrentStroke] = useState<Point[]>([]);

    // TASK 5: Panning state (interactive only, doesn't create keyframes)
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);

    // Selection state (using frame:index as ID, e.g., "5:2" = frame 5, stroke index 2)
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
    const [selectedStrokeIds, setSelectedStrokeIds] = useState<Set<string>>(new Set());

    // TASK 4: Interactive camera position (user is currently manipulating)
    const [interactiveCamera, setInteractiveCamera] = useState<Camera2D | null>(null);

    // Tool state integration
    const { activeTool } = useToolState();

    // Frame state integration
    const {
        currentFrame,
        maxFrames,
        fps,
        onionSkinEnabled,
        isPlaying,
        playheadFrame,
        addStroke,
        getStrokes,
        setPlayheadFrame,
        stop,
        getCameraAtFrame,
        addCameraKeyframe,
        hasCameraKeyframe,
        audioTracks
    } = useFrameState();

    // Access to get() for checking state in callbacks
    const get = useFrameState.getState;

    // Last point to filter zero-movement noise
    const lastPointRef = useRef<Point | null>(null);

    // TASK 3/4: Compute effective camera (keyframed or interactive)
    const camera: Camera2D = interactiveCamera || getCameraAtFrame(currentFrame);

    // Resize canvas to fill viewport
    useEffect(() => {
        const resizeCanvas = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;

            // Keep internal canvas resolution aligned with rendered size to avoid
            // pointer-to-stroke offset caused by CSS scaling.
            const rect = canvas.getBoundingClientRect();
            canvas.width = Math.max(1, Math.round(rect.width));
            canvas.height = Math.max(1, Math.round(rect.height));
            redrawAll();
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    // Audio playback integration
    useEffect(() => {
        let audioEngine: any = null;
        let cancelled = false;

        const initAudio = async () => {
            if (!isPlaying || audioTracks.length === 0) return;

            try {
                // Snapshot play start frame to avoid restarting audio every timeline tick.
                const startFrame = useFrameState.getState().playheadFrame;

                // Dynamically import audio engine
                const { getAudioEngine } = await import('../audio/audioEngine');
                audioEngine = getAudioEngine();
                await audioEngine.initialize();

                // Play tracks active at play start
                const activeTracks = useFrameState.getState().getAudioTracksAtFrame(startFrame);
                for (const track of activeTracks) {
                    if (cancelled) return;

                    // Lazy-load track on first playback
                    if (!audioEngine.isLoaded(track.id)) {
                        const loaded = await audioEngine.loadAudio(track.id, track.filePath);
                        if (!loaded) {
                            continue;
                        }
                    }

                    const offset = (startFrame - track.startFrame) / fps;
                    audioEngine.play(track.id, offset, track.volume);
                }
            } catch (error) {
                console.error('Audio playback initialization failed:', error);
            }
        };

        initAudio();

        // Cleanup: stop all audio when playback stops
        return () => {
            cancelled = true;
            if (audioEngine) {
                audioEngine.stopAll();
            }
        };
    }, [isPlaying, audioTracks, fps]);

    // TASK 2: Playback loop using requestAnimationFrame
    useEffect(() => {
        if (!isPlaying) return;

        let lastFrameTime = performance.now();
        const frameDuration = 1000 / fps;
        let animationFrameId: number;

        const playbackLoop = (currentTime: number) => {
            const elapsed = currentTime - lastFrameTime;

            if (elapsed >= frameDuration) {
                const nextFrame = playheadFrame + 1;

                if (nextFrame > maxFrames) {
                    setPlayheadFrame(1);
                } else {
                    setPlayheadFrame(nextFrame);
                }

                lastFrameTime = currentTime;
            }

            if (get().isPlaying) {
                animationFrameId = requestAnimationFrame(playbackLoop);
            }
        };

        animationFrameId = requestAnimationFrame(playbackLoop);

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isPlaying, playheadFrame, fps, maxFrames, setPlayheadFrame]);

    // Redraw when frame changes, strokes are added, onion skin toggled, camera moves, or selection changes
    useEffect(() => {
        redrawAll();
    }, [currentFrame, currentStroke, onionSkinEnabled, camera, isSelecting, selectionEnd, selectedStrokeIds]);

    // Redraw all strokes for current frame with camera transform
    const redrawAll = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear entire viewport
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Fill background with neutral gray
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // TASK 4: Apply camera transform
        ctx.save();
        ctx.translate(-camera.x, -camera.y);
        ctx.scale(camera.zoom, camera.zoom);

        // TASK 1: Draw white canvas background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw canvas border
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 2 / camera.zoom;
        ctx.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Render onion skin if enabled (TASK 6: respects camera)
        if (onionSkinEnabled) {
            const prevFrame = currentFrame - 1;
            if (prevFrame >= 1) {
                const prevStrokes = getStrokes(prevFrame);
                if (prevStrokes.length > 0) {
                    ctx.save();
                    ctx.globalAlpha = 0.3;
                    prevStrokes.forEach(stroke => {
                        drawStrokeWithPressure(ctx, stroke, '#ff4444');
                    });
                    ctx.restore();
                }
            }

            const nextFrame = currentFrame + 1;
            if (nextFrame <= maxFrames) {
                const nextStrokes = getStrokes(nextFrame);
                if (nextStrokes.length > 0) {
                    ctx.save();
                    ctx.globalAlpha = 0.3;
                    nextStrokes.forEach(stroke => {
                        drawStrokeWithPressure(ctx, stroke, '#4444ff');
                    });
                    ctx.restore();
                }
            }
        }

        // Draw completed strokes for current frame
        const frameStrokes = getStrokes(currentFrame);
        frameStrokes.forEach((stroke, index) => {
            const strokeId = `${currentFrame}:${index}`;
            const isSelected = selectedStrokeIds.has(strokeId);

            // Draw selected strokes with blue highlight
            if (isSelected) {
                ctx.save();
                ctx.globalAlpha = 0.5;
                ctx.lineWidth = 8; // Wider highlight
                ctx.strokeStyle = '#0066ff';
                ctx.beginPath();
                stroke.forEach((point, i) => {
                    if (i === 0) ctx.moveTo(point.x, point.y);
                    else ctx.lineTo(point.x, point.y);
                });
                ctx.stroke();
                ctx.restore();
            }

            // Draw actual stroke
            drawStrokeWithPressure(ctx, stroke, isSelected ? '#0044cc' : '#1a1a1a');
        });

        // Draw current stroke (if drawing)
        if (currentStroke.length > 0) {
            drawStrokeWithPressure(ctx, currentStroke, '#000000');
        }

        // Draw selection rectangle (if selecting)
        if (isSelecting && selectionStart && selectionEnd) {
            ctx.save();
            ctx.strokeStyle = '#0066ff';
            ctx.lineWidth = 2 / camera.zoom; // Scale with zoom
            ctx.setLineDash([5 / camera.zoom, 5 / camera.zoom]);
            ctx.strokeRect(
                selectionStart.x,
                selectionStart.y,
                selectionEnd.x - selectionStart.x,
                selectionEnd.y - selectionStart.y
            );
            ctx.restore();
        }

        // Restore context
        ctx.restore();
    };

    /**
     * Convert screen coordinates to world coordinates (TASK 4)
     */
    const screenToWorld = (screenX: number, screenY: number): { x: number; y: number } => {
        return {
            x: (screenX + camera.x) / camera.zoom,
            y: (screenY + camera.y) / camera.zoom
        };
    };

    /**
     * Check if world coordinates are inside canvas bounds (TASK 2)
     */
    const isInsideCanvas = (worldX: number, worldY: number): boolean => {
        return worldX >= 0 && worldX <= CANVAS_WIDTH &&
            worldY >= 0 && worldY <= CANVAS_HEIGHT;
    };

    /**
     * Normalize pressure values
     */
    const normalizePressure = (pressure: number): number => {
        if (pressure === 0 || pressure === 0.5) {
            return 1.0;
        }
        return Math.max(0, Math.min(1, pressure));
    };

    /**
     * Draw stroke with variable width based on pressure
     */
    const drawStrokeWithPressure = (
        ctx: CanvasRenderingContext2D,
        stroke: Point[],
        color: string
    ) => {
        if (stroke.length === 0) return;

        const BASE_WIDTH = 3;
        const MIN_WIDTH = 1;

        ctx.strokeStyle = color;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 0; i < stroke.length - 1; i++) {
            const p1 = stroke[i];
            const p2 = stroke[i + 1];

            const avgPressure = (p1.pressure + p2.pressure) / 2;
            ctx.lineWidth = Math.max(MIN_WIDTH, BASE_WIDTH * avgPressure);

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
    };

    /**
     * Check if a stroke intersects with selection rectangle
     */
    const strokeIntersectsRect = (stroke: Stroke, rect: { x1: number; y1: number; x2: number; y2: number }): boolean => {
        const minX = Math.min(rect.x1, rect.x2);
        const maxX = Math.max(rect.x1, rect.x2);
        const minY = Math.min(rect.y1, rect.y2);
        const maxY = Math.max(rect.y1, rect.y2);

        // Check if any point in the stroke is within the rectangle
        return stroke.some(point =>
            point.x >= minX && point.x <= maxX &&
            point.y >= minY && point.y <= maxY
        );
    };

    /**
     * Complete selection and find strokes within bounds
     */
    const finishSelection = () => {
        if (!selectionStart || !selectionEnd) {
            setIsSelecting(false);
            return;
        }

        const rect = {
            x1: selectionStart.x,
            y1: selectionStart.y,
            x2: selectionEnd.x,
            y2: selectionEnd.y
        };

        // Find all strokes in current frame that intersect the selection
        const frameStrokes = getStrokes(currentFrame);
        const newSelection = new Set<string>();

        frameStrokes.forEach((stroke, index) => {
            if (strokeIntersectsRect(stroke, rect)) {
                const strokeId = `${currentFrame}:${index}`;
                newSelection.add(strokeId);
            }
        });

        setSelectedStrokeIds(newSelection);
        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionEnd(null);
    };

    /**
     * Finish stroke and save to frame store
     */
    const finishStroke = async () => {
        if (currentStroke.length === 0) {
            setIsDrawing(false);
            return;
        }

        try {
            const { smoothStroke } = await import('../engine/wasmBridge');
            const smoothed = smoothStroke(currentStroke);
            addStroke(currentFrame, smoothed || currentStroke);
        } catch (error) {
            console.warn('Wasm smoothing failed, using raw stroke:', error);
            addStroke(currentFrame, currentStroke);
        }

        setCurrentStroke([]);
        setIsDrawing(false);
        lastPointRef.current = null;
    };

    // TASK    // Handle pointer down (start stroke, pan, or zoom)
    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // TASK 5: Enable panning mode if Hand tool is active
        if (activeTool === 'hand') {
            setIsPanning(true);
            setPanStart({ x: e.clientX, y: e.clientY });
            canvas.setPointerCapture(e.pointerId);
            return;
        }

        // Zoom tool: Click to zoom in, Alt+Click to zoom out
        if (activeTool === 'zoom') {
            const rect = canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;

            // Get world coordinates before zoom (the point we want to zoom toward)
            const worldBefore = screenToWorld(screenX, screenY);

            // Zoom factor: Alt key = zoom out, otherwise zoom in
            const zoomDelta = e.altKey ? 0.8 : 1.25;

            setInteractiveCamera((prev: Camera2D | null) => {
                const current = prev || getCameraAtFrame(currentFrame);
                const newZoom = Math.max(0.25, Math.min(4.0, current.zoom * zoomDelta));

                // Calculate new camera position to keep the clicked point stationary
                // Formula: new camera offset = clicked point - (clicked point / new zoom) * zoom
                const newX = worldBefore.x - (worldBefore.x / newZoom) * newZoom + current.x * (newZoom / current.zoom);
                const newY = worldBefore.y - (worldBefore.y / newZoom) * newZoom + current.y * (newZoom / current.zoom);

                return {
                    x: current.x,
                    y: current.y,
                    zoom: newZoom
                };
            });

            return;
        }

        // Select tool: Start selection rectangle
        if (activeTool === 'select') {
            const rect = canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const world = screenToWorld(screenX, screenY);

            setIsSelecting(true);
            setSelectionStart(world);
            setSelectionEnd(world);
            canvas.setPointerCapture(e.pointerId);
            return;
        }

        // Don't start drawing if not using a drawing tool
        if (!['pen', 'eraser'].includes(activeTool)) {
            return;
        }

        // Stop playback on user interaction
        if (isPlaying) {
            stop();
        }

        canvas.setPointerCapture(e.pointerId);

        const rect = canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // Convert to world coordinates
        const world = screenToWorld(screenX, screenY);

        // TASK 2: Clip to canvas bounds
        if (!isInsideCanvas(world.x, world.y)) {
            return;
        }

        const point: Point = {
            x: world.x,
            y: world.y,
            pressure: normalizePressure(e.pressure)
        };

        setIsDrawing(true);
        setCurrentStroke([point]);
        lastPointRef.current = point;
    };

    // Handle pointer move
    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // TASK 5: Handle panning
        if (isPanning && panStart) {
            const deltaX = e.clientX - panStart.x;
            const deltaY = e.clientY - panStart.y;

            setInteractiveCamera((prev: Camera2D | null) => {
                const current = prev || getCameraAtFrame(currentFrame);
                return {
                    ...current,
                    x: current.x - deltaX,
                    y: current.y - deltaY
                };
            });

            setPanStart({ x: e.clientX, y: e.clientY });
            return;
        }

        // Handle selection rectangle drag
        if (isSelecting) {
            const world = screenToWorld(screenX, screenY);
            setSelectionEnd(world);
            return;
        }

        if (!isDrawing) return;

        const world = screenToWorld(screenX, screenY);

        // TASK 2: End stroke if pointer leaves canvas
        if (!isInsideCanvas(world.x, world.y)) {
            finishStroke();
            return;
        }

        const point: Point = {
            x: world.x,
            y: world.y,
            pressure: normalizePressure(e.pressure)
        };

        const last = lastPointRef.current;
        if (last) {
            const dx = point.x - last.x;
            const dy = point.y - last.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 1) {
                return;
            }
        }

        setCurrentStroke(prev => [...prev, point]);
        lastPointRef.current = point;
    };

    // Handle pointer up/leave
    const handlePointerUp = () => {
        if (isPanning) {
            setIsPanning(false);
            setPanStart(null);
            return;
        }

        if (isSelecting) {
            finishSelection();
            return;
        }

        if (isDrawing) {
            finishStroke();
        }
    };

    // TASK 5: Handle wheel for zoom
    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();

        const zoomSpeed = 0.001;
        const delta = -e.deltaY * zoomSpeed;

        setInteractiveCamera((prev: Camera2D | null) => {
            const current = prev || getCameraAtFrame(currentFrame);
            return {
                ...current,
                zoom: Math.max(0.25, Math.min(4.0, current.zoom * (1 + delta)))
            };
        });
    };

    // TASK 5: Track Space key for panning mode
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !isPanning) {
                e.preventDefault();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                setIsPanning(false);
                setPanStart(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isPanning]);

    // Determine cursor based on active tool and state
    const getCursor = () => {
        if (isPanning) return 'grabbing';
        if (activeTool === 'hand') return 'grab';
        if (activeTool === 'zoom') return 'zoom-in';
        if (['pen', 'eraser'].includes(activeTool)) return 'crosshair';
        return 'default';
    };

    return (
        <canvas
            ref={canvasRef}
            className="drawing-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            style={{ cursor: getCursor() }}
        />
    );
};

export default DrawingCanvas;
