const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

$('#year').textContent = new Date().getFullYear();

// Live Hyderabad clock
const clock = $('.clock');
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
const tick = () => { clock.textContent = fmt.format(new Date()) + ' IST'; };
tick(); setInterval(tick, 15000);

// Theme toggle (initial theme is set in <head> to avoid a flash)
const themeBtn = $('.theme-btn');
const syncTheme = () => themeBtn.setAttribute('aria-label', `Switch to ${root.dataset.theme === 'dark' ? 'light' : 'dark'} theme`);
syncTheme();
themeBtn.addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
  syncTheme();
});

// Hero tabs: swap the statement and type out the code-comment note
const tabs = $$('[role="tab"]');
const statement = $('#statement'), noteText = $('.note-text');
let typing;
function typeNote(text) {
  clearInterval(typing);
  if (reduce) { noteText.textContent = text; return; }
  let i = 0;
  noteText.textContent = '';
  typing = setInterval(() => {
    noteText.textContent = text.slice(0, ++i);
    if (i >= text.length) clearInterval(typing);
  }, 45);
}
function select(tab) {
  if (tab.getAttribute('aria-selected') === 'true') return;
  tabs.forEach(t => { const on = t === tab; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
  statement.classList.add('out');
  setTimeout(() => { statement.textContent = tab.dataset.text; statement.classList.remove('out'); }, reduce ? 0 : 300);
  typeNote(tab.dataset.note);
}
tabs.forEach((t, i) => {
  t.tabIndex = i ? -1 : 0;
  t.addEventListener('click', () => select(t));
  t.addEventListener('keydown', e => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!d) return;
    const next = tabs[(i + d + tabs.length) % tabs.length];
    next.focus(); select(next);
  });
});
typeNote(tabs[0].dataset.note);

// Nav: a single accent pill slides to the section in view
const ind = $('.nav-ind');
const navLinks = $$('.nav-pills a[href^="#"]');
function moveInd(link) {
  navLinks.forEach(a => a.classList.toggle('active', a === link));
  if (!link) { ind.style.opacity = 0; return; }
  ind.style.opacity = 1;
  ind.style.width = link.offsetWidth + 'px';
  ind.style.transform = `translateX(${link.offsetLeft}px)`;
}
const sections = navLinks.map(a => $(a.hash));
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) moveInd(navLinks[sections.indexOf(e.target)]); });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach(s => io.observe(s));
new IntersectionObserver(([e]) => { if (e.isIntersecting) moveInd(null); }, { rootMargin: '-45% 0px -50% 0px' }).observe($('#top'));

// Feature-grid illustration: a few "active features"
$$('[data-grid]').forEach(g => {
  const lit = new Set([3, 4, 17, 18, 19, 31, 45, 46, 52, 60, 61, 66, 75, 80]);
  g.innerHTML = Array.from({ length: 84 }, (_, i) => `<span${lit.has(i) ? ` class="on" style="--d:${(i % 7) * -.45}s"` : ''}></span>`).join('');
});

if (matchMedia('(pointer: fine)').matches && !reduce) {
  // Cursor-following pill on linked panels
  $$('.follow').forEach(p => p.addEventListener('pointermove', e => {
    const r = p.getBoundingClientRect();
    p.style.setProperty('--fx', e.clientX - r.left + 14 + 'px');
    p.style.setProperty('--fy', e.clientY - r.top + 14 + 'px');
  }));
  // Soft glow in the background follows the cursor
  addEventListener('pointermove', e => {
    root.style.setProperty('--cx', e.clientX + 'px');
    root.style.setProperty('--cy', e.clientY + 'px');
  });
}
