document.addEventListener("DOMContentLoaded", () => {
  setupNavToggle();        // foldaway hamburger menu
  initMatrixRainCanvas();  // binary rain generator
  initTerminal();          // terminal intro
  loadTools();             // tools grid
  loadReports();           // vulnerability reports
  loadLabs();              // labs/projects
  loadCTFs();              // unlockable CTFs
  setupFormAnimation();    // contact form animation
});

// === Foldaway Navigation Toggle ===
function setupNavToggle() {
  const menuToggle = document.getElementById("menu-toggle");
  const navLinks   = document.getElementById("nav-links");
  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
  }
}

// === Matrix Rain Canvas ===
function initMatrixRainCanvas() {
  const canvas = document.getElementById("matrix-canvas");
  const ctx    = canvas.getContext("2d");
  let W = canvas.width  = window.innerWidth;
  let H = canvas.height = window.innerHeight;

  const chars    = "01";
  const fontSize = 18;
  const cols     = Math.floor(W / fontSize);
  const drops    = Array(cols).fill(0);

  function draw() {
    ctx.fillStyle = "rgba(15, 15, 30, 0.2)";
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(0, 170, 255, 0.5)";
    ctx.font      = `${fontSize}px monospace`;

    drops.forEach((_, i) => {
      const text = chars[Math.random() < 0.5 ? 0 : 1];
      const x    = i * fontSize;
      const y    = drops[i] * fontSize;

      ctx.fillText(text, x, y);

      if (y > H && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    });
  }

  let interval = setInterval(draw, 33);
  window.addEventListener("resize", () => {
    clearInterval(interval);
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    const newCols = Math.floor(W / fontSize);
    drops.length  = newCols;
    drops.fill(0);
    interval = setInterval(draw, 33);
  });
}

// === Terminal Boot Sequence ===
function initTerminal() {
  const terminal = document.getElementById("terminal-output");
  const hero     = document.getElementById("hero");
  if (!terminal || !hero) return;

  const lines = [
    "> Initialising ACP Protocol...",
    "> Verifying access credentials...",
    "> Access level: RED_TEAM [✓]",
    "> Launching interface..."
  ];

  let index = 0;
  const delay = 1000;

  function showLine() {
    if (index < lines.length) {
      terminal.textContent += `\n${lines[index++]}`;
      setTimeout(showLine, delay);
    } else {
      gsap.to("#terminal", {
        opacity: 0, duration: 1, onComplete: () => {
          terminal.parentElement.remove();
          hero.classList.remove("hidden");
          gsap.fromTo(hero, { opacity: 0 }, { opacity: 1, duration: 1.5 });
        }
      });
    }
  }

  setTimeout(showLine, 800);
}

// === Load Tools Grid ===
async function loadTools() {
  const grid = document.getElementById("tools-grid");
  if (!grid) return;
  const tools = await fetch("data/tools.json").then(r => r.json());

  tools.forEach(tool => {
    const card = document.createElement("div");
    card.className = "tool-card glass";
    card.innerHTML = `
      <div class="card-header">
        <h3>${tool.name}</h3>
      </div>
      <div class="card-body">
        <p>${tool.desc}</p>
      </div>
    `;
    grid.appendChild(card);
    gsap.from(card, { opacity: 0, y: 30, duration: 0.8, stagger: 0.2 });
  });
}

// === Load Vulnerability Reports ===
async function loadReports() {
  const container = document.getElementById("reports-container");
  if (!container) return;
  const reports = await fetch("data/reports.json").then(r => r.json());
  reports.forEach(rep => {
    const section = document.createElement("section");
    section.className = "report-card glass";
    section.innerHTML = `
      <h3>${rep.title}</h3>
      <details><summary>📝 Summary</summary><p>${rep.summary}</p></details>
      <details><summary>📊 CVSS Score</summary><p>${rep.cvss}</p></details>
      <details><summary>💣 Exploitation</summary><p>${rep.exploit}</p></details>
      <details><summary>💥 Impact</summary><p>${rep.impact}</p></details>
      <details><summary>🛡️ Remediation</summary><p>${rep.fix}</p></details>
    `;
    container.appendChild(section);
    gsap.from(section, { opacity: 0, y: 20, duration: 1 });
  });
}

// === Load Labs/Projects ===
async function loadLabs() {
  const deck = document.getElementById("labs-tabs");
  if (!deck) return;
  const labs = await fetch("data/labs.json").then(r => r.json());
  labs.forEach(lab => {
    const card = document.createElement("div");
    card.className = "lab-card glass";
    card.innerHTML = `
      <h3>${lab.name}</h3>
      <img src="${lab.diagram}" alt="Diagram for ${lab.name}"/>
      <p>${lab.walkthrough}</p>
    `;
    deck.appendChild(card);
    gsap.from(card, { opacity: 0, scale: 0.9, duration: 1, ease: "back.out(1.7)" });
  });
}

// === Load CTF Writeups ===
async function loadCTFs() {
  const grid = document.getElementById("ctf-writeups");
  if (!grid) return;
  const writeups = [
    { title: "HTB: Blue", content: "SMB enumeration → EternalBlue → root.txt" },
    { title: "Bounty Hunter", content: "SQLi → admin panel → reverse shell → privesc" }
  ];
  writeups.forEach(w => {
    const card = document.createElement("div");
    card.className = "ctf-card glass";
    card.innerHTML = `
      <h3>${w.title}</h3>
      <div class="ctf-content">${w.content}</div>
    `;
    grid.appendChild(card);
    gsap.from(card, { opacity: 0, x: -20, duration: 1 });
  });
}

// === Contact Form “Encrypt → Transmit” ===
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

document.addEventListener("DOMContentLoaded", () => {
  // --- Card Reveal on Scroll ---
  const cards = document.querySelectorAll(".tool-card");
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(ent => {
      if (ent.isIntersecting) {
        ent.target.classList.add("revealed");
        obs.unobserve(ent.target);
      }
    });
  }, { threshold: 0.2 });

  cards.forEach(card => observer.observe(card));

  // --- Button Pop on Click ---
  document.querySelectorAll(".action-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.preventDefault();
      gsap.fromTo(btn,
        { scale: 1 },
        { scale: 1.2, duration: 0.1, yoyo: true, repeat: 1, ease: "power1.inOut" }
      );
    });
  });
});
