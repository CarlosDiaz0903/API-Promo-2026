/**
 * Main Application Entry Point
 * Initializes all modules and manages application lifecycle
 */

import { HeaderManager } from './modules/header.js';
import { CarouselManager } from './modules/carousel.js';
import { CountdownManager } from './modules/countdown.js';
import { 
  AOSManager, 
  PageLoader, 
  LazyLoader,
  preventFOUC,
  PerformanceMonitor 
} from './modules/utils.js';

/**
 * Application Class
 */
class App {
  constructor() {
    this.modules = {};
    this.isInitialized = false;
    this.performanceMonitor = new PerformanceMonitor();
  }
  
  /**
   * Initialize the application
   */
  async init() {
    if (this.isInitialized) return;
    
    console.log('🚀 Initializing Promo 2026 Website...');
    this.performanceMonitor.start('App Init');
    
    // Prevent FOUC
    preventFOUC();
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }
    
    // Initialize modules
    this.initializeModules();
    
    // Setup global event listeners
    this.setupEventListeners();
    
    // Hide page loader
    await this.hideLoader();
    
    this.isInitialized = true;
    this.performanceMonitor.end('App Init');
    
    console.log('✅ Application initialized successfully');
    
    // Log performance metrics
    window.addEventListener('load', () => {
      this.performanceMonitor.log();
    });
  }
  
  /**
   * Initialize all modules
   */
  initializeModules() {
    try {
      // Header
      this.modules.header = new HeaderManager();
      
      // Carousel
      this.modules.carousel = new CarouselManager('mainCarousel');
      
      // Countdown Timer
      // Target: December 18, 2026, 3:00 PM
      const targetDate = new Date('2026-12-18T15:00:00').getTime();
      this.modules.countdown = new CountdownManager(targetDate);
      
      // Animate On Scroll
      this.modules.aos = new AOSManager({
        threshold: 0.15,
        rootMargin: '0px 0px -10% 0px'
      });
      
      // Lazy Loading
      this.modules.lazyLoader = new LazyLoader();
      
      console.log('📦 Modules initialized:', Object.keys(this.modules));
    } catch (error) {
      console.error('❌ Error initializing modules:', error);
    }
  }
  
  /**
   * Setup global event listeners
   */
  setupEventListeners() {
    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleResize();
      }, 250);
    });
    
    // Handle visibility change (pause/resume animations)
    document.addEventListener('visibilitychange', () => {
      this.handleVisibilityChange();
    });
    
    // Smooth scroll for anchor links
    this.setupSmoothScroll();
    
    // Prevent right-click on images (optional)
    this.preventImageRightClick();
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    // Refresh AOS
    if (this.modules.aos) {
      this.modules.aos.refresh();
    }
    
    console.log('📐 Window resized');
  }
  
  /**
   * Handle visibility change
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // Page is hidden - pause animations
      if (this.modules.carousel) {
        this.modules.carousel.pauseAutoplay();
      }
    } else {
      // Page is visible - resume animations
      if (this.modules.carousel) {
        this.modules.carousel.resumeAutoplay();
      }
    }
  }
  
  /**
   * Setup smooth scroll for anchor links
   */
  setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#' || href === '') return;
        
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }
  
  /**
   * Prevent right-click on images
   */
  preventImageRightClick() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      img.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
      });
      
      img.addEventListener('dragstart', (e) => {
        e.preventDefault();
        return false;
      });
    });
  }
  
  /**
   * Hide page loader
   */
  async hideLoader() {
    const loader = new PageLoader('pageLoader');
    await loader.hide();
  }
  
  /**
   * Destroy application and cleanup
   */
  destroy() {
    console.log('🧹 Cleaning up application...');
    
    Object.values(this.modules).forEach(module => {
      if (module && typeof module.destroy === 'function') {
        module.destroy();
      }
    });
    
    this.modules = {};
    this.isInitialized = false;
    
    console.log('✅ Cleanup complete');
  }
}

/**
 * Initialize application when script loads
 */
const app = new App();
app.init().catch(error => {
  console.error('❌ Failed to initialize application:', error);
});

/**
 * Expose app to window for debugging
 */
if (process.env.NODE_ENV === 'development') {
  window.__APP__ = app;
}

/**
 * Hot Module Replacement (HMR) support
 */
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    app.destroy();
  });
}

export default app;
