import { Request, Response } from 'express';
import { getAppleDeveloperToken } from '../services/musicService.js';

export const getAppleToken = (req: Request, res: Response) => {
    try {
        const token = getAppleDeveloperToken();
        res.status(200).json({ token });
    } catch (error) {
        console.error('Error creating Apple token:', error);
        res.status(500).json({ status: "error", message: "Could not generate Apple token" });
    }
};