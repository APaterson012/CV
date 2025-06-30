// js/ctf.js
document.addEventListener("DOMContentLoaded", () => {
  loadCTFs();
});


async function loadCTFs() {
  const container = document.getElementById("ctf-grid");
  if (!container) return;

  const ctfs = await fetch("data/ctfs.json").then(r => r.json());
  ctfs.forEach((entry, i) => {
    const card = document.createElement("div");
    card.className = "ctf-card glass";
    card.innerHTML = `
      <h3>${entry.title}</h3>
      <p class="ctf-summary">${entry.summary}</p>
      <div class="ctf-tags">
        ${entry.tags.map(t => `<span class="tag">${t}</span>`).join("")}
      </div>
      <a href="${entry.url}" class="btn glass">Read Full Write-up</a>
    `;
    container.appendChild(card);
    setTimeout(() => card.classList.add("revealed"), i * 100);
  });
}
