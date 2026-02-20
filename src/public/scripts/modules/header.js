/**
 * Header Module
 * Handles navigation, dropdown menus, and scroll behavior
 */

export class HeaderManager {
  constructor() {
    this.header = document.getElementById('mainHeader');
    this.hamburger = document.getElementById('hamburger');
    this.navMenu = document.getElementById('navMenu');
    this.dropdowns = document.querySelectorAll('.nav-item.dropdown');
    
    this.lastScrollY = 0;
    this.scrollThreshold = 100;
    this.isMenuOpen = false;
    this.ticking = false;
    
    this.init();
  }
  
  init() {
    if (!this.header) return;
    
    this.setupScrollBehavior();
    this.setupMobileMenu();
    this.setupDropdowns();
    this.setupKeyboardNavigation();
  }
  
  /**
   * Setup scroll hide/show behavior
   */
  setupScrollBehavior() {
    window.addEventListener('scroll', () => {
      if (!this.ticking) {
        window.requestAnimationFrame(() => {
          this.handleScroll();
          this.ticking = false;
        });
        this.ticking = true;
      }
    }, { passive: true });
  }
  
  handleScroll() {
    const currentScrollY = window.scrollY;
    
    // Add scrolled class for styling
    if (currentScrollY > 50) {
      this.header.classList.add('scrolled');
    } else {
      this.header.classList.remove('scrolled');
    }
    
    // Hide/show header based on scroll direction
    if (currentScrollY <= this.scrollThreshold) {
      this.header.classList.remove('hidden');
    } else {
      if (currentScrollY > this.lastScrollY) {
        this.header.classList.add('hidden');
        this.closeAllDropdowns();
      } else {
        this.header.classList.remove('hidden');
      }
    }
    
    this.lastScrollY = currentScrollY;
  }
  
  /**
   * Setup mobile hamburger menu
   */
  setupMobileMenu() {
    if (!this.hamburger || !this.navMenu) return;
    
    this.hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMobileMenu();
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (this.isMenuOpen && 
          !this.navMenu.contains(e.target) && 
          !this.hamburger.contains(e.target)) {
        this.closeMobileMenu();
      }
    });
    
    // Close menu when clicking nav links
    this.navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 868) {
          this.closeMobileMenu();
        }
      });
    });
  }
  
  toggleMobileMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    this.navMenu.classList.toggle('open');
    this.hamburger.setAttribute('aria-expanded', this.isMenuOpen);
    
    // Prevent body scroll when menu is open
    if (this.isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
  
  closeMobileMenu() {
    this.isMenuOpen = false;
    this.navMenu.classList.remove('open');
    this.hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  
  /**
   * Setup dropdown menus
   */
  setupDropdowns() {
    this.dropdowns.forEach(dropdown => {
      const toggle = dropdown.querySelector('.dropdown-toggle');
      const menu = dropdown.querySelector('.dropdown-menu');
      
      if (!toggle || !menu) return;
      
      // Click handler
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggleDropdown(dropdown);
      });
      
      // Keyboard support
      toggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggleDropdown(dropdown);
        } else if (e.key === 'Escape') {
          this.closeDropdown(dropdown);
          toggle.focus();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.openDropdown(dropdown);
          const firstLink = menu.querySelector('a');
          if (firstLink) firstLink.focus();
        }
      });
      
      // Menu link navigation
      menu.querySelectorAll('a').forEach((link, index, links) => {
        link.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextLink = links[index + 1];
            if (nextLink) nextLink.focus();
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevLink = links[index - 1];
            if (prevLink) {
              prevLink.focus();
            } else {
              toggle.focus();
            }
          } else if (e.key === 'Escape') {
            e.preventDefault();
            this.closeDropdown(dropdown);
            toggle.focus();
          }
        });
      });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-item.dropdown')) {
        this.closeAllDropdowns();
      }
    });
  }
  
  toggleDropdown(dropdown) {
    const isOpen = dropdown.classList.contains('open');
    
    if (isOpen) {
      this.closeDropdown(dropdown);
    } else {
      this.closeAllDropdowns();
      this.openDropdown(dropdown);
    }
  }
  
  openDropdown(dropdown) {
    dropdown.classList.add('open');
    const toggle = dropdown.querySelector('.dropdown-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
  }
  
  closeDropdown(dropdown) {
    dropdown.classList.remove('open');
    const toggle = dropdown.querySelector('.dropdown-toggle');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }
  
  closeAllDropdowns() {
    this.dropdowns.forEach(dropdown => this.closeDropdown(dropdown));
  }
  
  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Close all dropdowns on Escape
      if (e.key === 'Escape') {
        this.closeAllDropdowns();
        if (this.isMenuOpen) {
          this.closeMobileMenu();
        }
      }
    });
  }
}
