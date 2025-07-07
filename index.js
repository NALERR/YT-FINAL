const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.post('/transcribir', async (req, res) => {
  const url = req.body.url;

  if (!url) {
    res.status(400).send('No hay URL');
    return;
  }

  const nombreArchivo = `audio-${Date.now()}.mp3`;
  const rutaAudio = path.join(__dirname, nombreArchivo);

  // Descargar el audio con yt-dlp
  const comando = spawn('yt-dlp', [
    '-x',
    '--audio-format', 'mp3',
    '-o', rutaAudio,
    url
  ]);

  comando.stdout.on('data', (data) => {
    console.log('yt-dlp dice:', data.toString());
  });

  comando.stderr.on('data', (data) => {
    console.log('yt-dlp error:', data.toString());
  });

  comando.on('close', async (code) => {
    if (code !== 0) {
      res.status(500).send('No se pudo descargar el audio');
      return;
    }

    console.log('Audio descargado:', rutaAudio);

    const form = new FormData();
    form.append('file', fs.createReadStream(rutaAudio));
    form.append('model', 'whisper-1');

    try {
      const respuesta = await axios.post('https://api.openai.com/v1/audio/transcriptions', form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      });

      const texto = respuesta.data.text;
      res.json({ texto });

      fs.unlink(rutaAudio, (err) => {
        if (err) {
          console.log('No se pudo borrar el audio:', err);
        } else {
          console.log('Audio borrado');
        }
      });

    } catch (err) {
      console.log('Error al transcribir:', err.message);
      res.status(500).send('Error al transcribir');
    }
  });
});

app.listen(PORT, () => {
  console.log('Servidor corriendo en http://localhost:' + PORT);
});