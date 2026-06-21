const nav = document.querySelector('.site-nav');
const toggle = document.querySelector('.nav-toggle');
const drawer = document.querySelector('.nav-drawer');

const updateNav = () => nav.classList.toggle('scrolled', window.scrollY > 24);
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

if (toggle && drawer) {
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    drawer.classList.toggle('open', !open);
    document.body.style.overflow = open ? '' : 'hidden';
  });

  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      drawer.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}
