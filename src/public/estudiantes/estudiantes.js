/**
 * Students Page Entry Point
 * Reutiliza componentes del sistema principal
 */

// Import shared modules from main app
import { HeaderManager } from '../scripts/modules/header.js';
import { 
  AOSManager, 
  PageLoader,
  smoothScroll
} from '../scripts/modules/utils.js';

/**
 * Students Page Class
 */
class StudentsPage {
  constructor() {
    this.modules = {};
    this.isInitialized = false;
  }
  
  /**
   * Initialize the page
   */
  async init() {
    if (this.isInitialized) return;
    
    console.log('🎓 Initializing Students Page...');
    
    // Wait for DOM
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }
    
    // Initialize modules
    this.initializeModules();
    
    // Setup page-specific features
    this.setupCardInteractions();
    this.setupKeyboardNavigation();
    
    // Hide loader
    await this.hideLoader();
    
    this.isInitialized = true;
    console.log('✅ Students Page initialized');
  }
  
  /**
   * Initialize modules
   */
  initializeModules() {
    try {
      // Header (reutilizado)
      this.modules.header = new HeaderManager();
      
      // Animate On Scroll (reutilizado)
      this.modules.aos = new AOSManager({
        threshold: 0.15,
        rootMargin: '0px 0px -10% 0px'
      });
      
      console.log('📦 Modules initialized');
    } catch (error) {
      console.error('❌ Error initializing modules:', error);
    }
  }
  
  /**
   * Setup card interactions
   */
  setupCardInteractions() {
    const cards = document.querySelectorAll('.classroom-card');
    
    cards.forEach(card => {
      // Add ripple effect on click
      card.addEventListener('click', (e) => {
        this.createRipple(e, card);
      });
      
      // Track card interactions
      card.addEventListener('mouseenter', () => {
        this.trackCardHover(card);
      });
      
      // Preload next page on hover (performance optimization)
      card.addEventListener('mouseenter', () => {
        const href = card.getAttribute('href');
        if (href) {
          this.preloadPage(href);
        }
      }, { once: true });
    });
  }
  
  /**
   * Create ripple effect
   */
  createRipple(event, element) {
    const ripple = document.createElement('div');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: rgba(255, 211, 116, 0.3);
      left: ${x}px;
      top: ${y}px;
      pointer-events: none;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      z-index: 10;
    `;
    
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }
  
  /**
   * Track card hover for analytics (placeholder)
   */
  trackCardHover(card) {
    const cardName = card.querySelector('.card-title')?.textContent;
    console.log(`📊 Card hovered: ${cardName}`);
    // Here you could send analytics event
  }
  
  /**
   * Preload page for better UX
   */
  preloadPage(url) {
    if (!url || url.startsWith('#')) return;
    
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
    
    console.log(`⚡ Preloading: ${url}`);
  }
  
  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    const cards = Array.from(document.querySelectorAll('.classroom-card'));
    
    cards.forEach((card, index) => {
      card.addEventListener('keydown', (e) => {
        // Enter or Space to activate
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
        
        // Arrow navigation
        if (e.key === 'ArrowDown' && cards[index + 1]) {
          e.preventDefault();
          cards[index + 1].focus();
        }
        
        if (e.key === 'ArrowUp' && cards[index - 1]) {
          e.preventDefault();
          cards[index - 1].focus();
        }
      });
      
      // Make cards focusable
      if (!card.hasAttribute('tabindex')) {
        card.setAttribute('tabindex', '0');
      }
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
   * Cleanup
   */
  destroy() {
    console.log('🧹 Cleaning up Students Page...');
    
    Object.values(this.modules).forEach(module => {
      if (module && typeof module.destroy === 'function') {
        module.destroy();
      }
    });
    
    this.modules = {};
    this.isInitialized = false;
  }
}

/**
 * Add ripple animation styles
 */
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    from {
      transform: scale(0);
      opacity: 1;
    }
    to {
      transform: scale(2);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

/**
 * Initialize page
 */
const studentsPage = new StudentsPage();
studentsPage.init().catch(error => {
  console.error('❌ Failed to initialize Students Page:', error);
});


export default studentsPage;
