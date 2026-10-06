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
  const ink = '#EAF0F6', amber = '#FFC978';
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
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 12000) { const f = (12000 - d2) / 12000 * 3.2; const d = Math.sqrt(d2) || 1; p.vx += dx / d * f; p.vy += dy / d * f; }
        p.vx *= .84; p.vy *= .84;
        p.x += p.vx; p.y += p.vy;
      }
      ctx.globalAlpha = 1 - scatter * .9;
      ctx.fillStyle = ink;
      for (const p of parts) if (!p.amber) ctx.fillRect(p.x, p.y, p.s, p.s);
      ctx.fillStyle = amber;
      for (const p of parts) if (p.amber) ctx.fillRect(p.x, p.y, p.s, p.s);
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
  };
})();

const ready = hero.init();

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

  // Split text into masked words
  const split = el => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="word"><span>${w}</span></span>`).join(' ');
    return $$('.word > span', el);
  };
  const heroWords = split($('.hero-tag'));
  const contactWords = split($('.contact-title'));
  $$('.section-title').forEach(t => {
    gsap.from(split(t), { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: t, start: 'top 85%' } });
  });
  gsap.from(contactWords, { yPercent: 110, rotate: 4, duration: 1.2, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.contact', start: 'top 70%' } });

  // Loader -> hero entrance
  gsap.set(heroWords, { yPercent: 110 });
  gsap.set(['.hero-meta', '.nav', '.scroll-cue'], { opacity: 0 });
  const count = $('.loader-count'), c = { v: 0 };
  const intro = gsap.timeline({ paused: true })
    .to(c, { v: 100, duration: 1.3, ease: 'power3.inOut', onUpdate: () => { count.textContent = Math.round(c.v); } })
    .to('.loader', { yPercent: -100, duration: 1, ease: 'expo.inOut' })
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

  // Intro paragraph lights up word by word as you scroll
  const intr = $('.intro-text');
  intr.innerHTML = intr.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  gsap.to($$('.w', intr), { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: intr, start: 'top 80%', end: 'bottom 45%', scrub: true } });

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

  // Counters
  $$('.stat-num').forEach(el => {
    const o = { v: 0 }, to = +el.dataset.to, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    gsap.to(o, {
      v: to, duration: 2, ease: 'expo.out',
      onUpdate: () => { el.textContent = pre + Math.round(o.v) + suf; },
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });
  gsap.from('.stat', { y: 40, opacity: 0, stagger: .1, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.numbers', start: 'top 80%' } });

  // Pinned horizontal project reel on wide screens
  const mm = gsap.matchMedia();
  mm.add('(min-width: 961px)', () => {
    const wt = $('.work-track');
    const dist = () => wt.scrollWidth - innerWidth;
    gsap.to(wt, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.work', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 },
    });
  });
  $$('.card').forEach(card => card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', e.clientX - r.left + 'px');
    card.style.setProperty('--my', e.clientY - r.top + 'px');
  }));
  gsap.from('.card', { y: 80, opacity: 0, stagger: .08, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.work-track', start: 'top 85%' } });

  // Roles, research and skills reveals
  $$('.role').forEach(r => gsap.from(r.children, { y: 50, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .1, scrollTrigger: { trigger: r, start: 'top 85%' } }));
  gsap.from('.bench', { y: 60, opacity: 0, stagger: .12, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.benches', start: 'top 80%' } });
  gsap.from('.skill-groups > div', { y: 40, opacity: 0, stagger: .07, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.skill-groups', start: 'top 85%' } });
  gsap.from('.edu li', { y: 30, opacity: 0, stagger: .05, duration: .9, ease: 'expo.out', scrollTrigger: { trigger: '.edu', start: 'top 85%' } });

  if (fine) {
    // 3D tilt on benchmark cards
    $$('.tilt').forEach(el => {
      const rx = gsap.quickTo(el, 'rotationX', { duration: .6, ease: 'power3' });
      const ry = gsap.quickTo(el, 'rotationY', { duration: .6, ease: 'power3' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - .5) * 10);
        rx(-((e.clientY - r.top) / r.height - .5) * 10);
      });
      el.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });

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

  addEventListener('load', () => ScrollTrigger.refresh());
}
