/**
 * Utilities Module
 * Helper functions and utilities
 */

/**
 * Animate On Scroll (AOS) Implementation
 */
export class AOSManager {
  constructor(options = {}) {
    this.options = {
      threshold: 0.1,
      rootMargin: '0px 0px -10% 0px',
      ...options
    };
    
    this.observer = null;
    this.init();
  }
  
  init() {
    this.createObserver();
    this.observeElements();
  }
  
  createObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('aos-animate');
            
            // Optional: unobserve after animation
            if (!entry.target.hasAttribute('data-aos-repeat')) {
              this.observer.unobserve(entry.target);
            }
          } else if (entry.target.hasAttribute('data-aos-repeat')) {
            entry.target.classList.remove('aos-animate');
          }
        });
      },
      {
        threshold: this.options.threshold,
        rootMargin: this.options.rootMargin
      }
    );
  }
  
  observeElements() {
    const elements = document.querySelectorAll('[data-aos]');
    elements.forEach(el => {
      // Add delay if specified
      const delay = el.getAttribute('data-aos-delay');
      if (delay) {
        el.style.transitionDelay = `${delay}ms`;
      }
      
      this.observer.observe(el);
    });
  }
  
  refresh() {
    this.observeElements();
  }
  
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

/**
 * Page Loader
 */
export class PageLoader {
  constructor(loaderId = 'pageLoader') {
    this.loader = document.getElementById(loaderId);
    this.minDisplayTime = 500; // Minimum time to show loader
    this.startTime = Date.now();
  }
  
  async hide() {
    if (!this.loader) return;
    
    const elapsed = Date.now() - this.startTime;
    const remainingTime = Math.max(0, this.minDisplayTime - elapsed);
    
    // Wait for minimum display time
    await new Promise(resolve => setTimeout(resolve, remainingTime));
    
    // Add hidden class
    this.loader.classList.add('hidden');
    
    // Remove from DOM after transition
    setTimeout(() => {
      if (this.loader.parentNode) {
        this.loader.parentNode.removeChild(this.loader);
      }
    }, 500);
  }
}

/**
 * Smooth Scroll
 */
export function smoothScroll(target, duration = 1000) {
  const targetElement = typeof target === 'string' 
    ? document.querySelector(target) 
    : target;
    
  if (!targetElement) return;
  
  const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  let startTime = null;
  
  function animation(currentTime) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const run = ease(timeElapsed, startPosition, distance, duration);
    window.scrollTo(0, run);
    if (timeElapsed < duration) requestAnimationFrame(animation);
  }
  
  function ease(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  }
  
  requestAnimationFrame(animation);
}

/**
 * Debounce function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Get element offset
 */
export function getOffset(element) {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.pageYOffset,
    left: rect.left + window.pageXOffset,
    width: rect.width,
    height: rect.height
  };
}

/**
 * Check if element is in viewport
 */
export function isInViewport(element, offset = 0) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= -offset &&
    rect.left >= -offset &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + offset
  );
}

/**
 * Lazy load images
 */
export class LazyLoader {
  constructor(selector = 'img[loading="lazy"]') {
    this.images = document.querySelectorAll(selector);
    this.observer = null;
    this.init();
  }
  
  init() {
    if ('loading' in HTMLImageElement.prototype) {
      // Browser supports native lazy loading
      return;
    }
    
    // Fallback to Intersection Observer
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src || img.getAttribute('src');
            
            if (src) {
              img.src = src;
              img.classList.add('loaded');
              this.observer.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );
    
    this.images.forEach(img => this.observer.observe(img));
  }
  
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

/**
 * Prevent FOUC (Flash of Unstyled Content)
 */
export function preventFOUC() {
  document.documentElement.classList.add('preload');
  
  window.addEventListener('load', () => {
    setTimeout(() => {
      document.documentElement.classList.remove('preload');
    }, 100);
  });
}

/**
 * Add custom cursor (optional)
 */
export class CustomCursor {
  constructor() {
    this.cursor = this.createCursor();
    this.cursorDot = this.createCursorDot();
    this.init();
  }
  
  createCursor() {
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.style.cssText = `
      position: fixed;
      width: 40px;
      height: 40px;
      border: 2px solid rgba(255, 211, 116, 0.5);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      transition: transform 0.15s ease;
      transform: translate(-50%, -50%);
    `;
    document.body.appendChild(cursor);
    return cursor;
  }
  
  createCursorDot() {
    const dot = document.createElement('div');
    dot.className = 'custom-cursor-dot';
    dot.style.cssText = `
      position: fixed;
      width: 8px;
      height: 8px;
      background: rgba(255, 211, 116, 1);
      border-radius: 50%;
      pointer-events: none;
      z-index: 10000;
      transform: translate(-50%, -50%);
    `;
    document.body.appendChild(dot);
    return dot;
  }
  
  init() {
    document.addEventListener('mousemove', (e) => {
      this.cursor.style.left = e.clientX + 'px';
      this.cursor.style.top = e.clientY + 'px';
      
      this.cursorDot.style.left = e.clientX + 'px';
      this.cursorDot.style.top = e.clientY + 'px';
    });
    
    // Add hover effect for interactive elements
    const interactiveElements = document.querySelectorAll('a, button, [role="button"]');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        this.cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
      });
      
      el.addEventListener('mouseleave', () => {
        this.cursor.style.transform = 'translate(-50%, -50%) scale(1)';
      });
    });
  }
  
  destroy() {
    if (this.cursor) this.cursor.remove();
    if (this.cursorDot) this.cursorDot.remove();
  }
}

/**
 * Performance monitor (development only)
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {};
  }
  
  start(label) {
    this.metrics[label] = performance.now();
  }
  
  end(label) {
    if (this.metrics[label]) {
      const duration = performance.now() - this.metrics[label];
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
      delete this.metrics[label];
    }
  }
  
  log() {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
      
      console.log('📊 Performance Metrics:');
      console.log(`  Page Load: ${loadTime}ms`);
      console.log(`  DOM Ready: ${domReady}ms`);
    }
  }
}
