// js/main.js
document.addEventListener("DOMContentLoaded", () => {
  setupNavToggle();
  initMatrixRainCanvas();
  initTerminal();
  loadTools();
  setupFormAnimation();
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
  let i = 0;
  const delay = 1000;

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

// === TOOLS GRID ===
async function loadTools() {
  const grid = document.getElementById("tools-grid");
  if (!grid) {
    console.error("🛑 #tools-grid not found");
    return;
  }

  let tools;
  try {
    const res = await fetch("./data/tools.json");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    tools = await res.json();
  } catch (err) {
    console.error("⚠️ Could not fetch data/tools.json:", err);
    grid.insertAdjacentHTML(
      "beforeend",
      `<p class="subtitle">Using fallback data; please fix your JSON path.</p>`
    );
    tools = [];
  }

  tools.forEach((tool, idx) => {
    // create the card WITHOUT features
    const card = document.createElement("div");
    card.className = "tool-card glass";
    card.innerHTML = `
      <div class="card-header">
        <i class="fa-solid fa-cogs tool-icon"></i>
        <h2>${tool.name}</h2>
      </div>
      <div class="card-body">
        <p class="tool-desc">${tool.desc}</p>
        <div class="actions">
          <button class="run-btn">
            <i class="fa-solid fa-download"></i> Download
          </button>
          <button class="info-btn">
            <i class="fa-solid fa-info-circle"></i> Info
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);

    // reveal animation
    setTimeout(() => card.classList.add("revealed"), idx * 150);

    // Download handler (unchanged)
    const dl = card.querySelector(".run-btn");
    dl.addEventListener("click", () => {
      const url      = tool.scriptUrl;
      const filename = url.split("/").pop().replace(/\.\w+$/, ".py");
      const a        = document.createElement("a");
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      navigator.clipboard.writeText(tool.command).then(() => {
        dl.textContent = "📋 Copied!";
        setTimeout(() => {
          dl.innerHTML = `<i class="fa-solid fa-download"></i> Download`;
        }, 1500);
      });
    });

    // Info → modal, now including features
    const info = card.querySelector(".info-btn");
    info.addEventListener("click", () => {
      // build a <ul> of features for the modal
      const feats = Array.isArray(tool.features) ? tool.features : [];
      const featHtml = feats.length
        ? `<h4>Features</h4>
           <ul class="features">
             ${feats.map(f => `<li>${f}</li>`).join("")}
           </ul>`
        : "";

      // populate and show modal
      const body = document.getElementById("modal-body");
      body.innerHTML = `
        <h3>${tool.name} Guide</h3>
        <p>${tool.desc}</p>
        ${featHtml}
        <h4>Example Command</h4>
        <pre>${tool.command}</pre>
      `;
      document.getElementById("tool-modal").classList.remove("hidden");
    });
  });

  // modal-close button
  document.querySelector(".modal-close")?.addEventListener("click", () => {
    document.getElementById("tool-modal").classList.add("hidden");
  });

  // click-outside to close
  document.getElementById("tool-modal").addEventListener("click", e => {
    if (e.target.id === "tool-modal") {
      document.getElementById("tool-modal").classList.add("hidden");
    }
  });

  // button pop animation (unchanged)
  document.querySelectorAll(".run-btn, .info-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      gsap.fromTo(btn,
        { scale: 1 },
        { scale: 1.2, yoyo: true, repeat: 1, duration: 0.1, ease: "power1.inOut" }
      );
    });
  });
}
