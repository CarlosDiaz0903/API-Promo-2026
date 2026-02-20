/**
 * Classroom Page - 5TO A
 * Main entry point - Integrates all components
 */

// Import shared modules
import { HeaderManager } from '../../scripts/modules/header.js';
import { AOSManager, PageLoader } from '../../scripts/modules/utils.js';

// Import modal functionality (mantener original)
import { openStudentModal } from '../salon-style/modal/modal.js';
import { calculateGeneralGrade } from '../salon-style/modal/modal-performance.js';

/**
 * Classroom Page Manager
 */
class ClassroomPage {
  constructor() {
    this.modules = {};
    this.classId = document.body.dataset.class;
    this.students = [];
    this.filteredStudents = [];
    this.gradesData = null;
    this.isInitialized = false;
  }

  /**
   * Initialize page
   */
  async init() {
    if (this.isInitialized) return;

    console.log(`🎓 Initializing ${this.classId} Classroom Page...`);

    // Wait for DOM
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    // Initialize modules
    this.initializeModules();

    // Load data
    await this.loadData();
    if (this.students.length === 0) {
      console.warn("¡Ningún estudiante encontrado! Revisa classId y students.json");
    }

    // Setup components
    this.setupStats();
    this.setupSearch();
    this.renderStudents();

    // Hide loader
    await this.hideLoader();

    this.isInitialized = true;
    console.log('✅ Classroom page initialized');
  }

  /**
   * Initialize modules
   */
  initializeModules() {
    try {
      // Header (reutilizado)
      this.modules.header = new HeaderManager();

      // AOS (reutilizado)
      this.modules.aos = new AOSManager({
        threshold: 0.1,
        rootMargin: '0px 0px -10% 0px'
      });

      console.log('📦 Modules initialized');
    } catch (error) {
      console.error('❌ Error initializing modules:', error);
    }
  }

  /**
   * Load students and grades data
   */
  async loadData() {
    try {
      console.log("Intentando cargar datos... classId =", this.classId);

      const [studentsRes, gradesRes] = await Promise.all([
        fetch('../database/students.json'),
        fetch('../database/grades/2025-B4.json')
      ]);

      if (!studentsRes.ok) throw new Error(`students.json → ${studentsRes.status}`);
      if (!gradesRes.ok)  throw new Error(`grades → ${gradesRes.status}`);

      const studentsData = await studentsRes.json();
      this.gradesData = await gradesRes.json();

      console.log("students.json cargado, keys:", Object.keys(studentsData));

      const allStudents = Array.isArray(studentsData)
        ? studentsData
        : studentsData.students || [];

      console.log("Total estudiantes crudos:", allStudents.length);

      this.students = allStudents.filter(s => {
        const match = s.currentClass === this.classId;
        if (match) console.log("Estudiante encontrado:", s.name, s.currentClass);
        return match;
      });

      this.filteredStudents = [...this.students];

      console.log(`→ Filtrados ${this.students.length} estudiantes para ${this.classId}`);
    } catch (error) {
      console.error('❌ Error grave al cargar datos:', error);
    }
  }

  /**
   * Setup stats cards with animations
   */
  setupStats() {
    // Total students
    const totalEl = document.getElementById('totalStudents');
    if (totalEl) {
      this.animateCounter(totalEl, this.students.length);
    }

    // Average grade
    const avgEl = document.getElementById('averageGrade');
    if (avgEl && this.students.length > 0) {
      const avgGrade = this.calculateClassAverage();
      avgEl.textContent = avgGrade;
    }

    // Approved percentage
    const approvedEl = document.getElementById('approvedPercent');
    if (approvedEl) {
      const approved = this.students.filter(s => s.approved).length;
      const percent = Math.round((approved / this.students.length) * 100);
      this.animateCounter(approvedEl, percent);
    }
  }

  /**
   * Calculate class average grade
   */
  calculateClassAverage() {
    const grades = this.students
      .map(s => this.gradesData.grades?.[s.internalId])
      .filter(Boolean);

    if (grades.length === 0) return '—';

    // Flatten all grades
    const allGrades = grades.flatMap(g =>
      Object.values(g).flat()
    );

    // Create temporary grades object for calculation
    const tempGrades = Object.fromEntries(
      allGrades.map((g, i) => [i, [g]])
    );

    return calculateGeneralGrade(tempGrades).grade;
  }

  /**
   * Counter animation
   */
  animateCounter(element, target, suffix = '', duration = 1500) {
    let start = 0;
    const startTime = performance.now();

    const update = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // ease-out-quart
      const value = Math.floor(eased * target);

      element.textContent = value + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = target + suffix;
      }
    };

    requestAnimationFrame(update);
  }

  /**
   * Setup search functionality
   */
  setupSearch() {
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClear');
    const searchBar = document.querySelector('.search-bar');
    const resultsInfo = document.getElementById('searchResults');
    const resultsCount = document.getElementById('resultsCount');

    if (!input) return;

    // Input handler
    input.addEventListener('input', () => {
      const query = input.value.trim().toLowerCase();

      // Toggle clear button
      if (query) {
        searchBar.classList.add('has-value');
      } else {
        searchBar.classList.remove('has-value');
      }

      // Filter students
      this.filteredStudents = this.students.filter(student =>
        student.name.toLowerCase().includes(query)
      );

      // Update results info
      if (query) {
        resultsCount.textContent = `${this.filteredStudents.length} resultado${this.filteredStudents.length !== 1 ? 's' : ''}`;
        resultsInfo.classList.add('visible');
      } else {
        resultsInfo.classList.remove('visible');
      }

      // Render filtered students
      this.renderStudents();
    });

    // Clear button
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        input.focus();
        searchBar.classList.remove('has-value');
        resultsInfo.classList.remove('visible');
        this.filteredStudents = [...this.students];
        this.renderStudents();
      });
    }

    // Keyboard shortcut (Ctrl/Cmd + K)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        input.focus();
      }
    });
  }

  /**
   * Render student cards
   */
  renderStudents() {
    const grid = document.getElementById('studentsGrid');
    const emptyState = document.getElementById('emptyState');

    if (!grid) return;

    // Clear grid
    grid.innerHTML = '';

    console.log("renderStudents → renderizando", this.filteredStudents.length, "tarjetas");

    // Show/hide empty state
    if (this.filteredStudents.length === 0) {
      emptyState.style.display = 'flex';
      grid.style.display = 'none';
      return;
    }

    emptyState.style.display = 'none';
    grid.style.display = 'grid';

    // Render cards
    this.filteredStudents.forEach((student, index) => {
      const card = this.createStudentCard(student, index);
      grid.appendChild(card);
    });

    // Mark grid as loaded for fade-in
    setTimeout(() => {
      grid.classList.add('loaded');
    }, 50);
  }

  /**
   * Create student card
   */
  createStudentCard(student, index) {
    const card = document.createElement('div');
    card.className = 'student-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Ver perfil de ${student.name}`);

    // Apply background
    this.applyCardBackground(card, student);

    // Get general grade
    const studentGrades = this.gradesData.grades?.[student.internalId];
    const generalLabel = studentGrades
      ? calculateGeneralGrade(studentGrades).grade
      : '—';

    // Determine photo
    const isUnknown = !student.photo;
    const photoSrc = isUnknown
      ? '../salon-style/tarjetas/unknown.png'
      : student.photo;

    // Build HTML
    card.innerHTML = `
      <div class="card-info">
        <div class="student-name">${student.name}</div>
        <div class="student-meta">
          <div>ID: ${student.schoolId}</div>
          <div>General: ${generalLabel}</div>
        </div>
      </div>
      <div class="card-photo">
        <img
          src="${photoSrc}"
          class="${isUnknown ? 'unknown-photo' : ''}"
          loading="lazy"
          alt="${student.name}"
        >
      </div>
    `;

    // Click handler - open modal
    card.addEventListener('click', () => {
      openStudentModal(student);
    });

    // Keyboard support
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openStudentModal(student);
      }
    });

    return card;
  }

  /**
   * Apply card background (gradient or image)
   */
  applyCardBackground(card, student) {
    if (student.profileTheme?.background) {
      card.style.backgroundImage = `url(${student.profileTheme.background})`;
      card.style.backgroundSize = 'cover';
      card.style.backgroundPosition = 'center';
    } else {
      const accent = student.profileTheme?.accentColor || '#333';

      if (accent.toLowerCase() === '#333') {
        card.style.backgroundColor = '#333';
      } else {
        const darker = this.darkenColor(accent, 0.4);
        card.style.backgroundImage = `linear-gradient(to left, ${accent}, ${darker})`;
      }
    }
  }

  /**
   * Darken color helper
   */
  darkenColor(hex, percent) {
    let num = parseInt(hex.replace('#', ''), 16);
    let r = (num >> 16) & 255;
    let g = (num >> 8) & 255;
    let b = num & 255;

    r = Math.max(0, Math.floor(r * (1 - percent)));
    g = Math.max(0, Math.floor(g * (1 - percent)));
    b = Math.max(0, Math.floor(b * (1 - percent)));

    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Hide page loader
   */
  async hideLoader() {
    const loader = new PageLoader('pageLoader');
    await loader.hide();
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    console.log('🧹 Cleaning up classroom page...');

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
 * Initialize page
 */
const classroomPage = new ClassroomPage();
classroomPage.init().catch(error => {
  console.error('❌ Failed to initialize classroom page:', error);
});

/**
 * Expose to window for debugging
 */
if (process.env.NODE_ENV === 'development') {
  window.__CLASSROOM_PAGE__ = classroomPage;
}

export default classroomPage;
