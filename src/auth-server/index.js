import express from 'express';
import cors from 'cors';
import { ipcMain } from 'electron';
import keytar from 'keytar';

const app = express();
const port = 8000;

app.use(cors());

app.get('/anilist', async (req, res) => {
  try {
    const code = req.query.code;
    ipcMain.emit('oauth-code', code);
    return res.status(200).json({ success: 'AniList OAuth callback received' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.use((req, res) => {
    res.status(404).json({
        status: 404,
        error: 'Not Found',
    });
});

app.listen(port, '127.0.0.1', () => {
    console.log('Auth server listening on port %d in %s mode', port, app.settings.env);
});
