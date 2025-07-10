const form = document.getElementById('form');
const resultado = document.getElementById('resultado');
const spinner = document.getElementById('spinner');

form.addEventListener('submit', function (e) {
  e.preventDefault();

  resultado.textContent = '';
  spinner.classList.remove('hidden');

  const url = form.url.value;

  fetch('/transcribir', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url: url })
  })
    .then(function (res) {
      spinner.classList.add('hidden');
      return res.text();
    })
    .then(function (text) {
      console.log('Respuesta sin parsear: ' + text);

      try {
        const data = JSON.parse(text);

        if (data.texto) {
          resultado.innerHTML =
            '<p class="whitespace-pre-wrap text-justify leading-relaxed">' + data.texto + '</p>' +
            '<div class="flex justify-center items-center mt-4">' +
            '<a href="' + data.archivo + '" download class="bg-green-600 text-white flex justify-center items-center px-6 py-2 rounded hover:bg-green-700 transition">' +
            'Descargar transcripción en txt' +
            '</a>' +
            '</div>';
        } else {
          resultado.textContent = 'No se pudo transcribir.';
        }
      } catch (err) {
        resultado.textContent = 'Respuesta inválida del servidor:\n' + text;
      }
    })
    .catch(function (error) {
      spinner.classList.add('hidden');
      resultado.textContent = 'Error en la solicitud: ' + error.message;
    });
});