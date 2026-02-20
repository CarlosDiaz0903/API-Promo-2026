export class CarouselManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.warn("No se encontró el contenedor del carousel:", containerId);
      return;
    }

    this.track = this.container.querySelector('.carousel-track');
    this.slides = Array.from(this.container.querySelectorAll('.carousel-slide'));
    this.paginationContainer = document.getElementById('carouselPagination');

    this.currentIndex = 0;
    this.totalSlides = this.slides.length;
    this.autoplayInterval = null;
    this.autoplayDelay = 5000;          // 5 segundos (puedes cambiar a 6000)
    this.isAutoplayEnabled = true;
    this.isTransitioning = false;

    this.touchStartX = 0;
    this.touchEndX = 0;
    this.minSwipeDistance = 50;

    console.log(`Carousel inicializado - ${this.totalSlides} slides encontradas`);

    this.init();
  }

  init() {
    if (this.totalSlides === 0) {
      console.warn("No hay slides en el carousel");
      return;
    }

    this.createPagination();
    this.updateSlides();

    // Configuramos todo el autoplay y lo iniciamos
    this.setupAutoplay();
    this.startAutoplay();           // ← ¡Aquí iniciamos el autoplay!

    this.setupTouchControls();
    this.setupKeyboardControls();
    this.setupIntersectionObserver();

    // Opcional: prevenir menú contextual
    this.preventContextMenu();
  }

  createPagination() {
    if (!this.paginationContainer) return;

    this.paginationContainer.innerHTML = '';

    this.slides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.classList.add('carousel-dot');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Ir a imagen ${index + 1}`);
      dot.setAttribute('aria-selected', index === 0);

      if (index === 0) dot.classList.add('active');

      dot.addEventListener('click', () => this.goToSlide(index));

      this.paginationContainer.appendChild(dot);
    });
  }

  updateSlides() {
    // Limpiamos todas las clases primero
    this.slides.forEach(slide => {
      slide.classList.remove('active', 'prev', 'next');
    });

    const active = this.slides[this.currentIndex];
    const prev = this.slides[this.getPrevIndex()];
    const next = this.slides[this.getNextIndex()];

    if (active) active.classList.add('active');
    if (prev)  prev.classList.add('prev');
    if (next)  next.classList.add('next');

    // Forzamos reflow para que las transiciones CSS se apliquen bien
    void this.track.offsetHeight;

    this.updatePagination();
    this.updateARIA();
  }

  updatePagination() {
    if (!this.paginationContainer) return;

    const dots = this.paginationContainer.querySelectorAll('.carousel-dot');
    dots.forEach((dot, i) => {
      const isActive = i === this.currentIndex;
      dot.classList.toggle('active', isActive);
      dot.setAttribute('aria-selected', isActive);
    });
  }

  updateARIA() {
    this.slides.forEach((slide, i) => {
      slide.setAttribute('aria-hidden', i !== this.currentIndex);
    });
  }

  goToSlide(index) {
    if (this.isTransitioning || index === this.currentIndex) return;

    this.isTransitioning = true;
    this.currentIndex = (index + this.totalSlides) % this.totalSlides; // wrap seguro

    this.updateSlides();

    // Esperamos a que termine la animación (tu CSS usa 0.8s)
    setTimeout(() => {
      this.isTransitioning = false;
    }, 900); // un poco más para seguridad

    this.resetAutoplay();
  }

  next() {
    this.goToSlide(this.getNextIndex());
  }

  prev() {
    this.goToSlide(this.getPrevIndex());
  }

  getNextIndex() {
    return (this.currentIndex + 1) % this.totalSlides;
  }

  getPrevIndex() {
    return (this.currentIndex - 1 + this.totalSlides) % this.totalSlides;
  }

  // ────────────────────────────────────────────────
  // Autoplay
  // ────────────────────────────────────────────────

  setupAutoplay() {
    this.container.addEventListener('mouseenter', () => this.pauseAutoplay());
    this.container.addEventListener('mouseleave', () => this.resumeAutoplay());

    // En móviles es mejor pausar solo temporalmente
    this.container.addEventListener('touchstart', () => this.pauseAutoplay(), { passive: true });
    this.container.addEventListener('touchend',   () => setTimeout(() => this.resumeAutoplay(), 3000), { passive: true });
  }

  startAutoplay() {
    if (!this.isAutoplayEnabled || this.autoplayInterval) return;

    console.log("→ Autoplay iniciado (cada " + this.autoplayDelay/1000 + "s)");

    this.autoplayInterval = setInterval(() => {
      this.next();
    }, this.autoplayDelay);
  }

  pauseAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
      console.log("Autoplay pausado");
    }
  }

  resumeAutoplay() {
    if (this.isAutoplayEnabled && !this.autoplayInterval) {
      this.startAutoplay();
    }
  }

  resetAutoplay() {
    this.pauseAutoplay();
    this.resumeAutoplay();
  }

  // ────────────────────────────────────────────────
  // Touch / Swipe
  // ────────────────────────────────────────────────

  setupTouchControls() {
    this.container.addEventListener('touchstart', e => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.container.addEventListener('touchend', e => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }, { passive: true });
  }

  handleSwipe() {
    const diff = this.touchStartX - this.touchEndX;

    if (Math.abs(diff) < this.minSwipeDistance) return;

    if (diff > 0) {
      this.next();
    } else {
      this.prev();
    }
  }
  
  /**
   * Setup keyboard controls
   */
  setupKeyboardControls() {
    this.container.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.next();
      }
    });
  }
  
  /**
   * Setup Intersection Observer to pause when not visible
   */
  setupIntersectionObserver() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.resumeAutoplay();
          } else {
            this.pauseAutoplay();
          }
        });
      },
      { threshold: 0.5 }
    );
    
    observer.observe(this.container);
  }
  
  /**
   * Prevent context menu on images
   */
  preventContextMenu() {
    this.slides.forEach(slide => {
      const img = slide.querySelector('img');
      if (img) {
        img.addEventListener('contextmenu', (e) => e.preventDefault());
        img.addEventListener('dragstart', (e) => e.preventDefault());
      }
    });
  }
  
  /**
   * Destroy carousel and cleanup
   */
  destroy() {
    this.pauseAutoplay();
  }
}
