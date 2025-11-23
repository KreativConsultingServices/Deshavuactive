import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Video } from '../types';
import { SendIcon } from './icons/SendIcon';

type UIVideo = Video & { url: string };

interface ChatSearchProps {
  onSearch: (query: string) => void;
  chatHistory: ChatMessage[];
  isLoading: boolean;
  onClearSearch: () => void;
  searchActive: boolean;
  onVideoSelect: (video: UIVideo) => void;
}

export const ChatSearch: React.FC<ChatSearchProps> = ({ onSearch, chatHistory, isLoading, onClearSearch, searchActive, onVideoSelect }) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasHistory = chatHistory.length > 0;

  useEffect(() => {
    if (hasHistory) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, hasHistory]);

  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
      setQuery('');
    }
  };

  return (
    <div className="glass-container p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">What memory (video) do you want to find?</h2>
        {searchActive && (
            <button 
                onClick={onClearSearch}
                className="text-sm font-medium text-red-500 hover:text-red-400 transition-colors"
            >
                Clear Search & Filters
            </button>
        )}
      </div>
      
      <div 
        className={`overflow-y-auto space-y-4 transition-all duration-300 ${hasHistory ? 'h-48 mb-6 p-4 glass-inset' : 'h-0'}`}
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#4A4A4A #2C2D31' }}
      >
        {chatHistory.map((msg) => (
          <div key={msg.id} className={`w-full flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-xl shadow-md ${
                msg.sender === 'user'
                  ? 'bg-[#5ECB6A] text-white rounded-br-none'
                  : 'bg-[#3a3b3f] text-gray-200 rounded-bl-none'
              }`}
            >
              <p>{msg.text}</p>
            </div>

            {msg.videos && msg.videos.length > 0 && (
                <div className="mt-3 w-full max-w-lg overflow-x-auto flex space-x-3 pb-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4A4A4A #2C2D31' }}>
                    {msg.videos.map(video => (
                        <div 
                            key={video.id}
                            onClick={() => onVideoSelect(video)}
                            className="w-48 flex-shrink-0 bg-[#3a3b3f] rounded-lg overflow-hidden cursor-pointer group transform hover:-translate-y-1 transition-transform"
                            role="button"
                            tabIndex={0}
                            aria-label={`Play video: ${video.name}`}
                        >
                            <div className="aspect-video bg-black relative">
                                <video muted playsInline src={video.url + '#t=1'} className="w-full h-full object-cover" preload="metadata"/>
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                                    <svg className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm14.024-.983a1.125 1.125 0 0 1 0 1.966l-5.603 3.113A1.125 1.125 0 0 1 9 15.113V8.887c0-.857.921-1.4 1.671-.983l5.603 3.113Z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <p className="p-2 text-xs text-white truncate" title={video.name}>{video.name}</p>
                        </div>
                    ))}
                </div>
            )}

          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-[#3a3b3f] text-gray-200 rounded-lg p-2 px-4 rounded-bl-none">
                    <span className="animate-pulse">Searching...</span>
                </div>
            </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={handleSearch} className="flex items-center space-x-4">
        <div className="flex-grow glass-inset p-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder=""
            className="w-full bg-transparent p-3 text-white focus:outline-none placeholder-[#9A9A9A]"
            disabled={isLoading}
          />
          {!query && (
              <div className="absolute inset-0 flex items-center p-4 pointer-events-none text-[#9A9A9A]">
                <span className="blinking-cursor inline-block w-px h-5 bg-white mr-2"></span>
                <span>e.g., 'People are celebrating a birthday'</span>
              </div>
          )}
        </div>
        <button
          type="submit"
          className={`flex-shrink-0 p-3 rounded-full transition-all duration-300 ${isLoading || !query.trim() ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-[#5ECB6A] text-white shadow-[0_0_15px_1px_rgba(94,203,106,0.3)] hover:shadow-[0_0_20px_3px_rgba(94,203,106,0.4)]'}`}
          disabled={isLoading || !query.trim()}
          aria-label="Send search query"
        >
          <SendIcon className="w-6 h-6" />
        </button>
      </form>
    </div>
  );
};