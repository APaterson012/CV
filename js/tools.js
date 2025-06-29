// js/tools.js
document.addEventListener("DOMContentLoaded", () => {
  // only run on Tools page
  if (document.getElementById("tools-grid")) {
    loadTools();
  }
});

async function loadTools() {
  const grid = document.getElementById("tools-grid");
  if (!grid) return;

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

    // Download handler
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

    // Info → modal including features
    const info = card.querySelector(".info-btn");
    info.addEventListener("click", () => {
      const feats = Array.isArray(tool.features) ? tool.features : [];
      const featHtml = feats.length
        ? `<h4>Features</h4>
           <ul class="features">
             ${feats.map(f => `<li>${f}</li>`).join("")}
           </ul>`
        : "";

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

  // Modal close handlers
  document.querySelector(".modal-close")?.addEventListener("click", () => {
    document.getElementById("tool-modal").classList.add("hidden");
  });
  document.getElementById("tool-modal")?.addEventListener("click", e => {
    if (e.target.id === "tool-modal") {
      document.getElementById("tool-modal").classList.add("hidden");
    }
  });

  // Button pop animation
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
