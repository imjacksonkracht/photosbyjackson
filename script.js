// =============================================================
// PHOTOS BY JACKSON — script.js
// =============================================================
//
// HOW TO ADD NEW PHOTOS
// ─────────────────────
// 1. Drop your image files (1.jpg, 2.jpg, 3.jpg…) into the
//    correct folder:
//      images/concerts/
//      images/sports/
//      images/events/
//      images/portraits/
//
// 2. Update the "count" for that category in CONFIG below.
//    Example: if you added images up to 15.jpg, set count: 15
//
// 3. Save script.js and push to GitHub — that's it!
//    Missing images are silently ignored (no broken icons).
//
// =============================================================

const CONFIG = {
  categories: {
    concerts:  { label: 'Concerts',               count: 30 },
    sports:    { label: 'Sports',                 count: 30 },
    events:    { label: 'Events',                 count: 30 },
    portraits: { label: 'Portraits & Headshots',  count: 30 },
  },
  contact: {
    email:        'jackson@photosbyjackson.org',
    instagram:    'https://instagram.com/photosbyjackson',
    personalSite: 'https://jacksonkracht.com',
  },
};

// =============================================================
// THEME
// (Initial application happens inline in <head> to prevent flash)
// =============================================================
const themeToggle = document.getElementById('theme-toggle');

themeToggle.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('pbj-theme', next);
});

// =============================================================
// HERO IMAGE
// =============================================================
const heroImg = document.getElementById('hero-image');

heroImg.addEventListener('load', () => heroImg.classList.add('loaded'));
heroImg.addEventListener('error', () => {
  document.getElementById('hero').classList.add('hero-no-image');
  heroImg.style.display = 'none';
});
if (heroImg.complete && heroImg.naturalWidth > 0) heroImg.classList.add('loaded');

// =============================================================
// MOBILE NAV
// =============================================================
const menuBtn  = document.getElementById('mobile-menu-btn');
const navLinks = document.getElementById('nav-links');

menuBtn.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  menuBtn.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuBtn.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
  });
});

// =============================================================
// HEADER SCROLL SHADOW
// =============================================================
const siteHeader = document.getElementById('site-header');
window.addEventListener('scroll', () => {
  siteHeader.classList.toggle('scrolled', window.scrollY > 8);
}, { passive: true });

// =============================================================
// GALLERY
// =============================================================
const galleryEl    = document.getElementById('gallery');
const galleryEmpty = document.getElementById('gallery-empty');
const portfolioSection = document.getElementById('portfolio');

// Intersection Observer for lazy loading
const imgObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const img = entry.target;
    const src = img.dataset.src;
    if (!src) return;
    img.src = src;
    imgObserver.unobserve(img);
  });
}, { rootMargin: '300px' });

function buildGallery(filter) {
  galleryEl.innerHTML = '';
  galleryEmpty.hidden = true;

  const cats = filter === 'all'
    ? Object.keys(CONFIG.categories)
    : [filter];

  let pending = 0;
  let visible = 0;

  cats.forEach((cat) => {
    const { label, count } = CONFIG.categories[cat];

    for (let i = 1; i <= count; i++) {
      pending++;

      const src = `images/${cat}/${i}.jpg`;

      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      item.setAttribute('aria-label', `${label} photo ${i} — click to expand`);
      item.dataset.category = cat;

      const img = document.createElement('img');
      img.alt = `${label} photo ${i}`;
      img.decoding = 'async';

      if (i <= 6) {
        img.src = src;
      } else {
        img.dataset.src = src;
        imgObserver.observe(img);
      }

      img.addEventListener('load', () => {
        img.classList.add('loaded');
        visible++;
        pending--;
        if (pending === 0) galleryEmpty.hidden = visible > 0;
      });

      img.addEventListener('error', () => {
        imgObserver.unobserve(img);
        item.remove();
        pending--;
        if (pending === 0) galleryEmpty.hidden = visible > 0;
      });

      const overlay = document.createElement('div');
      overlay.className = 'gallery-item-overlay';
      overlay.setAttribute('aria-hidden', 'true');

      item.appendChild(img);
      item.appendChild(overlay);

      item.addEventListener('click', () => openLightbox(item));
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(item);
        }
      });

      galleryEl.appendChild(item);
    }
  });

  if (pending === 0) galleryEmpty.hidden = false;
}

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    buildGallery(btn.dataset.filter);
  });
});

buildGallery('all');

// =============================================================
// LIGHTBOX
// =============================================================
const lightbox         = document.getElementById('lightbox');
const lightboxImg      = document.getElementById('lightbox-img');
const lightboxClose    = document.getElementById('lightbox-close');
const lightboxPrev     = document.getElementById('lightbox-prev');
const lightboxNext     = document.getElementById('lightbox-next');
const lightboxBackdrop = document.getElementById('lightbox-backdrop');

let lbImages = [];
let lbIndex  = 0;

function openLightbox(clickedItem) {
  lbImages = Array.from(galleryEl.querySelectorAll('.gallery-item'))
    .map(item => {
      const img = item.querySelector('img');
      return (img && img.naturalWidth > 0) ? { src: img.src, alt: img.alt } : null;
    })
    .filter(Boolean);

  if (lbImages.length === 0) return;

  const clickedImg = clickedItem.querySelector('img');
  const idx = lbImages.findIndex(i => i.src === clickedImg?.src);
  lbIndex = idx >= 0 ? idx : 0;

  renderLightboxImage();
  lightbox.hidden = false;
  document.body.style.overflow = 'hidden';
  lightboxClose.focus();
}

function renderLightboxImage() {
  const { src, alt } = lbImages[lbIndex];
  lightboxImg.src = src;
  lightboxImg.alt = alt;

  const showNav = lbImages.length > 1;
  lightboxPrev.style.display = showNav ? 'flex' : 'none';
  lightboxNext.style.display = showNav ? 'flex' : 'none';
}

function closeLightbox() {
  lightbox.hidden = true;
  document.body.style.overflow = '';
  lightboxImg.src = '';
}

function prevImage() {
  lbIndex = (lbIndex - 1 + lbImages.length) % lbImages.length;
  renderLightboxImage();
}

function nextImage() {
  lbIndex = (lbIndex + 1) % lbImages.length;
  renderLightboxImage();
}

lightboxClose.addEventListener('click', closeLightbox);
lightboxBackdrop.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', prevImage);
lightboxNext.addEventListener('click', nextImage);

document.addEventListener('keydown', e => {
  if (lightbox.hidden) return;
  if (e.key === 'Escape')      closeLightbox();
  if (e.key === 'ArrowLeft')   prevImage();
  if (e.key === 'ArrowRight')  nextImage();
});

// =============================================================
// FOOTER YEAR
// =============================================================
document.getElementById('footer-year').textContent = new Date().getFullYear();
