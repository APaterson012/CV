// js/reports.js
document.addEventListener('DOMContentLoaded', () => {
  const data = [
    { title:'Report Alpha',   pdf:'assets/reports/alpha.pdf',   desc:'Analysis of CVE-2025-1234 overflow exploit and remediation steps.' },
    { title:'Report Bravo',   pdf:'assets/reports/bravo.pdf',   desc:'SQL Injection in login form; credential extraction & fixes.' },
    { title:'Report Charlie', pdf:'assets/reports/charlie.pdf', desc:'Cross-site scripting: stored vs. reflected attack vectors.' },
    { title:'Report Delta',   pdf:'assets/reports/delta.pdf',   desc:'SUID escalation path; enforcing least privilege.' },
    { title:'Report Echo',    pdf:'assets/reports/echo.pdf',    desc:'Unauthorized file upload; MIME type lockdown.' },
    { title:'Report Foxtrot', pdf:'assets/reports/foxtrot.pdf', desc:'Directory traversal; proper path sanitization.' }
  ];

  const list = document.getElementById('reports-list');
  let openDetailIdx = null;

  data.forEach((r, i) => {
    const card = document.createElement('div');
    card.className = 'report-card';
    card.dataset.idx = i;
    card.innerHTML = `
      <div class="report-info">
        <h3>${r.title}</h3>
        <p>${r.desc}</p>
      </div>
    `;

    // click to open/close detail pane
    card.addEventListener('click', () => {
      if (openDetailIdx === i) {
        removeDetail();
        clearHighlights();
        openDetailIdx = null;
      } else {
        openDetailIdx = i;
        clearHighlights();
        card.classList.add('active');
        showDetail(i, card);
      }
    });

    // append & then staggered fade-in
    list.appendChild(card);
    setTimeout(() => card.classList.add('visible'), i * 100);
  });

  function clearHighlights() {
    document.querySelectorAll('.report-card.active')
      .forEach(c => c.classList.remove('active'));
  }

  function removeDetail() {
    const existing = document.querySelector('.report-detail');
    if (existing) existing.remove();
  }

  function showDetail(i, cardElem) {
    removeDetail();
    const r = data[i];
    const detail = document.createElement('div');
    detail.className = 'report-detail';
    detail.innerHTML = `
      <button class="detail-close" aria-label="Close">×</button>
      <h4>${r.title}</h4>
      <p>${r.desc}</p>
      <embed src="${r.pdf}#page=1&zoom=page-width" type="application/pdf">
    `;
    // close button
    detail.querySelector('.detail-close').addEventListener('click', () => {
      removeDetail();
      clearHighlights();
      openDetailIdx = null;
    });
    cardElem.insertAdjacentElement('afterend', detail);
    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});
