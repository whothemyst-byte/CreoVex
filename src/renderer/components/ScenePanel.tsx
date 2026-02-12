/**
 * Scene Panel Component
 * 
 * Displays list of scenes, allows scene management.
 * Visible in Scenes, Shots, and Storyboard stages.
 * 
 * Architecture: UI Layer
 * Authority: narrative_spine_plan.md Part 3
 */

import React, { useState } from 'react';
import { useNarrativeState } from '../../data/narrative';
import './ScenePanel.css';

export function ScenePanel() {
    const {
        scenes,
        selectedSceneId,
        addScene,
        removeScene,
        renameScene,
        selectScene
    } = useNarrativeState();

    const [isAddingScene, setIsAddingScene] = useState(false);
    const [newSceneName, setNewSceneName] = useState('');
    const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    const handleAddScene = () => {
        if (newSceneName.trim()) {
            addScene(newSceneName.trim());
            setNewSceneName('');
            setIsAddingScene(false);
        }
    };

    const handleRenameScene = (sceneId: string) => {
        if (editName.trim()) {
            renameScene(sceneId, editName.trim());
            setEditingSceneId(null);
            setEditName('');
        }
    };

    const startEdit = (sceneId: string, currentName: string) => {
        setEditingSceneId(sceneId);
        setEditName(currentName);
    };

    return (
        <div className="scene-panel">
            <div className="panel-header">
                <h3>Scenes</h3>
                <button
                    onClick={() => setIsAddingScene(true)}
                    className="add-button"
                    title="Add Scene"
                >
                    + Add
                </button>
            </div>

            <ul className="scene-list">
                {isAddingScene && (
                    <li className="scene-item adding">
                        <input
                            type="text"
                            value={newSceneName}
                            onChange={(e) => setNewSceneName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddScene();
                                if (e.key === 'Escape') {
                                    setIsAddingScene(false);
                                    setNewSceneName('');
                                }
                            }}
                            placeholder="Scene name..."
                            autoFocus
                            className="scene-input"
                        />
                        <button onClick={handleAddScene} className="confirm-button">✓</button>
                        <button
                            onClick={() => {
                                setIsAddingScene(false);
                                setNewSceneName('');
                            }}
                            className="cancel-button"
                        >
                            ✕
                        </button>
                    </li>
                )}

                {scenes.length === 0 && !isAddingScene && (
                    <li className="scene-item empty">
                        <span className="empty-message">No scenes yet. Add one to get started!</span>
                    </li>
                )}

                {scenes.map((scene) => (
                    <li
                        key={scene.id}
                        className={`scene-item ${selectedSceneId === scene.id ? 'selected' : ''}`}
                        onClick={() => selectScene(scene.id)}
                    >
                        {editingSceneId === scene.id ? (
                            <div className="editing">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRenameScene(scene.id);
                                        if (e.key === 'Escape') {
                                            setEditingSceneId(null);
                                            setEditName('');
                                        }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                    className="scene-input"
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRenameScene(scene.id);
                                    }}
                                    className="confirm-button"
                                >
                                    ✓
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingSceneId(null);
                                        setEditName('');
                                    }}
                                    className="cancel-button"
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <>
                                <span className="scene-name">{scene.name}</span>
                                <span className="shot-count">{scene.shots.length} shots</span>
                                <div className="scene-actions">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            startEdit(scene.id, scene.name);
                                        }}
                                        className="edit-button"
                                        title="Rename"
                                    >
                                        ✎
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm(`Delete scene "${scene.name}"?`)) {
                                                removeScene(scene.id);
                                            }
                                        }}
                                        className="delete-button"
                                        title="Delete"
                                    >
                                        🗑
                                    </button>
                                </div>
                            </>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
