const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const port = 3001;

app.use(cors());

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36';
const baseUrl = 'https://moopa.live/api/v2';
const referer = 'https://moopa.live/en';

app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const end = Date.now();
    const duration = end - start;

    console.log(`${duration}ms - ${req.method} ${req.originalUrl}`);
  });

  next();
});

app.get('/episode', async (req, res) => {
  try {
    const id = req.query.id;

    const response = await axios.request({
      method: 'get',
      url: `${baseUrl}/episode/${id}`,
      headers: {
        'User-Agent': userAgent,
        'Referer': referer
      },
    });

    return res.status(200).json(response.data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/source', async (req, res) => {
  try {
    const providerId = req.query.providerId;
    const watchId = req.query.watchId;
    const episode = req.query.episode;
    const id = req.query.id;

    const response = await axios.request({
      method: 'post',
      url: `${baseUrl}/source`,
      headers: {
        'User-Agent': userAgent,
        'Referer': referer
      },
      data: {
        source: 'consumet',
        providerId: providerId,
        watchId: watchId,
        episode: episode,
        id: id,
        sub: 'sub'
      }
    });

    return res.status(200).json(response.data);
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
    console.log('Express server listening on port %d in %s mode', port, app.settings.env);
});

