import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import type { Video, VideoSegment, OnScreenTextSegment } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const findMatchingVideos = async (query: string, videos: Video[]): Promise<string[]> => {
    // This function remains the same as before
    if (videos.length === 0) {
        return [];
    }

    const model = 'gemini-2.5-flash';
    
    const simplifiedVideos = videos.map(({ id, description }) => ({ id, description }));

    const systemInstruction = `You are an intelligent video library search assistant. Your task is to find videos that match the user's query from a provided list of videos.
    The list of videos will be a JSON array, where each object has an 'id' and a 'description'.
    Analyze the user's query and the descriptions of the videos.
    You MUST respond with only a JSON array of strings, where each string is the 'id' of a matching video.
    If no videos match, return an empty array [].
    Do not provide any explanation or other text in your response.`;

    const prompt = `
      User Query: "${query}"
      
      Available Videos:
      ${JSON.stringify(simplifiedVideos)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING,
                        description: 'The ID of a matching video.'
                    }
                }
            }
        });

        const jsonString = response.text.trim();
        const matchingIds = JSON.parse(jsonString);
        
        if (Array.isArray(matchingIds) && matchingIds.every(item => typeof item === 'string')) {
            return matchingIds;
        } else {
            console.error("Gemini response is not a valid array of strings:", matchingIds);
            return [];
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to search videos. Please try again.");
    }
};

export const generateChatResponse = async (userQuery: string, foundVideosCount: number): Promise<string> => {
    const model = 'gemini-2.5-flash';

    const systemInstruction = `You are Deshavu, an AI video library assistant with the personality of Ben Whittaker from the movie 'The Intern'. You are wise, calm, supportive, and a little old-fashioned but in a charming and professional way. You are speaking to the user who is looking for videos in their library. Your response should be a short, natural, conversational text. Do not use markdown. Do not repeat the user's query. Always refer to the user's collection of videos as "your library". When referring to what the user is searching for, call it a "memory" instead of a "description" or "query".`;

    let prompt: string;
    if (foundVideosCount > 0) {
        prompt = `The user searched for "${userQuery}" and we found ${foundVideosCount} matching video(s). Craft a response to let them know you've found something for them. For example: "Right this way. I believe these are the videos you were looking for." or "Of course. Here is what I found for you."`
    } else {
        prompt = `The user searched for "${userQuery}" but we couldn't find any matching videos. Craft a polite and helpful response explaining this. For example: "I took a good look through your library, but it seems I couldn't find any videos matching that memory. Perhaps try another way of describing it?" or "Hmm, nothing seems to be coming up for that. Would you like to try searching for a different memory?"`
    }

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error generating chat response with Gemini API:", error);
        // Fallback to a simple response in case of an error
        if (foundVideosCount > 0) {
            return `I found ${foundVideosCount} video(s) that match your memory.`;
        } else {
            return "I couldn't find any videos matching that memory.";
        }
    }
}

const extractVideoDetailsFunctionDeclaration: FunctionDeclaration = {
    name: 'extractVideoDetails',
    description: 'Extracts a detailed description, faces, segments, audio transcript, and on-screen text from video frames.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            description: { 
                type: Type.STRING, 
                description: 'A detailed, searchable summary of the video content, including actions, objects, and environment.' 
            },
            faces: {
                type: Type.ARRAY,
                description: 'An array of clearly visible, unique human faces. Only include frontal or near-frontal face shots. Do not include blurry images, profiles where the face is not clear, or non-human objects.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        frameIndex: { 
                            type: Type.INTEGER, 
                            description: 'The index of the frame (from the provided array) where this face is most clearly visible.'
                        },
                        description: { 
                            type: Type.STRING, 
                            description: 'A brief, objective description of the face (e.g., "person with glasses and a beard").' 
                        },
                        box: {
                            type: Type.OBJECT,
                            description: 'Normalized bounding box of the face [y_min, x_min, y_max, x_max], where values are between 0.0 and 1.0.',
                            properties: {
                                y_min: { type: Type.NUMBER },
                                x_min: { type: Type.NUMBER },
                                y_max: { type: Type.NUMBER },
                                x_max: { type: Type.NUMBER },
                            },
                            required: ['y_min', 'x_min', 'y_max', 'x_max']
                        }
                    },
                    required: ['frameIndex', 'description', 'box']
                }
            },
            segments: {
                type: Type.ARRAY,
                description: 'A list of key events or segments in the video with their corresponding timestamps in seconds.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        timestamp: {
                            type: Type.NUMBER,
                            description: 'The start time of the event in seconds from the beginning of the video. This must be less than the total video duration.'
                        },
                        description: {
                            type: Type.STRING,
                            description: 'A brief description of what is happening in this segment.'
                        }
                    },
                    required: ['timestamp', 'description']
                }
            },
            transcript: {
                type: Type.STRING,
                description: 'A transcript of spoken words in the video. If no speech is discernible, return an empty string.'
            },
            onScreenText: {
                type: Type.ARRAY,
                description: 'A list of significant text appearing on screen, with its corresponding timestamp in seconds.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        timestamp: {
                            type: Type.NUMBER,
                            description: 'The time in seconds when the text appears. Must be less than the total video duration.'
                        },
                        text: {
                            type: Type.STRING,
                            description: 'The text that appears on screen.'
                        }
                    },
                    required: ['timestamp', 'text']
                }
            }
        },
        required: ['description', 'faces', 'segments', 'transcript', 'onScreenText']
    }
};


const cropFace = (
    base64Frame: string, 
    box: { y_min: number, x_min: number, y_max: number, x_max: number }
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject('Could not get canvas context');

            const sx = box.x_min * img.width;
            const sy = box.y_min * img.height;
            const sWidth = (box.x_max - box.x_min) * img.width;
            const sHeight = (box.y_max - box.y_min) * img.height;

            canvas.width = sWidth;
            canvas.height = sHeight;

            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);
            resolve(canvas.toDataURL('image/jpeg').split(',')[1]);
        };
        img.onerror = reject;
        img.src = `data:image/jpeg;base64,${base64Frame}`;
    });
};

export interface VideoAnalysisResult {
    description: string;
    faces: {
        description: string;
        image: string; // base64 encoded face crop
    }[];
    segments: VideoSegment[];
    transcript: string;
    onScreenText: OnScreenTextSegment[];
}

export const analyzeVideoContent = async (base64Frames: string[], videoDuration: number): Promise<VideoAnalysisResult> => {
    const model = 'gemini-2.5-flash';
    
    const imageParts = base64Frames.map(frame => ({
        inlineData: {
            mimeType: 'image/jpeg',
            data: frame,
        },
    }));

    const systemInstruction = `You are a video analysis tool. Your sole purpose is to analyze video frames and call the 'extractVideoDetails' function with the extracted information.
- You MUST call the 'extractVideoDetails' function. Do not respond with text.
- Analyze the provided frames to understand the overall context, actions, objects, and environment.
- Create a transcript of spoken words from the video. Use all available visual cues (like scene context and lip movement) to generate the most accurate transcript possible. If no speech is discernible, provide an empty string for the transcript.
- Identify and list any significant text that appears on screen. For each piece of text, provide the text itself and a precise timestamp in seconds for when it appears.
- The total video duration is ${videoDuration.toFixed(2)} seconds. The frames are sampled evenly throughout the video.
- Identify key moments or events in the video. For each event, provide a precise timestamp in seconds and a brief description. Timestamps must be within the video duration.
- For each unique person you identify, find the frame where their face is clearest. Ensure the face is well-lit and not heavily obstructed.
- ONLY return high-quality face detections. The face must be clearly identifiable as a human face. Reject blurry images, partial views, or non-face objects.
- Provide objective, factual descriptions. Do not invent names.`;
        
    const contents = {
        parts: [
            ...imageParts,
            { text: `Analyze the following video frames from a video that is ${videoDuration.toFixed(2)} seconds long. Call the 'extractVideoDetails' function with your complete analysis of the video's description, faces, segments, transcript, and on-screen text.` },
        ],
    };

    try {
        const response = await ai.models.generateContent({
            model,
            contents,
            config: {
                systemInstruction,
                tools: [{ functionDeclarations: [extractVideoDetailsFunctionDeclaration] }],
            }
        });
        
        const functionCall = response.functionCalls?.[0];
        if (!functionCall || functionCall.name !== 'extractVideoDetails') {
            throw new Error("AI did not return the expected analysis data.");
        }
        
        const { description, faces, segments, transcript, onScreenText } = functionCall.args;

        if (!description || !Array.isArray(faces) || !Array.isArray(segments) || typeof transcript === 'undefined' || !Array.isArray(onScreenText)) {
            throw new Error("Invalid data structure returned from AI.");
        }

        const faceCrops = await Promise.all(
            faces.map(async (face: any) => {
                const frame = base64Frames[face.frameIndex];
                if (!frame) return null;
                const croppedImage = await cropFace(frame, face.box);
                return {
                    description: face.description,
                    image: croppedImage,
                };
            })
        );

        return {
            description: description,
            faces: faceCrops.filter(Boolean) as { description: string; image: string; }[],
            segments: segments || [],
            transcript: transcript || '',
            onScreenText: onScreenText || [],
        };

    } catch (error) {
        console.error("Error analyzing video with Gemini API:", error);
        throw new Error("Failed to analyze video content with face detection.");
    }
};