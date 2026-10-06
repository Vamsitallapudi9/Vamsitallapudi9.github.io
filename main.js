// Highlight the nav link for the section currently in view and slide the marker to it.
const links = [...document.querySelectorAll('nav a')];
const marker = document.querySelector('.nav-marker');

function activate(id) {
  links.forEach(a => {
    const on = a.hash === '#' + id;
    a.classList.toggle('active', on);
    if (on) {
      a.setAttribute('aria-current', 'true');
      marker.style.height = a.offsetHeight + 'px';
      marker.style.transform = `translateY(${a.offsetTop}px)`;
    } else {
      a.removeAttribute('aria-current');
    }
  });
}

const io = new IntersectionObserver(entries => {
  entries.forEach(e => e.isIntersecting && activate(e.target.id));
}, { rootMargin: '-40% 0px -55% 0px' });
document.querySelectorAll('main section').forEach(s => io.observe(s));
activate('top');

document.getElementById('year').textContent = new Date().getFullYear();
