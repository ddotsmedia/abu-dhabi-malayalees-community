/* ============================================================
   Abu Dhabi Malayalees Community — Main JavaScript
   ============================================================ */

(function () {
  'use strict';

  /* ---- Navbar: scroll effect ---- */
  const navbar = document.getElementById('navbar');

  function updateNavbar() {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', updateNavbar, { passive: true });
  updateNavbar();

  /* ---- Mobile menu ---- */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  hamburger.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    navLinks.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });

  document.addEventListener('click', e => {
    if (!navbar.contains(e.target)) {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    }
  });

  /* ---- Smooth scroll with fixed nav offset ---- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 72;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ---- Active nav link on scroll ---- */
  const sections = document.querySelectorAll('section[id]');
  const navItems  = document.querySelectorAll('.nav-links a');

  function setActiveNav() {
    const scrollPos = window.scrollY + 120;
    sections.forEach(section => {
      const top    = section.offsetTop;
      const bottom = top + section.offsetHeight;
      const id     = section.getAttribute('id');
      if (scrollPos >= top && scrollPos < bottom) {
        navItems.forEach(a => a.classList.remove('active'));
        const active = document.querySelector('.nav-links a[href="#' + id + '"]');
        if (active) active.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', setActiveNav, { passive: true });

  /* ---- Animated counters ---- */
  const counters = document.querySelectorAll('.stat-number');
  let countersStarted = false;

  function animateCounter(el) {
    const target   = parseInt(el.dataset.target, 10);
    const duration = 1800;
    const step     = target / (duration / 16);
    let current    = 0;

    const tick = () => {
      current += step;
      if (current < target) {
        el.textContent = Math.floor(current).toLocaleString();
        requestAnimationFrame(tick);
      } else {
        el.textContent = target.toLocaleString() + '+';
      }
    };
    requestAnimationFrame(tick);
  }

  /* ---- Intersection Observer: fade-in animations ---- */
  const fadeObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  const animatables = [
    '.about-grid > *',
    '.event-card',
    '.news-card',
    '.gallery-item',
    '.leader-card',
    '.membership-card',
    '.contact-grid > *',
  ];

  animatables.forEach(selector => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.classList.add('fade-in');
      el.style.transitionDelay = (i * 80) + 'ms';
      fadeObserver.observe(el);
    });
  });

  /* ---- Counter trigger ---- */
  const statsObserver = new IntersectionObserver(
    entries => {
      if (entries[0].isIntersecting && !countersStarted) {
        countersStarted = true;
        counters.forEach(c => animateCounter(c));
        statsObserver.disconnect();
      }
    },
    { threshold: 0.4 }
  );

  const statsBand = document.querySelector('.stats-band');
  if (statsBand) statsObserver.observe(statsBand);

  /* ---- Back-to-top button ---- */
  const backToTop = document.getElementById('backToTop');

  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  /* ---- Contact form (demo) ---- */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const btn = this.querySelector('button[type="submit"]');
      const original = btn.textContent;
      btn.textContent = 'Sending\u2026';
      btn.disabled = true;

      setTimeout(() => {
        btn.textContent = '\u2713 Message Sent!';
        btn.style.background = '#2ecc71';
        setTimeout(() => {
          btn.textContent = original;
          btn.style.background = '';
          btn.disabled = false;
          contactForm.reset();
        }, 3000);
      }, 1200);
    });
  }

  /* ---- Newsletter forms (demo) ---- */
  document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = this.querySelector('input');
      const btn   = this.querySelector('button');
      btn.textContent = '\u2713 Done!';
      input.value = '';
      setTimeout(() => { btn.textContent = 'Subscribe'; }, 2500);
    });
  });

})();
