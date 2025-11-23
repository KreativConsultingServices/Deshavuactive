import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Video, ChatMessage, Face } from './types';
import { findMatchingVideos, VideoAnalysisResult, generateChatResponse } from './services/geminiService';
import { VideoUploadModal } from './components/VideoUploadModal';
import { VideoLibrary } from './components/VideoLibrary';
import { ChatSearch } from './components/ChatSearch';
import { UploadIcon } from './components/icons/UploadIcon';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { FaceGallery } from './components/FaceGallery';
import { useAuth } from './hooks/useAuth';
import { Auth } from './components/Auth';
import * as db from './services/db';

type UIVideo = Video & { url: string };

const App: React.FC = () => {
  const { currentUser, logout, isLoading: isAuthLoading } = useAuth();
  
  const [videos, setVideos] = useState<UIVideo[]>([]);
  const [allFaces, setAllFaces] = useState<Face[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchActive, setSearchActive] = useState<boolean>(false);
  const [selectedVideo, setSelectedVideo] = useState<UIVideo | null>(null);
  const [selectedFaceIds, setSelectedFaceIds] = useState<string[]>([]);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const loadUserData = useCallback(async () => {
    if (!currentUser?.id) return;
    setIsLoading(true);
    try {
        const [dbVideos, dbFaces] = await Promise.all([
            db.getVideosForUser(currentUser.id),
            db.getFacesForUser(currentUser.id),
        ]);

        const videosWithUrls = dbVideos.map(v => ({...v, url: URL.createObjectURL(v.file)}));
        setVideos(prevVideos => {
            // Clean up old URLs before setting new ones
            prevVideos.forEach(v => URL.revokeObjectURL(v.url));
            return videosWithUrls;
        });
        setAllFaces(dbFaces);
    } catch (e) {
        setError("Could not load user data from the database.");
    } finally {
        setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadUserData();
    // Cleanup URLs when component unmounts
    return () => {
        videos.forEach(v => URL.revokeObjectURL(v.url));
    }
  }, [loadUserData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleUpload = async (file: File, analysisResult: VideoAnalysisResult, duration: number) => {
    if (!currentUser?.id) return;

    const newFaces: Face[] = [];
    const newFaceIds: string[] = analysisResult.faces.map(faceData => {
        const faceId = `face-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        newFaces.push({
            id: faceId,
            userId: currentUser.id!,
            name: null,
            image: faceData.image,
            description: faceData.description
        });
        return faceId;
    });

    if (newFaces.length > 0) {
        await db.addFaces(newFaces);
    }

    const newVideo: Video = {
      id: `vid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: currentUser.id!,
      name: file.name,
      file: file,
      description: analysisResult.description,
      duration: duration,
      faceIds: newFaceIds,
      segments: analysisResult.segments,
      transcript: analysisResult.transcript,
      onScreenText: analysisResult.onScreenText,
    };
    
    await db.addVideo(newVideo);
    await loadUserData(); // Refresh data
  };
  
  const handleSearch = useCallback(async (query: string) => {
    setIsLoading(true);
    setSearchActive(true);
    setError(null);

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
    };
    setChatHistory(prev => [...prev, userMessage]);
    
    const videosToSearch = selectedFaceIds.length > 0 
        ? videos.filter(video => selectedFaceIds.every(faceId => video.faceIds.includes(faceId)))
        : videos;

    try {
      const matchingIds = await findMatchingVideos(query, videosToSearch);
      const matchingVideos = videos.filter(video => matchingIds.includes(video.id));
      
      const aiResponseText = await generateChatResponse(query, matchingVideos.length);

      const aiMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: aiResponseText,
        videos: matchingVideos,
      };
      setChatHistory(prev => [...prev, aiMessage]);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      const aiMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: `Sorry, I encountered an error: ${errorMessage}`,
      };
      setChatHistory(prev => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [videos, selectedFaceIds]);

  const displayedVideos = useMemo(() => {
    let filtered = videos;

    if (selectedFaceIds.length > 0) {
        filtered = videos.filter(video => 
            selectedFaceIds.every(faceId => video.faceIds.includes(faceId))
        );
    }
    
    return filtered.sort((a,b) => b.id.localeCompare(a.id));
  }, [videos, selectedFaceIds]);


  const handleClearSearch = () => {
    setSearchActive(false);
    setChatHistory([]);
    setSelectedFaceIds([]);
  };

  const handleVideoSelect = (video: UIVideo) => {
    setSelectedVideo(video);
  };

  const handleClosePlayerModal = () => {
    setSelectedVideo(null);
  };

  const handleToggleFaceSelection = (faceId: string) => {
      const newSelectedFaceIds = selectedFaceIds.includes(faceId) 
          ? selectedFaceIds.filter(id => id !== faceId) 
          : [...selectedFaceIds, faceId];
      
      setSelectedFaceIds(newSelectedFaceIds);
      setSearchActive(false);
      setChatHistory([]);
  };

  const handleNameFace = async (faceId: string, name: string) => {
      await db.updateFaceName(faceId, name);
      setAllFaces(prev => prev.map(face => face.id === faceId ? { ...face, name: name } : face));
  };

  if (isAuthLoading) {
    return <div className="min-h-screen bg-[#2C2D31]"></div>; // Or a loading spinner
  }

  if (!currentUser) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen text-[#F0F0F0] font-sans">
      {isModalOpen && <VideoUploadModal onClose={() => setIsModalOpen(false)} onUpload={handleUpload} />}
      {selectedVideo && <VideoPlayerModal video={selectedVideo} onClose={handleClosePlayerModal} />}
      
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="flex items-start justify-between h-20 mb-8">
            <div>
                <h1 className="text-4xl font-bold">Deshavu</h1>
                <p className="text-sm text-[#9A9A9A] mt-1">
                    Helps you find your stored memories<br />
                    faster than you can say<br />
                    Déjà vu
                </p>
            </div>
            <div className="flex items-center space-x-4">
                <div className="relative" ref={profileMenuRef}>
                    <button 
                        onClick={() => setIsProfileMenuOpen(prev => !prev)}
                        className="px-6 py-2 rounded-full bg-transparent border border-gray-600 hover:border-gray-500 hover:bg-gray-700/50 transition-colors font-semibold flex items-center space-x-2"
                    >
                        <span>Profile</span>
                        <svg className={`w-4 h-4 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {isProfileMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 glass-container p-2 z-20 rounded-xl">
                            <div className="p-2 text-center border-b border-gray-700 mb-1">
                                <p className="font-semibold text-white truncate" title={currentUser.email}>{currentUser.email}</p>
                            </div>
                            <button 
                                onClick={() => {
                                    logout();
                                    setIsProfileMenuOpen(false);
                                }} 
                                className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
                <button className="upload-button" onClick={() => setIsModalOpen(true)}>
                    <UploadIcon className="h-8 w-8" />
                    <span className="text-xs font-bold mt-1">UPLOAD</span>
                </button>
            </div>
        </header>
        
        <main className="space-y-8">
            <ChatSearch 
              onSearch={handleSearch} 
              chatHistory={chatHistory} 
              isLoading={isLoading}
              onClearSearch={handleClearSearch}
              searchActive={searchActive || selectedFaceIds.length > 0}
              onVideoSelect={handleVideoSelect}
            />

            { allFaces.length > 0 && 
              <FaceGallery 
                faces={allFaces} 
                selectedFaceIds={selectedFaceIds} 
                onToggleSelect={handleToggleFaceSelection}
                onNameFace={handleNameFace}
              /> 
            }
            
            <VideoLibrary 
              videos={displayedVideos} 
              isFilteredByFace={selectedFaceIds.length > 0} 
              onEmptyLibraryClick={() => setIsModalOpen(true)}
            />
        </main>
      </div>
    </div>
  );
};

export default App;