/**
 * Asset Registry Module
 * 
 * Responsibilities:
 * - UUID <-> filesystem path mapping
 * - Asset validation (broken references)
 * - Automatic relinking
 * 
 * Architecture: Data Layer
 * Authority: system_architecture.md (Hybrid Asset System)
 */

// TODO: Implement AssetRegistry
// - UUID-based stable IDs
// - Filesystem mirroring (assets/<type>/<UUID>.<ext>)
// - Broken reference detection
// - Auto-relink on project load

export interface AssetReference {
    uuid: string;
    type: 'image' | 'audio' | 'video';
    path: string;              // Relative to project root
    exists: boolean;
}

export class AssetRegistry {
    // TODO: Implement per system_architecture.md
}
