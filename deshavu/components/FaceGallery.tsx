import React, { useState, useRef, useEffect } from 'react';
import type { Face } from '../types';

interface FaceCardProps {
    face: Face;
    isSelected: boolean;
    onToggleSelect: (faceId: string) => void;
    onNameFace: (faceId: string, name: string) => void;
}

const FaceCard: React.FC<FaceCardProps> = ({ face, isSelected, onToggleSelect, onNameFace }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(face.name || '');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
        }
    }, [isEditing]);

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() !== face.name) {
            onNameFace(face.id, name.trim());
        }
        setIsEditing(false);
    };

    const handleImageClick = () => {
        if (!isEditing) {
            onToggleSelect(face.id);
        }
    }

    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditing(true);
    }
    
    return (
        <div className="text-center flex-shrink-0">
            <div 
                className={`relative w-24 h-24 mx-auto rounded-xl p-1.5 flex items-center justify-center border-2 border-transparent transition-all duration-300 cursor-pointer ${isSelected ? 'border-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.7)]' : 'glass-inset'}`}
                onClick={handleImageClick}
                onKeyDown={(e) => e.key === 'Enter' && handleImageClick()}
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0}
                title={face.description}
            >
                <img 
                    src={`data:image/jpeg;base64,${face.image}`} 
                    alt={face.name || face.description}
                    className="w-full h-full object-cover rounded-lg"
                />
            </div>
            <div className="mt-2 w-24">
                {isEditing ? (
                    <form onSubmit={handleNameSubmit}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={handleNameSubmit}
                            className="bg-transparent text-white text-sm rounded px-2 py-1 w-full text-center outline-none ring-1 ring-gray-600 focus:ring-[#22c55e]"
                            placeholder="Name..."
                        />
                    </form>
                ) : (
                    <div onClick={handleEditClick} className="px-2 py-1 text-sm cursor-pointer rounded-lg hover:bg-white/10 truncate">
                        {face.name || <span className="text-gray-500 italic">Name Face</span>}
                    </div>
                )}
            </div>
        </div>
    );
}

interface FaceGalleryProps {
    faces: Face[];
    selectedFaceIds: string[];
    onToggleSelect: (faceId: string) => void;
    onNameFace: (faceId: string, name: string) => void;
}

export const FaceGallery: React.FC<FaceGalleryProps> = ({ faces, selectedFaceIds, onToggleSelect, onNameFace }) => {
    return (
        <div className="glass-container p-6">
             <h3 className="text-xl font-semibold mb-2 text-white">Filter by Face</h3>
             <p className="text-sm text-[#9A9A9A] mb-4">Click a face to filter the search results. Click the name to edit it.</p>
             <div className="-mx-6 px-6 pt-6 flex space-x-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4A4A4A #2C2D31' }}>
                {faces.map(face => (
                    <FaceCard 
                        key={face.id}
                        face={face}
                        isSelected={selectedFaceIds.includes(face.id)}
                        onToggleSelect={onToggleSelect}
                        onNameFace={onNameFace}
                    />
                ))}
             </div>
        </div>
    )
}