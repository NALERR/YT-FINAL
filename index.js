const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = 3000;

// básico
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Ruta de transcripción
app.post('/transcribir', (req, res) => {
  const url = req.body.url;

  if (!url) {
    res.status(400).send('No se recibió una URL');
    return;
  }

  const nombreAudio = 'audio-' + Date.now() + '.mp3';
  const rutaAudio = path.join(__dirname, nombreAudio);

  // Descargar con yt-dlp
  const descargar = spawn('yt-dlp', [
    '-x',
    '--audio-format', 'mp3',
    '-o', rutaAudio,
    url
  ]);

  descargar.stdout.on('data', (data) => {
    console.log('yt-dlp dice: ' + data.toString());
  });

  descargar.stderr.on('data', (data) => {
    console.log('yt-dlp error: ' + data.toString());
  });

  descargar.on('close', (codigo) => {
    if (codigo !== 0) {
      res.status(500).send('Error al descargar audio');
      return;
    }

    console.log('Audio descargado en:', rutaAudio);

    // Ejecutar script Python hecho completamente con ia
    const transcribir = spawn('python', ['transcribir.py', rutaAudio]);

    let texto = '';

    transcribir.stdout.on('data', (data) => {
      texto += data.toString();
    });

    transcribir.stderr.on('data', (data) => {
      console.log('Error en Python:', data.toString());
    });

    transcribir.on('close', (codigo) => {
      if (codigo === 0 && texto.trim().length > 0) {
        const nombreTxt = 'transcripcion-' + Date.now() + '.txt';
        const rutaTxt = path.join(__dirname, 'public', nombreTxt);

        fs.writeFile(rutaTxt, texto, (err) => {
          if (err) {
            console.log('No se pudo guardar el archivo:', err);
            res.status(500).send('Error al guardar el archivo');
            return;
          }

          res.json({
            texto: texto.trim(),
            archivo: '/' + nombreTxt
          });
        });
      } else {
        res.status(500).send('Error al transcribir');
      }

      // Borrar audio temporal
      fs.unlink(rutaAudio, (err) => {
        if (err) {
          console.log('No se pudo borrar el archivo:', err);
        }
      });
    });
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('Servidor corriendo en http://localhost:' + PORT);
});