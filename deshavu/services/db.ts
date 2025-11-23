import Dexie, { type Table } from 'dexie';
import type { User, Video, Face } from '../types';

export class DeshavuDB extends Dexie {
    users!: Table<User, number>;
    videos!: Table<Video, string>;
    faces!: Table<Face, string>;

    constructor() {
        super('deshavuDB');
        // A schema change from username to email requires a version bump for existing databases.
        // FIX: Explicitly cast `this` to `Dexie` to resolve a TypeScript error where the 
        // inherited `version` method was not being found on the subclass instance within the 
        // constructor. This can happen in certain build configurations.
        (this as Dexie).version(2).stores({
            users: '++id, &email', // Changed from username
            videos: 'id, userId',
            faces: 'id, userId',
        });
    }
}

export const db = new DeshavuDB();

// --- User Functions ---
export const getUserByEmail = (email: string): Promise<User | undefined> => {
    return db.users.where('email').equalsIgnoreCase(email).first();
};

export const getUserById = (id: number): Promise<User | undefined> => {
    return db.users.get(id);
};

export const createUser = (email: string): Promise<number> => {
    return db.users.add({ email });
};

// --- Video Functions ---
export const addVideo = (video: Video): Promise<string> => {
    return db.videos.add(video);
}

export const getVideosForUser = (userId: number): Promise<Video[]> => {
    return db.videos.where('userId').equals(userId).toArray();
}

// --- Face Functions ---
export const addFaces = (faces: Face[]): Promise<string[]> => {
    return db.faces.bulkAdd(faces, { allKeys: true });
}

export const getFacesForUser = (userId: number): Promise<Face[]> => {
    return db.faces.where('userId').equals(userId).toArray();
}

export const updateFaceName = (faceId: string, name: string): Promise<number> => {
    return db.faces.update(faceId, { name });
}