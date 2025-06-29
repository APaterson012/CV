// js/main.js
document.addEventListener("DOMContentLoaded", () => {
  setupNavToggle();
  initMatrixRainCanvas();

  // Terminal intro on Home page
  if (document.getElementById("terminal")) {
    initTerminal();
  }

  // Contact form animation on Contact page
  if (document.getElementById("contact-form") && typeof setupFormAnimation === "function") {
    setupFormAnimation();
  }
});

// === NAV TOGGLE ===
function setupNavToggle() {
  const menuToggle = document.getElementById("menu-toggle");
  const navLinks   = document.getElementById("nav-links");
  if (!menuToggle || !navLinks) return;
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}

// === MATRIX RAIN ===
function initMatrixRainCanvas() {
  const canvas = document.getElementById("matrix-canvas");
  if (!canvas) return;
  const ctx    = canvas.getContext("2d");
  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;
  const chars    = "01";
  const fontSize = 18;
  let cols     = Math.floor(W / fontSize);
  let drops    = Array(cols).fill(0);

  function draw() {
    ctx.fillStyle = "rgba(15,15,30,0.2)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(0,170,255,0.5)";
    ctx.font      = `${fontSize}px monospace`;
    drops.forEach((_, i) => {
      const text = chars[Math.random() < 0.5 ? 0 : 1];
      const x    = i * fontSize;
      const y    = drops[i] * fontSize;
      ctx.fillText(text, x, y);
      if (y > H && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    });
  }

  let interval = setInterval(draw, 33);
  window.addEventListener("resize", () => {
    clearInterval(interval);
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    cols  = Math.floor(W / fontSize);
    drops = Array(cols).fill(0);
    interval = setInterval(draw, 33);
  });
}

// === TERMINAL INTRO ===
function initTerminal() {
  const wrapper = document.getElementById("terminal");
  const output  = document.getElementById("terminal-output");
  const hero    = document.getElementById("hero");

  if (sessionStorage.getItem("terminalSeen")) {
    wrapper?.remove();
    hero?.classList.remove("hidden");
    return;
  }
  sessionStorage.setItem("terminalSeen", "true");
  if (!wrapper || !output || !hero) return;

  const lines = [
    "> Initialising ACP Protocol...",
    "> Verifying access credentials...",
    "> Access level: RED_TEAM [✓]",
    "> Launching interface..."
  ];
  let i = 0, delay = 1000;
  function showLine() {
    if (i < lines.length) {
      output.textContent += `\n${lines[i++]}`;
      setTimeout(showLine, delay);
    } else {
      gsap.to(wrapper, {
        opacity: 0, duration: 1,
        onComplete: () => {
          wrapper.remove();
          hero.classList.remove("hidden");
          gsap.fromTo(hero, { opacity: 0 }, { opacity: 1, duration: 1.5 });
        }
      });
    }
  }
  setTimeout(showLine, 800);
}

// === CONTACT FORM ANIMATION ===
function setupFormAnimation() {
  const form = document.getElementById("contact-form");
  if (!form) return;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const btn = form.querySelector(".transmit-btn");
    gsap.to(btn, { duration: 0.2, onStart() { btn.textContent = "Encrypting…"; } });
    gsap.to(btn, {
      duration: 0.2, delay: 0.5,
      onStart() { btn.textContent = "Transmitting…"; },
      onComplete() { form.submit(); }
    });
  });
}
