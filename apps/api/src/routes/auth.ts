import { Router } from 'express';
import { getCollection, Collections } from '../lib/db.js';
import type { GlobalIdentity } from '@bloxive/shared';
// Add proper OAuth logic here in full implementation

export const authRouter = Router();

authRouter.get('/discord', (req, res) => {
  res.redirect('https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=YOUR_REDIRECT&response_type=code&scope=identify%20guilds');
});

authRouter.get('/callback', async (req, res) => {
  res.json({ token: 'mock_jwt_token' });
});
