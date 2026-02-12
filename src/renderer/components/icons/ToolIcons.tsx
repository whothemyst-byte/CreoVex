/**
 * Tool Icon Library
 * 
 * SVG icons for all production tools.
 * All icons are 24x24 for consistency.
 * 
 * Architecture: UI Component
 * Authority: production_toolbar_plan.md
 */

import React from 'react';

interface IconProps {
    size?: number;
    className?: string;
}

// Drawing Tools

export const PenIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor" />
    </svg>
);

export const EraserIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.53a4.008 4.008 0 01-5.66 0L2.81 17c-.78-.79-.78-2.05 0-2.84l10.6-10.6c.79-.78 2.05-.78 2.83 0zM4.22 15.58l3.54 3.53c.78.79 2.04.79 2.83 0l3.53-3.53-6.36-6.36-3.54 3.53c-.78.79-.78 2.05 0 2.83z" fill="currentColor" />
    </svg>
);

export const SelectIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M3 3h4v2H5v2H3V3zm4 16H3v-4h2v2h2v2zm14-4v4h-4v-2h2v-2h2zm-2-10h2v4h-2V7h-2V5h2V3h0z" fill="currentColor" />
        <path d="M19 5v2h-2V5h2zM7 5v2H5V5h2zM5 19v-2h2v2H5zm14 0v-2h2v2h-2z" fill="currentColor" opacity="0.5" />
    </svg>
);

export const LassoIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
    </svg>
);

export const MoveIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2L8 6h3v4H7V7L3 11l4 4v-3h4v4H8l4 4 4-4h-3v-4h4v3l4-4-4-4v3h-4V6h3l-4-4z" fill="currentColor" />
    </svg>
);

export const TransformIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11c-.17-1.39-.72-2.73-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47h2.02zM13 17.9v2.02c1.39-.17 2.74-.71 3.9-1.61l-1.44-1.44c-.75.54-1.59.89-2.46 1.03zm3.89-2.42l1.42 1.41c.9-1.16 1.45-2.5 1.62-3.89h-2.02c-.14.87-.48 1.72-1.02 2.48z" fill="currentColor" />
    </svg>
);

export const HandIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M23 5.5V20c0 2.2-1.8 4-4 4h-7.3c-1.08 0-2.1-.43-2.85-1.19L1 14.83c-.48-.48-.48-1.26 0-1.74.48-.48 1.26-.48 1.74 0L7 17.33V6.5c0-.83.67-1.5 1.5-1.5S10 5.67 10 6.5v6h1.5V4c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v8.5H16V3.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v9H20V5.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5z" fill="currentColor" />
    </svg>
);

export const ZoomIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor" />
        <path d="M12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z" fill="currentColor" />
    </svg>
);

// Shot & Camera Tools

export const CameraMoveIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" fill="currentColor" />
        <path d="M12 8L8 12h3v4h2v-4h3l-4-4z" fill="currentColor" opacity="0.7" />
    </svg>
);

export const CameraZoomIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 5v2h6V5H9zM7 9H5v6h2V9zM15 19v-2H9v2h6zM17 15h2V9h-2v6z" fill="currentColor" opacity="0.6" />
        <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    </svg>
);

export const CameraKeyframeIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor" />
    </svg>
);

export const FrameRangeIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="4" y="6" width="16" height="12" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <line x1="9" y1="6" x2="9" y2="18" stroke="currentColor" strokeWidth="1.5" />
        <line x1="15" y1="6" x2="15" y2="18" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 10l-2 2 2 2M17 10l2 2-2 2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

export const ShotSplitIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1L9.64 7.64zM6 8c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm0 12c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm6-7.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5.5.22.5.5-.22.5-.5.5zM19 3l-6 6 2 2 7-7V3z" fill="currentColor" />
    </svg>
);

export const ShotMergeIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M17 20.41L18.41 19 15 15.59 13.59 17 17 20.41zM7.5 8H11v5.59L5.59 19 7 20.41l6-6V8h3.5L12 3.5 7.5 8z" fill="currentColor" />
    </svg>
);

// Timeline Tools

export const PlayIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M8 5v14l11-7z" fill="currentColor" />
    </svg>
);

export const PauseIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor" />
    </svg>
);

export const StopIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="6" y="6" width="12" height="12" fill="currentColor" />
    </svg>
);

export const NextFrameIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" fill="currentColor" />
    </svg>
);

export const PreviousFrameIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" fill="currentColor" />
    </svg>
);

export const OnionSkinIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" opacity="0.3" />
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" opacity="0.6" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
);

export const AddFrameIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="3" y="5" width="14" height="14" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M10 9v8M6 13h8" stroke="currentColor" strokeWidth="1.5" />
        <rect x="7" y="3" width="14" height="14" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4" />
    </svg>
);

export const DuplicateFrameIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="9" y="9" width="13" height="13" stroke="currentColor" strokeWidth="1.5" />
        <path d="M5 15H3a2 2 0 01-2-2V3a2 2 0 012-2h10a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

export const DeleteFrameIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor" />
    </svg>
);

export const JumpToStartIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" fill="currentColor" />
        <path d="M2 6h2v12H2V6z" fill="currentColor" opacity="0.5" />
    </svg>
);

export const JumpToEndIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M16 18h2V6h-2v12zm-3.5-6L4 6v12l8.5-6z" fill="currentColor" />
        <path d="M20 18h2V6h-2v12z" fill="currentColor" opacity="0.5" />
    </svg>
);

// Audio Tools

export const AddAudioIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6zm-2 16c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" fill="currentColor" />
        <path d="M18 11h2v2h-2v-2zm0-4h2v2h-2V7z" fill="currentColor" opacity="0.6" />
    </svg>
);

export const MuteIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" fill="currentColor" />
    </svg>
);

export const VolumeIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" fill="currentColor" />
    </svg>
);

export const AudioScrubIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z" fill="currentColor" />
        <rect x="4" y="14" width="1" height="4" fill="currentColor" opacity="0.4" />
        <rect x="18" y="10" width="1" height="8" fill="currentColor" opacity="0.4" />
        <rect x="20" y="12" width="1" height="6" fill="currentColor" opacity="0.4" />
    </svg>
);

// Navigation Tools

export const AddSceneIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" fill="currentColor" />
    </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" fill="currentColor" />
    </svg>
);

export const RenderIcon: React.FC<IconProps> = ({ size = 24, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15.01l1.41 1.41L11 14.84V19h2v-4.16l1.59 1.59L16 15.01 12.01 11 8 15.01z" fill="currentColor" />
    </svg>
);
