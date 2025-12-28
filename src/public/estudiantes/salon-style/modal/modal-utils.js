// ==============================
// MODAL UTILITIES
// ==============================

export function darkenColor(hex, percent) {
  let num = parseInt(hex.replace("#", ""), 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;

  r = Math.max(0, Math.floor(r * (1 - percent)));
  g = Math.max(0, Math.floor(g * (1 - percent)));
  b = Math.max(0, Math.floor(b * (1 - percent)));

  return `rgb(${r}, ${g}, ${b})`;
}

export function applyModalBackground(el, student) {
  if (student.profileTheme?.background) {
    el.style.backgroundImage = `url(${student.profileTheme.background})`;
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center";
  } else {
    const accent = student.profileTheme?.accentColor || "#333";

    if (accent.toLowerCase() === "#333") {
      el.style.background = "#333";
    } else {
      const darker = darkenColor(accent, 0.4);
      el.style.background =
        `linear-gradient(to right bottom, ${accent}, ${darker})`;
    }
  }
}
