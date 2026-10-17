document.documentElement.classList.add('js');

// Einblendungen einmalig beim Scrollen
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .1, rootMargin: '0px 0px -40px 0px' }) : null;
document.querySelectorAll('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));

// Mobilmenü
const nav = document.querySelector('.main-nav');
const mb = document.querySelector('.menu-btn');
if (nav && mb) {
  mb.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    mb.setAttribute('aria-expanded', open);
    mb.textContent = open ? 'Schließen' : 'Menü';
  });
}

// Jahr im Footer
document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());

// Arbeiten filtern
document.querySelectorAll('[data-filter-group]').forEach(group => {
  const buttons = group.querySelectorAll('button[data-filter]');
  const items = document.querySelectorAll(group.dataset.filterGroup + ' [data-cat]');
  buttons.forEach(b => b.addEventListener('click', () => {
    buttons.forEach(x => x.setAttribute('aria-pressed', x === b));
    items.forEach(i => i.hidden = b.dataset.filter !== 'alle' && i.dataset.cat !== b.dataset.filter);
  }));
});

// Anfrage: Nachricht zusammenstellen und in WhatsApp oder E-Mail öffnen.
// Es wird nichts automatisch versendet – die Person schickt die Nachricht selbst ab.
const form = document.getElementById('anfrage');
if (form) {
  const vorwahl = new URLSearchParams(location.search).get('anliegen');
  if (vorwahl && form.anliegen) form.anliegen.value = vorwahl;

  const text = () => {
    const f = form.elements;
    return [
      `Hallo Malina, ich interessiere mich für: ${f.anliegen.value}.`,
      f.zeitraum.value ? `Wunschzeitraum: ${f.zeitraum.value}` : '',
      f.nachricht.value ? `\n${f.nachricht.value}` : '',
      `\nViele Grüße\n${f.name.value}`
    ].filter(Boolean).join('\n');
  };
  const valid = () => {
    let ok = true;
    ['name', 'anliegen'].forEach(n => {
      const el = form.elements[n]; const wrap = el.closest('.field');
      const bad = !el.value.trim(); wrap.classList.toggle('invalid', bad);
      el.setAttribute('aria-invalid', bad); if (bad && ok) { el.focus(); ok = false; }
    });
    return ok;
  };
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!valid()) return;
    window.open('https://wa.me/4916095902220?text=' + encodeURIComponent(text()), '_blank', 'noopener');
  });
  document.getElementById('per-mail').addEventListener('click', () => {
    if (!valid()) return;
    location.href = 'mailto:info@skinatelier.studio?subject=' + encodeURIComponent('Terminanfrage: ' + form.elements.anliegen.value) + '&body=' + encodeURIComponent(text());
  });
}

// Navigation: auf iPhone/iPad Apple Karten, sonst Google Maps
if (/iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document) {
  document.querySelectorAll('[data-route]').forEach(a => a.href = 'https://maps.apple.com/?daddr=Breite+Str.+23,+13187+Berlin');
}

// Zwei-Klick-Einbettungen (Google-Bewertungen, Instagram): erst nach Klick laden
function einbettungLaden(box) {
  const tpl = box.querySelector('template');
  if (!tpl || box.classList.contains('geladen')) return;
  const ziel = document.createElement('div');
  ziel.innerHTML = tpl.innerHTML;
  // Skripte neu anlegen, damit der Browser sie ausführt
  ziel.querySelectorAll('script').forEach(alt => {
    const neu = document.createElement('script');
    [...alt.attributes].forEach(a => neu.setAttribute(a.name, a.value));
    neu.textContent = alt.textContent;
    alt.replaceWith(neu);
  });
  box.replaceChildren(ziel);
  box.classList.add('geladen');
}
document.querySelectorAll('.einbettung').forEach(box => {
  const dienst = box.dataset.dienst;
  let erlaubt = false;
  try { erlaubt = localStorage.getItem('einwilligung-' + dienst) === 'ja'; } catch (e) {}
  if (erlaubt) { einbettungLaden(box); return; }
  box.querySelectorAll('[data-laden]').forEach(k => k.addEventListener('click', () => {
    if (k.hasAttribute('data-immer')) { try { localStorage.setItem('einwilligung-' + dienst, 'ja'); } catch (e) {} }
    einbettungLaden(box);
  }));
});
// Einwilligungen widerrufen (Link in der Datenschutzerklärung)
document.querySelectorAll('[data-einwilligung-zuruecksetzen]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  try { Object.keys(localStorage).filter(k => k.startsWith('einwilligung-')).forEach(k => localStorage.removeItem(k)); } catch (err) {}
  a.textContent = 'Erledigt: Alle Einwilligungen wurden zurückgesetzt.';
}));

// Untere Terminleiste (Handy): immer sichtbar, außer wenn ein großer Termin-Button im Bild ist; auf der Kontaktseite nie
(() => {
  const leiste = document.querySelector('.mobile-cta');
  if (!leiste) return;
  if (/kontakt\.html$/.test(location.pathname)) { leiste.remove(); return; }
  document.body.classList.add('cta-aktiv');
  const knoepfe = [...document.querySelectorAll('main .btn-primary')];
  const pruefen = () => {
    const h = window.innerHeight;
    const imBild = knoepfe.some(k => { const r = k.getBoundingClientRect(); return r.bottom > 0 && r.top < h - 70; });
    leiste.classList.toggle('sichtbar', !imBild);
  };
  addEventListener('scroll', pruefen, { passive: true });
  addEventListener('resize', pruefen);
  pruefen();
})();
