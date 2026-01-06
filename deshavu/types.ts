export interface User {
  id?: number; // Primary key, auto-incremented by IndexedDB
  email: string;
}

export interface Face {
  id: string;
  userId: number; // Foreign key to User
  name: string | null;
  image: string; // base64 encoded image of the face
  description: string; // AI-generated description
  personId?: string; // To group multiple detections of the same person
}

export interface VideoSegment {
  timestamp: number;
  endTime?: number;
  description: string;
}

export interface OnScreenTextSegment {
  timestamp: number;
  text: string;
}

export interface Video {
  id: string;
  userId: number; // Foreign key to User
  name: string;
  file: File; // Store the actual file object
  description: string;
  duration: number;
  faceIds: string[];
  segments: VideoSegment[];
  transcript: string;
  onScreenText: OnScreenTextSegment[];
}

export interface ChatMessage {
  id:string;
  sender: 'user' | 'ai';
  text: string;
  videos?: (Video & { url: string })[];
}