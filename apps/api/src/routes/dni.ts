import { Router } from 'express';
// In full implementation, uses @napi-rs/canvas and @aws-sdk/client-s3

export const dniRouter = Router();

dniRouter.get('/:guildId/template', async (req, res) => {
  res.json({ font: 'Inter', primary_color: '#000000' });
});

dniRouter.put('/:guildId/template', async (req, res) => {
  res.json({ success: true });
});

dniRouter.post('/:guildId/preview', async (req, res) => {
  res.json({ preview_url: 'https://placeholder.url/preview.png' });
});

dniRouter.post('/:guildId/generate/:discordId', async (req, res) => {
  res.json({ image_url: 'https://placeholder.url/dni.png' });
});
