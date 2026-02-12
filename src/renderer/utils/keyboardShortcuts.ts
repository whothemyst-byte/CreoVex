/**
 * Keyboard Shortcut System
 * 
 * Global keyboard handler for tool activation and commands.
 * Prevents conflicts with text inputs and provides visual feedback.
 * 
 * Architecture: UI Layer
 * Authority: production_toolbar_plan.md
 */

import { useEffect } from 'react';
import { useToolState, ToolType } from '../state/toolState';
import { useFrameState } from '../state/frameState';

/**
 * Keyboard shortcut mappings
 */
const TOOL_SHORTCUTS: Record<string, ToolType> = {
    'b': 'pen',
    'e': 'eraser',
    'v': 'move',
    'l': 'lasso',
    'm': 'move',
    't': 'transform',
    'h': 'hand',
    'z': 'zoom',
};

/**
 * Check if element is text input
 */
function isTextInput(element: EventTarget | null): boolean {
    if (!element || !(element instanceof HTMLElement)) return false;
    const tagName = element.tagName.toLowerCase();
    return (
        tagName === 'input' ||
        tagName === 'textarea' ||
        element.isContentEditable
    );
}

/**
 * Hook to enable global keyboard shortcuts
 * 
 * Usage in App.tsx:
 * ```tsx
 * useKeyboardShortcuts();
 * ```
 */
export function useKeyboardShortcuts() {
    const { setTool } = useToolState();
    const {
        toggleOnionSkin,
        isPlaying,
        play,
        stop,
        nextFrame,
        previousFrame,
        addFrame,
        duplicateFrame,
    } = useFrameState();

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            // Don't interfere with text inputs
            if (isTextInput(event.target)) {
                return;
            }

            // Get the key (lowercase)
            const key = event.key.toLowerCase();

            // Tool shortcuts (single key, no modifiers)
            if (!event.ctrlKey && !event.metaKey && !event.altKey) {
                // Tool activation
                if (TOOL_SHORTCUTS[key]) {
                    event.preventDefault();
                    setTool(TOOL_SHORTCUTS[key]);
                    return;
                }

                // Timeline shortcuts
                switch (key) {
                    case ' ':
                        event.preventDefault();
                        if (isPlaying) {
                            stop();
                        } else {
                            play();
                        }
                        break;

                    case ',':
                    case '<':
                        event.preventDefault();
                        previousFrame();
                        break;

                    case '.':
                    case '>':
                        event.preventDefault();
                        nextFrame();
                        break;

                    case 'o':
                        event.preventDefault();
                        toggleOnionSkin();
                        break;

                    case 'n':
                        event.preventDefault();
                        addFrame();
                        break;

                    case 'd':
                        if (!event.shiftKey) {
                            event.preventDefault();
                            duplicateFrame();
                        }
                        break;
                }
            }

            // Shortcuts with Ctrl/Cmd are handled by App.tsx (save, load, etc.)
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setTool, toggleOnionSkin, isPlaying, play, stop, nextFrame, previousFrame, addFrame, duplicateFrame]);
}

/**
 * Get keyboard shortcut label for a tool
 */
export function getToolShortcut(tool: ToolType): string | undefined {
    for (const [key, toolType] of Object.entries(TOOL_SHORTCUTS)) {
        if (toolType === tool) {
            return key.toUpperCase();
        }
    }
    return undefined;
}
