/**
 * Countdown Module
 * Animated countdown timer with confetti celebration
 */

export class CountdownManager {
  constructor(targetDate) {
    this.targetDate = new Date(targetDate).getTime();
    this.elements = {
      days: document.getElementById('days'),
      hours: document.getElementById('hours'),
      minutes: document.getElementById('minutes'),
      seconds: document.getElementById('seconds')
    };
    
    this.previousValues = {
      days: null,
      hours: null,
      minutes: null,
      seconds: null
    };
    
    this.updateInterval = null;
    this.isComplete = false;
    
    this.init();
  }
  
  init() {
    if (!this.validateElements()) return;
    
    this.update();
    this.startCountdown();
  }
  
  /**
   * Validate all required elements exist
   */
  validateElements() {
    return Object.values(this.elements).every(el => el !== null);
  }
  
  /**
   * Start countdown interval
   */
  startCountdown() {
    this.updateInterval = setInterval(() => {
      this.update();
    }, 1000);
  }
  
  /**
   * Update countdown display
   */
  update() {
    const now = new Date().getTime();
    const distance = this.targetDate - now;
    
    if (distance < 0) {
      this.complete();
      return;
    }
    
    const time = this.calculateTime(distance);
    this.updateDisplay(time);
  }
  
  /**
   * Calculate time values
   */
  calculateTime(distance) {
    return {
      days: Math.floor(distance / (1000 * 60 * 60 * 24)),
      hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((distance % (1000 * 60)) / 1000)
    };
  }
  
  /**
   * Update display with animation
   */
  updateDisplay(time) {
    Object.keys(time).forEach(unit => {
      const value = time[unit];
      const element = this.elements[unit];
      
      if (!element) return;
      
      // Check if value changed
      if (this.previousValues[unit] !== value) {
        this.animateChange(element, value, unit);
        this.previousValues[unit] = value;
      }
    });
  }
  
  /**
   * Animate number change
   */
  animateChange(element, value, unit) {
    const digits = element.querySelectorAll('.digit');
    const valueStr = this.formatValue(value, unit);
    
    digits.forEach((digit, index) => {
      const newDigit = valueStr[index] || '0';
      
      if (digit.textContent !== newDigit) {
        // Add flip animation
        digit.classList.add('flip');
        
        // Update value after animation starts
        setTimeout(() => {
          digit.textContent = newDigit;
        }, 300);
        
        // Remove animation class
        setTimeout(() => {
          digit.classList.remove('flip');
        }, 600);
      }
    });
  }
  
  /**
   * Format value with leading zeros
   */
  formatValue(value, unit) {
    const length = unit === 'days' ? 3 : 2;
    return value.toString().padStart(length, '0');
  }
  
  /**
   * Handle countdown completion
   */
  complete() {
    if (this.isComplete) return;
    
    this.isComplete = true;
    clearInterval(this.updateInterval);
    
    // Set all to zeros
    Object.keys(this.elements).forEach(unit => {
      const element = this.elements[unit];
      if (!element) return;
      
      const digits = element.querySelectorAll('.digit');
      digits.forEach(digit => {
        digit.textContent = '0';
      });
    });
    
    // Add celebration class
    const countdownTimer = document.getElementById('countdownTimer');
    if (countdownTimer) {
      countdownTimer.classList.add('countdown-complete');
    }
    
    // Trigger confetti celebration
    this.celebrate();
  }
  
  /**
   * Celebration with confetti
   */
  celebrate() {
    if (typeof confetti === 'undefined') return;
    
    const duration = 5000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    
    const randomInRange = (min, max) => Math.random() * (max - min) + min;
    
    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }
      
      const particleCount = 50 * (timeLeft / duration);
      
      // Create confetti from random positions
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
    
    // Play sound if available
    this.playSound();
  }
  
  /**
   * Play celebration sound
   */
  playSound() {
    // Optional: Add sound effect
    // const audio = new Audio('/sounds/celebration.mp3');
    // audio.play().catch(() => {});
  }
  
  /**
   * Get remaining time in readable format
   */
  getRemainingTime() {
    const now = new Date().getTime();
    const distance = this.targetDate - now;
    
    if (distance < 0) {
      return 'Countdown complete!';
    }
    
    const time = this.calculateTime(distance);
    return `${time.days}d ${time.hours}h ${time.minutes}m ${time.seconds}s`;
  }
  
  /**
   * Destroy countdown and cleanup
   */
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}
