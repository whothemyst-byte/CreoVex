/**
 * Tool State Management
 * 
 * Centralized Zustand store for tool selection and configuration.
 * Only one primary tool can be active at a time.
 * 
 * Architecture: UI State Layer
 * Authority: production_toolbar_plan.md
 */

import { create } from 'zustand';

/**
 * All available tool types in CreoVox
 */
export type ToolType =
    // Drawing Tools
    | 'pen'
    | 'eraser'
    | 'select'
    | 'lasso'
    | 'move'
    | 'transform'
    | 'hand'
    | 'zoom'
    // Shot & Camera Tools
    | 'cameraMove'
    | 'cameraZoom'
    | 'cameraKeyframe'
    | 'frameRange'
    | 'shotSplit'
    | 'shotMerge'
    // No tool selected
    | 'none';

interface ToolState {
    // Active tool
    activeTool: ToolType;

    // Tool configuration
    brushSize: number;
    eraserSize: number;

    // Tool actions
    setTool: (tool: ToolType) => void;
    setBrushSize: (size: number) => void;
    setEraserSize: (size: number) => void;
}

/**
 * Tool State Store
 * 
 * Usage:
 * ```tsx
 * const { activeTool, setTool } = useToolState();
 * 
 * <button onClick={() => setTool('pen')}>Pen</button>
 * ```
 */
export const useToolState = create<ToolState>((set) => ({
    // Default state
    activeTool: 'pen',
    brushSize: 4,
    eraserSize: 20,

    // Actions
    setTool: (tool) => set({ activeTool: tool }),
    setBrushSize: (size) => set({ brushSize: Math.max(1, Math.min(100, size)) }),
    setEraserSize: (size) => set({ eraserSize: Math.max(1, Math.min(200, size)) }),
}));
