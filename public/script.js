const formulario = document.getElementById('form');
const resultado = document.getElementById('resultado');

formulario.addEventListener('submit', function (e) {
  e.preventDefault();

  resultado.textContent = 'Cargando...';

  const enlace = formulario.url.value;

  fetch('/transcribir', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url: enlace })
  })
  .then(res => res.json())
  .then(data => {
    if (data.texto) {
      resultado.textContent = data.texto;
    } else {
      resultado.textContent = 'No se pudo transcribir.';
    }
  })
  .catch(err => {
    resultado.textContent = 'Error: ' + err.message;
  });
});