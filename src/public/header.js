(function () {
        const header = document.querySelector('header');
        if (!header) return;

        let lastScrollY = window.scrollY || 0;
        const threshold = 100; // sólo ocultar si pasó más de 100px
        let ticking = false;

        function onScroll() {
          const currentY = window.scrollY || 0;

          // si estamos por debajo del umbral, siempre mostrar
          if (currentY <= threshold) {
            header.classList.remove('hidden');
          } else {
            // si scrolleamos hacia abajo -> ocultar; hacia arriba -> mostrar
            if (currentY > lastScrollY) {
              header.classList.add('hidden');
            } else {
              header.classList.remove('hidden');
            }
          }

          lastScrollY = currentY;
          ticking = false;
        }

        window.addEventListener('scroll', function () {
          if (!ticking) {
            window.requestAnimationFrame(onScroll);
            ticking = true;
          }
        }, { passive: true });
      })();


// drop
document.addEventListener('DOMContentLoaded', () => {
  const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

  function closeAllDropdowns(except = null) {
    document.querySelectorAll('.nav-item.open').forEach(li => {
      if (li !== except) {
        li.classList.remove('open');
        const btn = li.querySelector('.dropdown-toggle');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // toggle por boton (útil en móvil)
  dropdownToggles.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const li = btn.closest('.nav-item');
      const isOpen = li.classList.contains('open');
      if (isOpen) {
        li.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      } else {
        closeAllDropdowns(li);
        li.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        // opcional: enfocar primer item del menú
        const first = li.querySelector('.dropdown-menu a');
        if (first) first.focus();
      }
    });

    // Soporte teclado básico: Enter / Space abre/cierra
    btn.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        btn.click();
      } else if (ev.key === 'Escape') {
        // cerrar todo
        closeAllDropdowns();
        btn.focus();
      }
    });
  });

  // Cerrar si clic fuera del menú
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-item.dropdown')) {
      closeAllDropdowns();
    }
  });

  // Cerrar con Escape cuando el foco está dentro del dropdown
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDropdowns();
    }
  });
});

const hamb = document.getElementById('hamburger');
const navMenu = document.querySelector('.nav-menu');

hamb.addEventListener('click', () => {
  navMenu.classList.toggle('open');
});
