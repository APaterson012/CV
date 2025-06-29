// reports.js
document.addEventListener('DOMContentLoaded', () => {
  setupNavToggle();
  initMatrixRainCanvas();
  initCarousel();
});

function initCarousel() {
  const data = [
    { title:'Report Alpha',   pdf:'assets/reports/alpha.pdf',   desc:'Analysis of CVE-2025-1234 overflow exploit.' },
    { title:'Report Bravo',   pdf:'assets/reports/bravo.pdf',   desc:'SQL Injection in login form; mitigation.' },
    { title:'Report Charlie', pdf:'assets/reports/charlie.pdf', desc:'XSS in comments; stored vs reflected.' },
    { title:'Report Delta',   pdf:'assets/reports/delta.pdf',   desc:'SUID escalation; least-privilege fix.' },
    { title:'Report Echo',    pdf:'assets/reports/echo.pdf',    desc:'Unauthorized file upload; MIME lockdown.' },
    { title:'Report Foxtrot', pdf:'assets/reports/foxtrot.pdf', desc:'Directory traversal; path sanitization.' }
  ];

  const track = document.getElementById('carousel-track');
  const prev  = document.querySelector('.carousel-nav.prev');
  const next  = document.querySelector('.carousel-nav.next');
  const detailContainer = document.getElementById('detail-container');

  // inject slides
  data.forEach((r,i) => {
    const div = document.createElement('div');
    div.className = 'carousel-item';
    div.innerHTML = `
      <embed src="${r.pdf}#page=1&zoom=page-width" type="application/pdf">
      <h3>${r.title}</h3>
    `;
    // click ANYWHERE on the card
    div.addEventListener('click', () => selectAndShow(i));
    track.appendChild(div);
  });

  const items = track.querySelectorAll('.carousel-item');
  const mid = Math.floor(items.length/2);

  // mark initial active
  updateActive();

  // prev/next rotate
  prev.addEventListener('click', () => {
    rotateRight();        // last → front
    updateActive();
    clearDetail();
  });
  next.addEventListener('click', () => {
    rotateLeft();         // first → end
    updateActive();
    clearDetail();
  });

  function rotateLeft() {
    track.appendChild(track.firstElementChild);
  }
  function rotateRight() {
    track.insertBefore(track.lastElementChild, track.firstChild);
  }

  // highlight centre + dim others
  function updateActive() {
    const all = track.querySelectorAll('.carousel-item');
    all.forEach((el,i) => el.classList.toggle('active', i === mid));
  }

  // clear detail panel
  function clearDetail() {
    detailContainer.innerHTML = '';
  }

  // on select: rotate until target is centre, then show detail
  function selectAndShow(targetIndex) {
    clearDetail();
    let all = Array.from(track.children);
    // find current positions of original-index slides
    // we gave them data-index equal to i
    // so we'll tag them:
    // first time only
    if (!track.dataset.tagged) {
      all.forEach((el,i)=> el.dataset.idx = i);
      track.dataset.tagged = 'yes';
    }
    // find which DOM position holds our requested data-index
    const itemsArr = Array.from(track.children);
    let currentPos = itemsArr.findIndex(el=> parseInt(el.dataset.idx)===targetIndex);
    // rotate minimal steps to bring it to mid
    while (currentPos > mid) {
      rotateLeft();
      currentPos--;
    }
    while (currentPos < mid) {
      rotateRight();
      currentPos++;
    }
    updateActive();
    // then show detail
    showDetail(targetIndex);
  }

  function showDetail(i) {
    const r = data[i];
    detailContainer.innerHTML = `
      <div class="carousel-detail">
        <button class="detail-close" aria-label="Close">×</button>
        <h4>${r.title}</h4>
        <p>${r.desc}</p>
        <embed src="${r.pdf}#zoom=page-width" type="application/pdf">
      </div>
    `;
    detailContainer.querySelector('.detail-close')
      .addEventListener('click', clearDetail);
  }
}
