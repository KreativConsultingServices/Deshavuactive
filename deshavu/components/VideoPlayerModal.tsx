import React, { useEffect, useRef } from 'react';
import type { Video } from '../types';

interface VideoPlayerModalProps {
  video: Video & { url: string };
  onClose: () => void;
}

const formatTimestamp = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const pad = (num: number) => num.toString().padStart(2, '0');

    if (h > 0) {
        return `${h}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
};

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ video, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && modalRef.current.contains(event.target as Node)) {
       // Clicks inside the modal should not close it
      return;
    }
    onClose();
  };

  const handleSegmentClick = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      <div 
        ref={modalRef}
        className="glass-container w-full max-w-6xl h-full max-h-[90vh] flex flex-col md:flex-row transform transition-all overflow-hidden"
      >
        <div className="w-full md:w-2/3 h-1/2 md:h-full bg-black flex items-center justify-center">
          <video 
            ref={videoRef}
            src={video.url} 
            controls 
            autoPlay 
            className="w-full h-full object-contain"
          >
            Your browser does not support the video tag.
          </video>
        </div>

        <div className="w-full md:w-1/3 h-1/2 md:h-full flex flex-col p-6 overflow-hidden">
           <div className="flex-shrink-0">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-white pr-4">{video.name}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4A4A4A #2C2D31' }}>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-sm font-semibold text-[#4ade80] uppercase tracking-wider mb-2">AI Generated Analysis</h3>
                        <p className="text-[#9A9A9A] whitespace-pre-wrap">{video.description}</p>
                    </div>

                    {video.segments && video.segments.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-[#4ade80] uppercase tracking-wider mb-3">Video Segments</h3>
                            <div className="space-y-2">
                                {video.segments.sort((a,b) => a.timestamp - b.timestamp).map((segment, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSegmentClick(segment.timestamp)}
                                    className="w-full text-left p-3 rounded-lg bg-[#222326] hover:bg-[#3a3b3f] transition-colors focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
                                    aria-label={`Jump to ${segment.description} at ${formatTimestamp(segment.timestamp)}`}
                                >
                                    <span className="font-mono text-cyan-400 text-sm">{formatTimestamp(segment.timestamp)}</span>
                                    <p className="text-gray-300 text-sm mt-1">{segment.description}</p>
                                </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {video.transcript && (
                        <div>
                            <h3 className="text-sm font-semibold text-[#4ade80] uppercase tracking-wider mb-2">Transcript</h3>
                            <p className="text-[#9A9A9A] whitespace-pre-wrap italic">"{video.transcript}"</p>
                        </div>
                    )}

                    {video.onScreenText && video.onScreenText.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-[#4ade80] uppercase tracking-wider mb-3">On-Screen Text</h3>
                            <div className="space-y-2">
                                {video.onScreenText.sort((a,b) => a.timestamp - b.timestamp).map((item, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSegmentClick(item.timestamp)}
                                    className="w-full text-left p-3 rounded-lg bg-[#222326] hover:bg-[#3a3b3f] transition-colors focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
                                    aria-label={`Jump to text "${item.text}" at ${formatTimestamp(item.timestamp)}`}
                                >
                                    <span className="font-mono text-cyan-400 text-sm">{formatTimestamp(item.timestamp)}</span>
                                    <p className="text-gray-300 text-sm mt-1">"{item.text}"</p>
                                </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};