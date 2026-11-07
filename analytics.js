(() => {
  const measurementId = document.querySelector('meta[name="ga-measurement-id"]')?.content.trim();
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const configured = /^G-[A-Z0-9]+$/.test(measurementId || '');
  // Local previews expose events for inspection without sending test traffic.
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  if (configured && !local) {
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: location.origin + location.pathname,
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);
  }
  function track(name, parameters) {
    if (!local && !configured) return;
    gtag('event', name, parameters);
  }
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[data-analytics-event]');
    if (!link) return;
    track(link.dataset.analyticsEvent, {
      placement: link.dataset.analyticsPlacement,
      transport_type: 'beacon',
    });
  });
  // Observe headings rather than whole sections, which can exceed the viewport.
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || entry.intersectionRatio < .5 || document.hidden) continue;
      const section = entry.target.closest('section');
      track('section_view', { section_name: section.id || 'contact' });
      observer.unobserve(entry.target);
    }
  }, { threshold: .5 });
  document.querySelectorAll('main section').forEach(section => {
    const target = section.querySelector('h1, h2') || section.querySelector('.video-wrap');
    if (target) observer.observe(target);
  });
})();
