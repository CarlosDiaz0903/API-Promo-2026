function animateCounter(el, duration = 1200) {
  const target = parseInt(el.dataset.target, 10);
  if (isNaN(target)) return;
  let start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);


    // easing suave
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.floor(eased * target);

    el.textContent = value + (el.dataset.suffix || "");


    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = value + (el.dataset.suffix || "");
    }
  }

  requestAnimationFrame(update);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".stat-number").forEach(el => {
    animateCounter(el);
  });
});

