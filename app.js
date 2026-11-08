const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const header = document.querySelector('.header');
const hero = document.querySelector('.hero');
const heroEmblem = document.querySelector('.hero-emblem > svg');
// Use the exact same artwork for the moving copy, including the opening beam.
const oldHeaderEmblem = document.querySelector('.header-emblem');
const headerEmblem = heroEmblem.cloneNode(true);
headerEmblem.classList.add('header-emblem');
headerEmblem.setAttribute('aria-hidden', 'true');
// Keep SVG references unique when both instances are in the document.
headerEmblem.innerHTML = headerEmblem.innerHTML.replaceAll('hero-', 'header-');
oldHeaderEmblem.replaceWith(headerEmblem);
const heroInner = document.querySelector('.hero-inner');
const visuals = [...document.querySelectorAll('.visual-zoom')];
const clamp = (value, min=0, max=1) => Math.min(max, Math.max(min, value));
const mobile = window.matchMedia('(max-width: 760px)');
let pending = false;
let layoutDirty = true;
let geometry;
let nativeDock = false;
const nativeMotionStyles = document.createElement('style');
document.head.appendChild(nativeMotionStyles);
function configureNativeDock() {
  nativeDock = mobile.matches && !reduced.matches
    && CSS.supports('animation-timeline', 'scroll(root block)')
    && CSS.supports('animation-range', '0px 200px');
  document.documentElement.classList.toggle('native-logo-scroll', nativeDock);
  if (!nativeDock) { nativeMotionStyles.textContent = ''; return; }
  const start = Math.max(0, Math.min(130, geometry.logoCenter - 38 - 150));
  const end = start + 140;
  const frames = Array.from({length:61}, (_,i) => {
    const y = end * i / 60;
    const progress = clamp(y / geometry.heroHeight);
    const scale = 1 - progress * .09;
    const markY = geometry.innerCenter + (geometry.logoCenter - geometry.innerCenter) * scale - progress*60 - y;
    const travel = clamp((y-start)/140);
    const dock = travel*travel*(3-2*travel);
    const lift = (markY-38)*(1-dock);
    const size = scale * (1-dock) + (geometry.headerLogoHeight/geometry.logoHeight) * dock;
    return `${i/60*100}%{transform:translate(-50%,-50%) translate3d(0,${lift}px,0) scale(${size});opacity:${1-progress*.65*(1-dock)}}`;
  });
  nativeMotionStyles.textContent = `
    @keyframes native-logo-dock{${frames.join('')}}
    .native-logo-scroll .header-emblem{width:${geometry.logoHeight}px;height:${geometry.logoHeight}px;animation:native-logo-dock linear both;animation-timeline:scroll(root block);animation-range:0px ${end}px}
    .native-logo-scroll .hero-inner{animation:native-hero-motion linear both;animation-timeline:scroll(root block);animation-range:0px ${geometry.heroHeight}px}
  `;
}
const writtenStyles = new WeakMap();
function setStyle(element, name, value) {
  let previous = writtenStyles.get(element);
  if (!previous) { previous = new Map(); writtenStyles.set(element, previous); }
  const text = String(value);
  if (previous.get(name) === text) return;
  previous.set(name, text);
  element.style.setProperty(name, text);
}
function documentTop(element) {
  let top = 0;
  for (let node = element; node; node = node.offsetParent) top += node.offsetTop;
  return top;
}
function measure() {
  const logoBox = heroEmblem.parentElement;
  geometry = {
    heroHeight: hero.offsetHeight,
    innerCenter: documentTop(heroInner) + heroInner.offsetHeight / 2,
    logoCenter: documentTop(logoBox) + logoBox.offsetHeight / 2,
    logoHeight: parseFloat(getComputedStyle(heroEmblem).height),
    headerLogoHeight: window.matchMedia('(max-width: 370px)').matches ? 32 : 40,
    visuals: visuals.map(element => ({element, top: documentTop(element)})),
  };
  layoutDirty = false;
  configureNativeDock();
}
function update() {
  pending = false;
  // All layout reads precede writes. Ordinary mobile scroll frames need none.
  if (layoutDirty) measure();
  const y = Math.max(0, window.scrollY); // Ignore iOS rubber-band overscroll.
  const viewportHeight = window.innerHeight;
  const barCenter = mobile.matches ? 38 : header.getBoundingClientRect().height / 2;
  header.classList.toggle('scrolled', y > 25);
  hero.classList.toggle('has-scrolled', y > 0);
  if (reduced.matches) return;
  const progress = clamp(y / geometry.heroHeight);
  const scale = 1 - progress * .09;
  // Match the hero's CSS transform mathematically, without measuring the
  // transformed SVG after updating its ancestor's styles.
  const markY = geometry.innerCenter + (geometry.logoCenter - geometry.innerCenter) * scale - progress * 60 - y;
  const dockStart = Math.max(0, Math.min(130, geometry.logoCenter - barCenter - 150));
  const travel = clamp((y - dockStart) / 140);
  const dock = travel * travel * (3 - 2 * travel);
  const handoff = y > dockStart ? 1 : 0;
  if (!nativeDock) {
  setStyle(hero, '--hero-progress', progress);
  setStyle(headerEmblem, '--emblem-y', `${(markY - barCenter) * (1 - dock)}px`);
  setStyle(headerEmblem, '--emblem-scale', 1 + (geometry.logoHeight * scale / geometry.headerLogoHeight - 1) * (1 - dock));
  setStyle(headerEmblem, '--emblem-opacity', handoff * (1 - progress * .65 * (1 - dock)));
  setStyle(heroEmblem, '--hero-emblem-opacity', 1 - handoff);
  }
  geometry.visuals.forEach(({element, top}) => {
    const videoProgress = clamp((viewportHeight - (top - y)) / (viewportHeight * .85));
    setStyle(element, '--visual-scale', (.92 + videoProgress * .08).toFixed(4));
  });
}
function requestUpdate() {
  if (!pending) { pending = true; requestAnimationFrame(update); }
}
function refreshLayout() { layoutDirty = true; requestUpdate(); }
window.addEventListener('scroll', requestUpdate, {passive:true});
window.addEventListener('resize', refreshLayout);
window.addEventListener('pageshow', refreshLayout);
reduced.addEventListener('change', refreshLayout);
mobile.addEventListener('change', refreshLayout);
const layoutObserver = new ResizeObserver(refreshLayout);
[hero, heroInner, ...visuals.map(element => element.parentElement)].forEach(element => layoutObserver.observe(element));
document.fonts.ready.then(refreshLayout);
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
