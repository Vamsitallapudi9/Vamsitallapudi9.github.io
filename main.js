const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

document.getElementById('year').textContent = new Date().getFullYear();

// Live Hyderabad clock in the footer
const clock = $('.clock');
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' });
const tick = () => { clock.textContent = fmt.format(new Date()) + ' IST'; };
tick(); setInterval(tick, 1000);

// Mobile menu
const menuBtn = $('.menu-btn'), menu = $('#menu');
function setMenu(open) {
  menu.hidden = !open;
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.textContent = open ? 'Close' : 'Menu';
  document.body.style.overflow = open ? 'hidden' : '';
  if (open && window.gsap && !reduce) gsap.from($$('#menu li'), { yPercent: 60, opacity: 0, stagger: .05, duration: .6, ease: 'expo.out' });
}
menuBtn.addEventListener('click', () => setMenu(menu.hidden));
$$('#menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });

/* ---------- Hero particles: scattered noise that assembles into the name ---------- */
const hero = (() => {
  const canvas = $('.hero-canvas');
  const ctx = canvas.getContext('2d');
  const css = getComputedStyle(document.documentElement);
  let ink, amber;
  const readColors = () => { const css = getComputedStyle(document.documentElement); ink = css.getPropertyValue('--ink').trim(); amber = css.getPropertyValue('--amber').trim(); };
  readColors();
  let w, h, parts = [], pull = reduce ? 1 : 0, scatter = 0, visible = true;
  const mouse = { x: -1e4, y: -1e4 };

  function build() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const o = off.getContext('2d', { willReadFrequently: true });
    const lines = w < 760 ? ['Vamsi', 'Tallapudi'] : ['Vamsi Tallapudi'];
    let size = 200;
    o.font = `700 ${size}px "Bricolage Grotesque"`;
    const widest = Math.max(...lines.map(l => o.measureText(l).width));
    size = Math.min(size * (w * .9) / widest, h * (lines.length > 1 ? .26 : .3));
    o.font = `700 ${size}px "Bricolage Grotesque"`;
    o.fillStyle = '#fff'; o.textAlign = 'center'; o.textBaseline = 'middle';
    const cy = h * .42, lh = size * .95;
    lines.forEach((l, i) => o.fillText(l, w / 2, cy + (i - (lines.length - 1) / 2) * lh));

    const gap = w < 760 ? 3 : Math.max(4, Math.round(size / 40));
    const data = o.getImageData(0, 0, w, h).data;
    const old = parts;
    parts = [];
    for (let y = 0; y < h; y += gap) for (let x = 0; x < w; x += gap) {
      if (data[(y * w + x) * 4 + 3] < 140) continue;
      const prev = old[parts.length];
      const a = Math.random() * Math.PI * 2, r = (.3 + Math.random()) * Math.max(w, h) * .6;
      parts.push({
        tx: x, ty: y,
        x: prev ? prev.x : Math.random() * w, y: prev ? prev.y : Math.random() * h,
        vx: 0, vy: 0,
        sx: Math.cos(a) * r, sy: Math.sin(a) * r, // scatter direction for scroll-out
        s: gap * (.45 + Math.random() * .35),
        amber: Math.random() < .1,
        drift: Math.random() * Math.PI * 2,
        g: 0,
      });
    }
    if (reduce) parts.forEach(p => { p.x = p.tx; p.y = p.ty; });
  }

  function frame(t) {
    if (visible) {
      ctx.clearRect(0, 0, w, h);
      const k = .018 + pull * .05;
      for (const p of parts) {
        const gx = p.tx + p.sx * scatter, gy = p.ty + p.sy * scatter;
        // before assembly particles wander like noise
        p.vx += ((gx - p.x) * k * pull) + Math.cos(t * .0006 + p.drift) * .06 * (1 - pull);
        p.vy += ((gy - p.y) * k * pull) + Math.sin(t * .0007 + p.drift) * .06 * (1 - pull);
        // lens: dots near the cursor swell and take the accent colour, without moving
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        p.g += ((d2 < 10000 ? 1 - d2 / 10000 : 0) - p.g) * .18;
        p.vx *= .84; p.vy *= .84;
        p.x += p.vx; p.y += p.vy;
      }
      ctx.globalAlpha = 1 - scatter * .9;
      ctx.fillStyle = ink;
      for (const p of parts) if (!p.amber && p.g < .05) ctx.fillRect(p.x, p.y, p.s, p.s);
      ctx.fillStyle = amber;
      for (const p of parts) if (p.amber || p.g >= .05) { const z = p.s * (1 + p.g * 1.3), o = (z - p.s) / 2; ctx.fillRect(p.x - o, p.y - o, z, z); }
    }
    if (!reduce) requestAnimationFrame(frame);
  }

  canvas.parentElement.addEventListener('pointermove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  canvas.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { build(); if (reduce) frame(0); }, 150); });

  return {
    async init() {
      await Promise.race([document.fonts.load('700 100px "Bricolage Grotesque"'), new Promise(r => setTimeout(r, 2500))]);
      build();
      requestAnimationFrame(frame);
    },
    assemble() { if (window.gsap) gsap.to({ v: 0 }, { v: 1, duration: 2.4, ease: 'power2.inOut', onUpdate() { pull = this.targets()[0].v; } }); else pull = 1; },
    setScatter(v) { scatter = v; },
    recolor() { readColors(); if (reduce) frame(0); },
  };
})();

const ready = hero.init();

// Theme toggle (initial theme is set in <head> to avoid a flash)
const themeBtn = $('.theme-btn');
const syncThemeBtn = () => themeBtn.setAttribute('aria-label', `Switch to ${document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'} theme`);
syncThemeBtn();
themeBtn.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('theme', next); } catch (e) {}
  syncThemeBtn();
  hero.recolor();
});

/* ---------- Everything below needs GSAP; without it the page stays fully readable ---------- */
if (!window.gsap || reduce) {
  ready.then(() => hero.assemble());
  $('.loader')?.remove();
} else {
  gsap.registerPlugin(ScrollTrigger);

  // Smooth scroll
  const lenis = new Lenis({ lerp: .1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  $$('a[href^="#"]:not(.skip)').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    lenis.scrollTo(target, { duration: 1.4 });
  }));

  // Split text into masked words made of individual letters (letters drive the hover scatter)
  const chars = w => [...w].map(c => `<span class="ch">${c}</span>`).join('');
  const split = el => {
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="word" aria-hidden="true"><span>${chars(w)}</span></span>`).join(' ');
    return $$('.word > span', el);
  };
  const splitChars = el => {
    if (!el.querySelector('.ch')) {
      el.setAttribute('aria-label', el.textContent.trim());
      el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span style="display:inline-block" aria-hidden="true">${chars(w)}</span>`).join(' ');
    }
    return $$('.ch', el);
  };
  const heroWords = split($('.hero-tag'));
  const contactWords = split($('.contact-title'));
  $$('.section-title').forEach(t => {
    gsap.from(split(t), { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: t, start: 'top 98%' } });
  });
  gsap.from(contactWords, { yPercent: 110, rotate: 4, duration: 1.2, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.contact', start: 'top 70%' } });

  // Loader -> hero entrance
  gsap.set(heroWords, { yPercent: 110 });
  gsap.set(['.hero-meta', '.nav', '.scroll-cue'], { opacity: 0 });
  const count = $('.loader-count'), c = { v: 0 };
  const intro = gsap.timeline({ paused: true })
    .to(c, { v: 100, duration: .6, ease: 'power3.inOut', onUpdate: () => { count.textContent = Math.round(c.v); } })
    .to('.loader', { yPercent: -100, duration: .8, ease: 'expo.inOut' })
    .add(() => hero.assemble(), '-=.7')
    .to(heroWords, { yPercent: 0, duration: 1.2, ease: 'expo.out', stagger: .035 }, '-=.2')
    .to(['.hero-meta', '.nav', '.scroll-cue'], { opacity: 1, duration: 1, stagger: .1 }, '<.3')
    .add(() => $('.loader').remove());
  ready.then(() => intro.play());

  // Scroll the hero away: name dissolves back into noise
  ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true, onUpdate: s => hero.setScatter(s.progress) });
  gsap.to('.hero-foot', { yPercent: -60, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 30%', scrub: true } });

  // Progress bar + nav behaviour
  const nav = $('.nav');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: s => {
      gsap.set('.progress', { scaleX: s.progress });
      nav.classList.toggle('is-solid', s.scroll() > 40);
      nav.classList.toggle('is-hidden', s.direction === 1 && s.scroll() > innerHeight * .8);
    },
  });
  $$('.nav-links a').forEach(a => {
    ScrollTrigger.create({ trigger: $(a.hash), start: 'top 50%', end: 'bottom 50%', onToggle: s => a.classList.toggle('active', s.isActive) });
  });

  // Marquee that speeds up and reverses with scroll velocity
  const track = $('.marquee-track');
  track.innerHTML += track.innerHTML;
  const loop = gsap.to(track, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
  ScrollTrigger.create({
    onUpdate: s => {
      const v = s.getVelocity() / 250;
      gsap.to(loop, { timeScale: gsap.utils.clamp(-8, 8, (s.direction || 1) * (1 + Math.abs(v))), duration: .2, overwrite: true });
      gsap.to(loop, { timeScale: s.direction === -1 ? -1 : 1, duration: 1.2, delay: .2 });
    },
  });

  gsap.from('.feature, .project', { y: 40, opacity: 0, stagger: .08, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.project-grid', start: 'top 88%' } });
  $$('.card').forEach(card => card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', e.clientX - r.left + 'px');
    card.style.setProperty('--my', e.clientY - r.top + 'px');
  }));
  gsap.from('.card', { y: 50, opacity: 0, stagger: .08, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.work-grid', start: 'top 85%' } });

  gsap.from('.rows li', { y: 24, opacity: 0, stagger: .06, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: '.rows', start: 'top 88%' } });
  gsap.from('.chips li', { y: 16, opacity: 0, stagger: .025, duration: .7, ease: 'expo.out', scrollTrigger: { trigger: '.chips', start: 'top 90%' } });

  if (fine) {
    // Magnetic links
    $$('.magnetic').forEach(el => {
      const mx = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3' });
      const my = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * .35);
        my((e.clientY - r.top - r.height / 2) * .35);
      });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });

    // Custom cursor
    const cur = $('.cursor');
    const dx = gsap.quickTo('.cursor-dot', 'x', { duration: .1 }), dy = gsap.quickTo('.cursor-dot', 'y', { duration: .1 });
    const rx2 = gsap.quickTo('.cursor-ring', 'x', { duration: .5, ease: 'power3' }), ry2 = gsap.quickTo('.cursor-ring', 'y', { duration: .5, ease: 'power3' });
    addEventListener('pointermove', e => { dx(e.clientX); dy(e.clientY); rx2(e.clientX); ry2(e.clientY); });
    document.addEventListener('pointerover', e => cur.classList.toggle('is-hover', !!e.target.closest('a, button, .card')));
  }

  // Hover: letters lift in a quick wave, left to right, and settle
  const wave = (el, lift = 16, trigger = el) => {
    const cs = splitChars(el);
    let tw;
    trigger.addEventListener('pointerenter', () => {
      if (tw?.isActive()) return;
      tw = gsap.to(cs, { yPercent: -lift, duration: .22, ease: 'power2.out', yoyo: true, repeat: 1, stagger: .016 });
    });
  };
  if (fine) {
    $$('.section-title, .contact-title').forEach(el => wave(el, 10));
    $$('.nav-links a, .contact-links a').forEach(el => wave(el, 22));
    wave($('.contact-mail'), 18);
    // cursor glow in the ambient background
    addEventListener('pointermove', e => {
      document.documentElement.style.setProperty('--cx', e.clientX + 'px');
      document.documentElement.style.setProperty('--cy', e.clientY + 'px');
    });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
}
