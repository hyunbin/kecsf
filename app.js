const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const header = document.querySelector('.header');
const hero = document.querySelector('.hero');
const heroEmblem = document.querySelector('.hero-emblem > svg');
const headerEmblem = document.querySelector('.header-emblem');
const visuals = [...document.querySelectorAll('.visual-zoom')];
const clamp = (value, min=0, max=1) => Math.min(max, Math.max(min, value));
let pending = false;
function update() {
  pending = false;
  const h = window.innerHeight;
  header.classList.toggle('scrolled', window.scrollY > 25);
  hero.classList.toggle('has-scrolled', window.scrollY > 0);
  if (reduced.matches) return;
  hero.style.setProperty('--hero-progress', clamp(window.scrollY / hero.offsetHeight));
  const mark = heroEmblem.getBoundingClientRect();
  const barCenter = header.getBoundingClientRect().height / 2;
  const markY = mark.top + mark.height / 2;
  const dockStart = 130;
  const dockEnd = 270;
  const travel = clamp((window.scrollY - dockStart) / (dockEnd - dockStart));
  const dock = travel * travel * (3 - 2 * travel);
  const handoff = clamp(travel * 5);
  headerEmblem.style.setProperty('--emblem-y', `${Math.max(0, markY - barCenter) * (1 - dock)}px`);
  headerEmblem.style.setProperty('--emblem-scale', 1 + (mark.height / headerEmblem.offsetHeight - 1) * (1 - dock));
  headerEmblem.style.setProperty('--emblem-opacity', handoff);
  heroEmblem.style.setProperty('--hero-emblem-opacity', 1 - handoff);

  visuals.forEach(el => {
    const r = el.getBoundingClientRect();
    const progress = clamp((h - r.top) / (h * .85));
    el.style.setProperty('--visual-scale', (.92 + progress * .08).toFixed(4));
  });
}
function requestUpdate(){if(!pending){pending=true;requestAnimationFrame(update)}}
window.addEventListener('scroll',requestUpdate,{passive:true});
window.addEventListener('resize',requestUpdate);
reduced.addEventListener('change',requestUpdate);
update();

// Keep the heading's footprint stable as each phrase slides upward.
const heroPhrases = [...document.querySelectorAll('.hero-phrase')];
heroPhrases.forEach(phrase => {
  const letters = [...phrase.textContent].map((letter, index) => {
    const span = document.createElement('span');
    span.className = 'hero-letter';
    span.style.setProperty('--letter-delay', `${index * 22}ms`);
    span.textContent = letter;
    return span;
  });
  phrase.replaceChildren(...letters);
});
let phraseIndex = 0;
setInterval(() => {
  if (reduced.matches || document.hidden || hero.getBoundingClientRect().bottom <= 0) return;
  const previous = heroPhrases[phraseIndex];
  phraseIndex = (phraseIndex + 1) % heroPhrases.length;
  previous.classList.remove('is-current');
  previous.classList.add('is-leaving');
  const next = heroPhrases[phraseIndex];
  next.classList.add('is-current', 'is-entering');
  setTimeout(() => previous.classList.remove('is-leaving'), 900);
  setTimeout(() => next.classList.remove('is-entering'), 1500);
}, 4200);
