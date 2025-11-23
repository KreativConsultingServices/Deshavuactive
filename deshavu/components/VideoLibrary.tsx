import React from 'react';
import type { Video } from '../types';
import { VideoIcon } from './icons/VideoIcon';
import { ClockIcon } from './icons/ClockIcon';

interface VideoLibraryProps {
  videos: Video[];
  isFilteredByFace: boolean;
  onEmptyLibraryClick: () => void;
}

export const VideoLibrary: React.FC<VideoLibraryProps> = ({ videos, isFilteredByFace, onEmptyLibraryClick }) => {
    if (videos.length === 0) {
        const isEmptyAndNotFiltered = !isFilteredByFace;
        const containerProps = isEmptyAndNotFiltered ? {
            onClick: onEmptyLibraryClick,
            role: 'button' as 'button',
            tabIndex: 0,
            onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') onEmptyLibraryClick(); },
            'aria-label': 'Upload a video to get started'
        } : {};

        return (
            <div
                className={`text-center py-20 glass-container flex flex-col items-center justify-center ${isEmptyAndNotFiltered ? 'cursor-pointer hover:bg-white/5 transition-colors' : ''}`}
                {...containerProps}
            >
                <VideoIcon className="mx-auto h-16 w-16 text-gray-600" />
                <h3 className="mt-4 text-xl font-semibold text-gray-400">
                    {isFilteredByFace ? "No Videos Match This Filter" : "Your Library is Empty"}
                </h3>
                <p className="mt-1 text-gray-500">
                    {isFilteredByFace ? "Try selecting a different face or clearing the filter." : "Upload a video to get started."}
                </p>
            </div>
        );
    }

    const totalVideos = videos.length;
    const totalSeconds = videos.reduce((acc, video) => acc + (video.duration || 0), 0);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = Math.round(totalSeconds % 60);

    return (
        <div className="glass-container p-6">
            <h2 className="text-xl font-bold mb-6 text-white">
                {isFilteredByFace ? 'Filtered Library Stats' : 'Library Overview'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-inset p-6 flex items-center space-x-4">
                    <VideoIcon className="w-12 h-12 text-[#4ade80] flex-shrink-0" />
                    <div>
                        <p className="text-3xl font-bold text-white">{totalVideos}</p>
                        <p className="text-sm text-[#9A9A9A] uppercase tracking-wider">{totalVideos === 1 ? 'Video' : 'Videos'}</p>
                    </div>
                </div>
                 <div className="glass-inset p-6 flex items-center space-x-4">
                    <ClockIcon className="w-12 h-12 text-cyan-400 flex-shrink-0" />
                    <div>
                        <p className="text-3xl font-bold text-white">
                            {totalMinutes}<span className="text-xl font-medium">m</span> {remainingSeconds}<span className="text-xl font-medium">s</span>
                        </p>
                        <p className="text-sm text-[#9A9A9A] uppercase tracking-wider">Total Duration</p>
                    </div>
                </div>
            </div>
        </div>
    );
};