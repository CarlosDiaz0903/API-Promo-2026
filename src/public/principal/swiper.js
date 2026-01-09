document.querySelector('.carrusel-container').addEventListener('contextmenu', (e) => {
  e.preventDefault();
  return false;
});

// Opcional: bloquea arrastre de imágenes
document.querySelectorAll('.stack-item').forEach(img => {
  img.addEventListener('dragstart', (e) => {
    e.preventDefault();
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const stack = document.querySelector('.carrusel-stack');
  const items = document.querySelectorAll('.stack-item');
  const dotsContainer = document.querySelector('.carrusel-pagination');
  const total = items.length - 2; // Restamos las duplicadas para loop
  let current = 0;

  const carruselContainer = document.querySelector('.carrusel-container');
  let autoplayInterval = setInterval(next, 5000);

  carruselContainer.addEventListener('mouseenter', () => {
    clearInterval(autoplayInterval);
  });

  carruselContainer.addEventListener('mouseleave', () => {
    autoplayInterval = setInterval(next, 5000);
  });

  // Crear dots
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('div');
    dot.classList.add('dot');
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  }

  const dots = document.querySelectorAll('.dot');

  function update() {
    items.forEach((item, index) => {
      item.classList.remove('active', 'next');

      // Calculamos posición real considerando duplicadas
      let pos = index - current;
      if (pos < 0) pos += total;

      if (pos === 0) item.classList.add('active');
      if (pos === 1) item.classList.add('next');
    });

    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function next() {
    current = (current + 1) % total;
    // Para transición suave con duplicadas
    if (current === 0) {
      stack.style.transition = 'none';
      stack.style.transform = 'translateX(0)';
      setTimeout(() => { stack.style.transition = 'all 0.6s ease-in-out'; }, 50);
    }
    update();
  }

  function goTo(index) {
    current = index;
    update();
  }

  update(); // Inicial

  // Auto-play
  setInterval(next, 5000); // Cambia cada 5 segundos, ajusta si querés
});