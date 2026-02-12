/**
 * Shared TypeScript Types
 * 
 * Types used across UI, Data, and Main processes
 * 
 * Authority: All architecture specifications
 */

// UUID type (RFC 4122)
export type UUID = string;

// Frame number (1-indexed)
export type FrameNumber = number;

// Quality levels for rendering degradation
export enum QualityLevel {
    High = 0,
    Medium = 1,
    Low = 2,
    Preview = 3
}

// Blend modes for stroke compositing
export enum BlendMode {
    Normal = 'NORMAL',
    Multiply = 'MULTIPLY',
    Screen = 'SCREEN',
    Overlay = 'OVERLAY'
}

// Tool IDs
export type ToolID = 'ink_pen' | 'eraser' | 'brush';
