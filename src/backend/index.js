const express = require('express');
const cors = require('cors');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const os = require('os');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// TODO: export/import database
const getDatabasePath = () => {
  let dbPath;
  const baseDir = os.platform() === 'win32'
    ? path.join(process.env.APPDATA, 'nendaiki') // Windows path
    : os.platform() === 'darwin'
      ? path.join(process.env.HOME, 'Library', 'Application Support', 'nendaiki') // macOS path
      : path.join(process.env.HOME, '.local', 'share', 'nendaiki'); // Linux path

  dbPath = path.join(baseDir, 'database.sqlite'); // Name your SQLite database file

  // Ensure the directory exists
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true }); // Create the directory if it does not exist
  }

  return dbPath;
};

// Set the database path
const dbPath = getDatabasePath();

// Initialize SQLite database
let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log(`Connected to the SQLite database at ${dbPath}`);
});

// Create anime table if not exists
db.run(`CREATE TABLE IF NOT EXISTS anime (
  id INTEGER PRIMARY KEY,
  idMal INTEGER UNIQUE,
  title TEXT,
  episodes INTEGER,
  bannerImage TEXT,
  coverImage TEXT,
  description TEXT,
  format TEXT,
  meanScore TEXT,
  nextAiringEpisode TEXT,
  popularity INTEGER,
  ranges TEXT,
  selectedRange INTEGER,
  status TEXT,
  trailer TEXT,
  trending INTEGER,
  genres TEXT,
  episodesData TEXT
)`, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Created anime table.');
});

db.run(`CREATE TABLE IF NOT EXISTS history (
  idAndEpisode TEXT PRIMARY KEY,
  date TEXT NOT NULL
)`, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Created history table.');
});

app.post('/update-anime', express.json(), (req, res) => {
  const {
    id, idMal, title, episodes, bannerImage, coverImage, description,
    format, meanScore, nextAiringEpisode, popularity, ranges, selectedRange, status,
    trailer, trending, genres, episodesData
  } = req.body;

  if (!id) {
    return res.status(500).json({ error: "Required 'id' field not provided." });
  }

  // First, fetch the existing record if it exists
  const selectSql = `SELECT * FROM anime WHERE id = ?`;

  db.get(selectSql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // If the record exists, merge the old values with the new ones
    const updatedRecord = {
      id: id,
      idMal: idMal ?? row?.idMal,
      title: title ?? row?.title,
      episodes: episodes ?? row?.episodes,
      bannerImage: bannerImage ?? row?.bannerImage,
      coverImage: coverImage ?? row?.coverImage,
      description: description ?? row?.description,
      format: format ?? row?.format,
      meanScore: meanScore ?? row?.meanScore,
      nextAiringEpisode: nextAiringEpisode ?? row?.nextAiringEpisode,
      popularity: popularity ?? row?.popularity,
      ranges: ranges ?? row?.ranges,
      selectedRange: selectedRange ?? row?.selectedRange,
      status: status ?? row?.status,
      trailer: trailer ?? row?.trailer,
      trending: trending ?? row?.trending,
      genres: genres ?? row?.genres,
      episodesData: episodesData ? JSON.stringify(episodesData) : row?.episodesData
    };

    // SQL query to insert or replace the record
    const sql = `
      INSERT OR REPLACE INTO anime (
        id, idMal, title, episodes, bannerImage, coverImage, description,
        format, meanScore, nextAiringEpisode, popularity, ranges, selectedRange, status,
        trailer, trending, genres, episodesData
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Execute the SQL query
    db.run(sql, [
      updatedRecord.id, updatedRecord.idMal, updatedRecord.title, updatedRecord.episodes,
      updatedRecord.bannerImage, updatedRecord.coverImage, updatedRecord.description,
      updatedRecord.format, updatedRecord.meanScore, updatedRecord.nextAiringEpisode,
      updatedRecord.popularity, updatedRecord.ranges, updatedRecord.selectedRange, updatedRecord.status,
      updatedRecord.trailer, updatedRecord.trending, updatedRecord.genres, updatedRecord.episodesData
    ], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(200).json({ success: `Anime data for ${id} updated successfully.` });
    });
  });
});

// Handle batch updates for anime
app.post('/update-anime-batch', async (req, res) => {
  const animeArray = req.body;

  if (!Array.isArray(animeArray)) {
    return res.status(400).json({ error: 'Input must be an array of anime objects.' });
  }

  const selectSql = `SELECT * FROM anime WHERE id = ?`;
  const sql = `
    INSERT OR REPLACE INTO anime (
      id, idMal, title, episodes, bannerImage, coverImage, description,
      format, meanScore, nextAiringEpisode, popularity, ranges, selectedRange, status,
      trailer, trending, genres, episodesData
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    // Process each anime update one by one
    for (const anime of animeArray) {
      await new Promise((resolve, reject) => {
        db.get(selectSql, [anime.id], (err, row) => {
          if (err) {
            return reject(err); // Stop the process if there's an error
          }

          // Merge the new values with the old ones
          const updatedRecord = {
            id: anime.id,
            idMal: anime.idMal ?? row?.idMal,
            title: anime.title ?? row?.title,
            episodes: anime.episodes ?? row?.episodes,
            bannerImage: anime.bannerImage ?? row?.bannerImage,
            coverImage: anime.coverImage ?? row?.coverImage,
            description: anime.description ?? row?.description,
            format: anime.format ?? row?.format,
            meanScore: anime.meanScore ?? row?.meanScore,
            nextAiringEpisode: anime.nextAiringEpisode ?? row?.nextAiringEpisode,
            popularity: anime.popularity ?? row?.popularity,
            ranges: anime.ranges ?? row?.ranges,
            selectedRange: selectedRange ?? row?.selectedRange,
            status: anime.status ?? row?.status,
            trailer: anime.trailer ?? row?.trailer,
            trending: anime.trending ?? row?.trending,
            genres: anime.genres ?? row?.genres,
            episodesData: anime.episodesData ? JSON.stringify(anime.episodesData) : row?.episodesData
          };

          // Execute the SQL query
          db.run(sql, [
            updatedRecord.id, updatedRecord.idMal, updatedRecord.title,
            updatedRecord.episodes, updatedRecord.bannerImage, updatedRecord.coverImage,
            updatedRecord.description, updatedRecord.format, updatedRecord.meanScore,
            updatedRecord.nextAiringEpisode, updatedRecord.popularity, updatedRecord.ranges, updatedRecord.selectedRange,
            updatedRecord.status, updatedRecord.trailer, updatedRecord.trending, updatedRecord.genres,
            updatedRecord.episodesData
          ], function (err) {
            if (err) {
              return reject(err); // Reject the promise if there's an error
            }
            resolve(); // Resolve the promise when done
          });
        });
      });
    }

    // Send a single response once all the anime updates are done
    res.status(200).json({ success: `${animeArray.length} anime records updated successfully.` });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/get-anime/:id', (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT * FROM anime WHERE id = ?
  `;

  db.get(sql, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({ error: 'Anime not found.' });
    }

    try {
      row.episodesData = JSON.parse(row.episodesData || '[]'); // Parse JSON string, default to empty array if null
    } catch (parseError) {
      return res.status(500).json({ error: 'Failed to parse episodes data.' });
    }

    res.status(200).json(row);
  });
});

// Batch fetch anime data by array of IDs
app.post('/get-anime-batch', async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: 'Input must be an array of IDs.' });
  }

  const placeholders = ids.map(() => '?').join(','); // Create a string like '?, ?, ?'
  const sql = `SELECT * FROM anime WHERE id IN (${placeholders})`;

  db.all(sql, ids, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const result = {};
    rows.forEach(row => {
      try {
        row.episodesData = JSON.parse(row.episodesData || '[]'); // Parse JSON string, default to empty array if null
      } catch (parseError) {
        return res.status(500).json({ error: 'Failed to parse episodes data.' });
      }
      result[row.id] = row;
    });

    res.status(200).json(result); // Return an object with each id as the key
  });
});

app.post('/update-history', (req, res) => {
  const { idAndEpisode, date } = req.body;
  console.log(idAndEpisode)

  // SQL query to insert or replace the record
  const sql = `
    INSERT OR REPLACE INTO history (
      idAndEpisode, date
    ) VALUES (?, ?)
  `;

  // Execute the SQL query
  db.run(sql, [idAndEpisode, date], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(200).json({ success: `History updated.` });
  });
});

app.get('/get-history', (req, res) => {
  const sql = `SELECT * FROM history`;

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(200).json(rows);
  });
});

// Delete a history entry by idAndEpisode
app.delete('/delete-history/:idAndEpisode', (req, res) => {
  const { idAndEpisode } = req.params;

  const sql = `DELETE FROM history WHERE idAndEpisode = ?`;

  db.run(sql, [idAndEpisode], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: `No history entry found for idAndEpisode: ${idAndEpisode}` });
    }

    res.status(200).json({ success: `History entry for ${idAndEpisode} deleted successfully.` });
  });
});

// Delete all history entries
app.delete('/delete-history-all', (req, res) => {
  const sql = `DELETE FROM history`;

  db.run(sql, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(200).json({ success: `All history entries deleted successfully.` });
  });
});

app.use((req, res) => {
  res.status(404).json({
    status: 404,
    error: 'Not Found',
  });
});

app.listen(port, '127.0.0.1', () => {
  console.log('Backend server listening on port %d in %s mode', port, app.settings.env);
});
