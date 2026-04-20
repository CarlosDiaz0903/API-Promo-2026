/* ══════════════════════════════════════════
   MAIN.JS — Interactividad completa
   ══════════════════════════════════════════ */

'use strict';

/* ── TABS ── */
function initTabs() {
  const tabs   = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.panel');

  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.panel;
      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('panel-' + target).classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      updateAuthorFloatLabel();
      updateSideProgress();
    });
  });

  // Author dot buttons (mobile)
  document.querySelectorAll('.author-dot-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.dataset.panel;
      document.querySelector(`.tab-btn[data-panel="${panel}"]`)?.click();
      document.querySelectorAll('.author-dot-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

/* ── SIDEBAR ── */
function initSidebar() {
  const sideLinks = document.querySelectorAll('.side-link');

  sideLinks.forEach(link => {
    link.addEventListener('click', () => {
      const id = link.dataset.sec;
      const activePanel = document.querySelector('.panel.active');
      if (!activePanel) return;
      const target = activePanel.querySelector('#' + id);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function updateSidebar() {
  const sideLinks = document.querySelectorAll('.side-link');
  const activePanel = document.querySelector('.panel.active');
  if (!activePanel) return;
  const sections = activePanel.querySelectorAll('.sec-wrap[id]');
  let current = null;
  sections.forEach(s => {
    const rect = s.getBoundingClientRect();
    if (rect.top <= 130) current = s.id;
  });
  sideLinks.forEach(l => {
    const isActive = l.dataset.sec === current || (!current && l.dataset.sec === 'bio');
    l.classList.toggle('active', isActive);
  });
  updateSideProgress();
}

function updateSideProgress() {
  const sideLinks = document.querySelectorAll('.side-link');
  const activeIdx = Array.from(sideLinks).findIndex(l => l.classList.contains('active'));
  const fill = document.querySelector('.side-progress-fill');
  if (fill) {
    const pct = ((activeIdx + 1) / sideLinks.length) * 100;
    fill.style.width = Math.max(10, pct) + '%';
    fill.style.background = 'var(--a)';
  }
}

/* ── DARK MODE ── */
function initTheme() {
  const toggle = document.getElementById('theme-toggle');
  const icon   = document.getElementById('tt-icon');
  const label  = document.getElementById('tt-label');
  const html   = document.documentElement;

  if (localStorage.getItem('theme') === 'dark') applyTheme(true);

  toggle.addEventListener('click', () => {
    const dark = html.classList.toggle('dark');
    applyTheme(dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  });

  function applyTheme(on) {
    html.classList.toggle('dark', on);
    icon.textContent  = on ? '🌙' : '☀️';
    label.textContent = on ? 'Oscuro' : 'Claro';
  }
}

/* ── READING MODE ── */
function initReadingMode() {
  const btn = document.getElementById('reading-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    document.body.classList.toggle('reading-mode');
    btn.classList.toggle('active');
    btn.querySelector('.rt-label').textContent =
      document.body.classList.contains('reading-mode') ? 'Normal' : 'Lectura';
  });
}

/* ── PROGRESS BAR + RING ── */
function initProgress() {
  const bar = document.getElementById('progress-bar');
  const ring = document.querySelector('.reading-progress-ring circle');

  function update() {
    const el = document.documentElement;
    const total = el.scrollHeight - el.clientHeight;
    const pct = total > 0 ? (el.scrollTop / total) * 100 : 0;
    const clamped = Math.min(pct, 100);
    bar.style.width = clamped + '%';

    if (ring) {
      ring.style.strokeDashoffset = 100 - clamped;
      const activeTab = document.querySelector('.tab-btn.active');
      if (activeTab) {
        const color = getComputedStyle(document.querySelector('.panel.active')).getPropertyValue('--a').trim();
        ring.style.stroke = color || '#5b4a8a';
        bar.style.background = `linear-gradient(90deg, ${color || '#5b4a8a'}, #a0a0d4)`;
      }
    }
  }

  window.addEventListener('scroll', update, { passive: true });
}

/* ── SCROLL TOP ── */
function initScrollTop() {
  const btn = document.getElementById('scroll-top');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ── AUTHOR FLOAT LABEL ── */
function updateAuthorFloatLabel() {
  const lbl = document.getElementById('author-float-label');
  if (!lbl) return;
  const activeTab = document.querySelector('.tab-btn.active');
  if (activeTab) {
    lbl.textContent = activeTab.textContent.replace(/\d+/, '').trim();
    lbl.style.background = 'var(--a)';
  }
}

function initAuthorFloatLabel() {
  const lbl = document.getElementById('author-float-label');
  if (!lbl) return;
  window.addEventListener('scroll', () => {
    lbl.classList.toggle('visible', window.scrollY > 200);
  }, { passive: true });
}

/* ── SEARCH ── */
function initSearch() {
  const input     = document.getElementById('search-input');
  const clearBtn  = document.querySelector('.search-clear-btn');
  const noResults = document.querySelector('.search-no-results');
  let timeout;

  input.addEventListener('input', () => {
    clearTimeout(timeout);
    const hasVal = input.value.trim().length > 0;
    clearBtn.classList.toggle('visible', hasVal);

    timeout = setTimeout(() => {
      const q = input.value.trim().toLowerCase();
      // Remove previous marks
      document.querySelectorAll('mark').forEach(m => {
        const parent = m.parentNode;
        parent.replaceChild(document.createTextNode(m.textContent), m);
        parent.normalize();
      });
      if (noResults) noResults.classList.remove('visible');
      if (!q) return;

      const activePanel = document.querySelector('.panel.active');
      if (!activePanel) return;

      const walker = document.createTreeWalker(activePanel, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) {
        if (walker.currentNode.textContent.toLowerCase().includes(q)) nodes.push(walker.currentNode);
      }

      nodes.forEach(node => {
        const parent = node.parentNode;
        if (['SCRIPT', 'STYLE'].includes(parent.tagName)) return;
        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const parts = node.textContent.split(new RegExp(`(${escaped})`, 'gi'));
        const frag = document.createDocumentFragment();
        parts.forEach(p => {
          if (p.toLowerCase() === q) {
            const mark = document.createElement('mark');
            mark.textContent = p;
            frag.appendChild(mark);
          } else {
            frag.appendChild(document.createTextNode(p));
          }
        });
        parent.replaceChild(frag, node);
      });

      const firstMark = activePanel.querySelector('mark');
      if (firstMark) {
        firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (noResults) {
        noResults.classList.add('visible');
      }
    }, 250);
  });

  clearBtn?.addEventListener('click', () => {
    input.value = '';
    input.dispatchEvent(new Event('input'));
    input.focus();
  });

  // Keyboard shortcut: Cmd/Ctrl+K
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      input.focus();
      input.select();
    }
    if (e.key === 'Escape' && document.activeElement === input) {
      input.blur();
    }
  });
}

/* ── COPY BUTTONS ── */
function initCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.text || btn.closest('[data-copytext]')?.dataset.copytext || '';
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        btn.classList.add('copied');
        btn.textContent = '✓ Copiado';
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = '⎘ Copiar';
        }, 1800);
      });
    });
  });
}

/* ── SCROLL LISTENER AGGREGATOR ── */
function initScrollListeners() {
  window.addEventListener('scroll', () => {
    updateSidebar();
  }, { passive: true });
}

/* ── INIT ALL ── */
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initSidebar();
  initTheme();
  initReadingMode();
  initProgress();
  initScrollTop();
  initSearch();
  initCopyButtons();
  initScrollListeners();
  initAuthorFloatLabel();
  updateSideProgress();
});
