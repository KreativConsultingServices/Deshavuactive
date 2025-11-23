import React, { useState, useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { analyzeVideoContent, VideoAnalysisResult } from '../services/geminiService';


const extractFrames = async (videoFile: File, frameCount: number): Promise<{frames: string[], duration: number}> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return reject(new Error("Could not get canvas context"));
        }
        const frames: string[] = [];

        video.preload = 'metadata';
        video.src = URL.createObjectURL(videoFile);
        video.muted = true;

        video.onloadedmetadata = async () => {
            video.play().catch(err => {
                // Play may be interrupted, which is fine.
            });

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const duration = video.duration;
            
            if (duration === 0 || !isFinite(duration)) {
              URL.revokeObjectURL(video.src);
              return reject(new Error("Video has no duration or is invalid."));
            }

            const interval = duration / (frameCount + 1);
            
            const captureFrameAt = (time: number) => {
                return new Promise<void>((res, rej) => {
                    const seekTimeout = setTimeout(() => {
                        rej(new Error(`Seek timed out at ${time}s`));
                    }, 2000);

                    video.onseeked = () => {
                        clearTimeout(seekTimeout);
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                        frames.push(base64Data);
                        res();
                    };
                    video.currentTime = time;
                });
            };

            try {
                for (let i = 1; i <= frameCount; i++) {
                    await captureFrameAt(i * interval);
                }
                video.pause();
                URL.revokeObjectURL(video.src);
                resolve({frames, duration});
            } catch (error) {
                video.pause();
                URL.revokeObjectURL(video.src);
                reject(error);
            }
        };
        
        video.onerror = (e) => {
            URL.revokeObjectURL(video.src);
            reject(new Error("Error loading video for frame extraction. The file might be corrupt or in an unsupported format."));
        };
    });
};


interface VideoUploadModalProps {
  onClose: () => void;
  onUpload: (file: File, analysisResult: VideoAnalysisResult, duration: number) => void;
}

export const VideoUploadModal: React.FC<VideoUploadModalProps> = ({ onClose, onUpload }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setError(null);
    } else {
      setError('Please select a valid video file.');
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if(isAnalyzing) return;
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setError(null);
    } else {
      setError('Please select a valid video file.');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleSubmit = async () => {
    if (!videoFile) {
      setError('Please select a video file.');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);

    try {
        const { frames, duration } = await extractFrames(videoFile, 12);
        if (frames.length === 0) {
            throw new Error("Could not extract frames from the video.");
        }
        const analysisResult = await analyzeVideoContent(frames, duration);
        onUpload(videoFile, analysisResult, duration);
        onClose();
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during analysis.';
        setError(`Analysis failed: ${errorMessage}`);
    } finally {
        setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-container p-8 w-full max-w-2xl transform transition-all relative">
        {isAnalyzing && (
            <div className="absolute inset-0 bg-[#2C2D31] flex flex-col items-center justify-center rounded-[20px] z-10">
                <div className="w-12 h-12 border-4 border-t-[#5ECB6A] border-gray-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-lg font-semibold text-white">Analyzing Video...</p>
                <p className="text-[#9A9A9A]">Detecting content, faces, segments &amp; transcript. This may take a moment.</p>
            </div>
        )}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Upload New Video</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl" disabled={isAnalyzing}>&times;</button>
        </div>

        <div className="space-y-6">
          <div
            className={`glass-inset p-8 text-center transition-colors ${!isAnalyzing ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
            onClick={() => !isAnalyzing && fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="video/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isAnalyzing}
            />
            <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
            {videoFile ? (
              <p className="mt-2 text-green-400">{videoFile.name}</p>
            ) : (
              <p className="mt-2 text-[#9A9A9A]">Drag & drop a video file here, or click to select</p>
            )}
          </div>
          
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>

        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-transparent border border-gray-600 hover:border-gray-500 hover:bg-gray-700/50 transition-colors font-semibold disabled:opacity-50"
            disabled={isAnalyzing}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-8 py-2 rounded-full bg-[#5ECB6A] hover:opacity-90 transition-all duration-200 font-bold text-white shadow-[0_0_15px_1px_rgba(94,203,106,0.3)] hover:shadow-[0_0_20px_3px_rgba(94,203,106,0.4)] disabled:bg-opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            disabled={!videoFile || isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze & Save'}
          </button>
        </div>
      </div>
    </div>
  );
};