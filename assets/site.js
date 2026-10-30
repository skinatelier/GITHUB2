document.documentElement.classList.add('js');

// Einblendungen einmalig beim Scrollen
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .1, rootMargin: '0px 0px -40px 0px' }) : null;
document.querySelectorAll('.reveal').forEach(el => io ? io.observe(el) : el.classList.add('in'));

// Menü: Panel von rechts (wie Vorbild), schließt per ×, Schleier oder Esc
const menue = document.getElementById('menue');
const mb = document.querySelector('.menu-btn');
const schleier = document.querySelector('.menue-schleier');
if (menue && mb) {
  const setzen = auf => {
    mb.setAttribute('aria-expanded', auf);
    document.documentElement.classList.toggle('menue-offen', auf);
    if (auf) { menue.hidden = false; schleier.hidden = false; requestAnimationFrame(() => menue.classList.add('offen')); menue.querySelector('.menue-zu').focus(); }
    else { menue.classList.remove('offen'); setTimeout(() => { if (!menue.classList.contains('offen')) { menue.hidden = true; schleier.hidden = true; } }, 350); mb.focus(); }
  };
  mb.addEventListener('click', () => setzen(true));
  menue.querySelector('.menue-zu').addEventListener('click', () => setzen(false));
  schleier.addEventListener('click', () => setzen(false));
  addEventListener('keydown', e => { if (e.key === 'Escape' && menue.classList.contains('offen')) setzen(false); });
  menue.querySelectorAll('a[href*="#"]').forEach(a => a.addEventListener('click', () => setzen(false)));
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

// Untere Terminleiste (Handy): immer sichtbar, außer wenn ein großer Termin-Button im Bild ist; auf Kontakt- und Terminseite nie
(() => {
  const leiste = document.querySelector('.mobile-cta');
  if (!leiste) return;
  if (/(kontakt|termin)\.html$/.test(location.pathname)) { leiste.remove(); return; }
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

// PMU-Pen-Animation (Augenbrauen-PMU): Vorzeichnung, dann Powder-Schattierung Punkt für Punkt
(() => {
  const fig = document.querySelector('.pmu-anim');
  if (!fig) return;
  const svg = fig.querySelector('svg');
  const form = fig.querySelector('.braue-vorzeichnung');
  const lage = fig.querySelector('.braue-pigment');
  const pen = fig.querySelector('.pmu-pen');
  const NS = 'http://www.w3.org/2000/svg';
  const ruhig = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Punkte innerhalb der Brauenform, vorn heller (Ombré), zum Ende dichter
  const innen = (x, y) => {
    try { const p = svg.createSVGPoint(); p.x = x; p.y = y; return form.isPointInFill(p); } catch (e) { return true; }
  };
  const glatt = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const punkte = [];
  for (let i = 0; i < 5200 && punkte.length < 1500; i++) {
    const x = 56 + Math.random() * 420, y = 86 + Math.random() * 98;
    const u = (x - 56) / 420;
    if (Math.random() > .3 + .7 * glatt(0, .4, u) || !innen(x, y)) continue;
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1));
    c.setAttribute('r', (.7 + Math.random() * .9).toFixed(2));
    c.dataset.o = ((.12 + .5 * glatt(0, .45, u)) * (.6 + Math.random() * .4)).toFixed(2);
    c.style.opacity = 0;
    punkte.push({ x, y, c });
  }
  // Reihenfolge wie beim Schattieren: in schmalen Bahnen von vorn nach hinten, auf und ab
  punkte.sort((a, b) => {
    const sa = Math.floor(a.x / 7), sb = Math.floor(b.x / 7);
    return sa - sb || (sa % 2 ? b.y - a.y : a.y - b.y);
  });
  punkte.forEach(p => lage.appendChild(p.c));
  const zeigeAlle = () => punkte.forEach(p => { p.c.style.opacity = p.c.dataset.o; });

  let px = 520, py = 20;
  const setzePen = (x, y) => pen.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
  setzePen(px, py);

  if (ruhig) { zeigeAlle(); fig.classList.add('pen-an'); setzePen(478, 150); return; }

  const DAUER = 5600;
  let laeuft = false, sichtbar = false, timer = 0;
  const warte = ms => new Promise(r => { timer = setTimeout(r, ms); });

  async function durchlauf() {
    laeuft = true;
    punkte.forEach(p => { p.c.style.transition = ''; p.c.style.opacity = 0; });
    fig.classList.remove('zeichnet', 'pen-an', 'arbeitet');
    await warte(400);
    fig.classList.add('zeichnet');                    // Vorzeichnung
    await warte(1700);
    px = 470; py = 30; setzePen(px, py);
    fig.classList.add('pen-an');
    await new Promise(fertig => {                      // Pen fährt zum Brauenanfang
      const ziel = punkte[0];
      const schritt = () => {
        px += (ziel.x - px) * .12; py += (ziel.y - py) * .12; setzePen(px, py);
        if (Math.hypot(ziel.x - px, ziel.y - py) < 1.5) return fertig();
        requestAnimationFrame(schritt);
      };
      requestAnimationFrame(schritt);
    });
    fig.classList.add('arbeitet');
    await new Promise(fertig => {                      // Schattieren
      const start = performance.now();
      let n = 0;
      const schritt = jetzt => {
        const soll = Math.min(punkte.length, Math.floor((jetzt - start) / DAUER * punkte.length));
        for (; n < soll; n++) punkte[n].c.style.opacity = punkte[n].c.dataset.o;
        const z = punkte[Math.min(n, punkte.length - 1)];
        px += (z.x - px) * .3; py += (z.y - py) * .3; setzePen(px, py);
        if (n >= punkte.length) return fertig();
        requestAnimationFrame(schritt);
      };
      requestAnimationFrame(schritt);
    });
    fig.classList.remove('arbeitet');
    await new Promise(fertig => {                      // Pen hebt ab
      const schritt = () => {
        px += (500 - px) * .06; py += (20 - py) * .06; setzePen(px, py);
        if (py < 30) return fertig();
        requestAnimationFrame(schritt);
      };
      requestAnimationFrame(schritt);
    });
    fig.classList.remove('pen-an');
    await warte(2800);                                 // Ergebnis stehen lassen
    punkte.forEach(p => { p.c.style.transition = 'opacity .8s'; p.c.style.opacity = 0; });
    fig.classList.remove('zeichnet');
    await warte(1000);
    laeuft = false;
    if (sichtbar) durchlauf();
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => {
      sichtbar = es[0].isIntersecting;
      if (sichtbar && !laeuft) durchlauf();
    }, { threshold: .4 }).observe(fig);
  } else { zeigeAlle(); }
})();

// Startseite: Vorhang mit großem Logo (einmal pro Besuch), danach fährt das Porträt hoch
(() => {
  const h = document.documentElement;
  if (!h.classList.contains('hero-anim')) return;
  const los = () => h.classList.add('hero-los');
  const vorhang = document.querySelector('.vorhang');
  if (!h.classList.contains('vorhang-an') || !vorhang) { requestAnimationFrame(() => requestAnimationFrame(los)); return; }

  let fertig = false;
  const raus = () => {
    if (fertig) return; fertig = true;
    try { sessionStorage.setItem('vorhang', '1'); } catch (e) {}
    const logo = vorhang.querySelector('.vorhang-logo');
    const ziel = document.querySelector('.logo-kopf');
    if (logo && ziel) {
      const a = logo.getBoundingClientRect(), b = ziel.getBoundingClientRect();
      const s = b.width / a.width;
      logo.style.animation = 'none';
      logo.getBoundingClientRect();
      requestAnimationFrame(() => { logo.style.transform = `translate(${b.left - a.left}px,${b.top - a.top}px) scale(${s})`; });
    }
    // „GLOW WITH CONFIDENCE“: jede Zeile gleitet an ihren Platz im Einstieg und blendet dort über
    const claim = vorhang.querySelector('.vorhang-claim');
    const glow = document.querySelector('.hero-text .glow');
    if (claim && glow) {
      const cz = [...claim.children], gz = [...glow.children];
      const cs = getComputedStyle(claim), gs = getComputedStyle(glow);
      const s = parseFloat(gs.fontSize) / parseFloat(cs.fontSize);
      claim.style.opacity = cs.opacity;
      cz.forEach(z => { z.style.letterSpacing = cs.letterSpacing; });
      claim.style.animation = 'none';
      glow.style.transition = 'none'; glow.style.transform = 'none';
      // linke Kante festhalten, damit die Zeile beim Ändern des Buchstabenabstands nicht verrutscht
      const p = claim.getBoundingClientRect();
      claim.style.width = p.width + 'px';
      cz.forEach(z => { z.style.marginLeft = (z.getBoundingClientRect().left - p.left) + 'px'; z.style.marginRight = '0'; });
      const wege = cz.map((z, i) => {
        const c = z.getBoundingClientRect(), g = (gz[i] || glow).getBoundingClientRect();
        return [g.left - c.left, (g.top + g.height / 2) - (c.top + c.height * s / 2)];
      });
      requestAnimationFrame(() => {
        const bahn = '.95s cubic-bezier(.76,0,.24,1)';
        cz.forEach((z, i) => {
          z.style.transition = `transform ${bahn}, letter-spacing ${bahn}`;
          z.style.transform = `translate(${wege[i][0]}px,${wege[i][1]}px) scale(${s})`;
          z.style.letterSpacing = (parseFloat(gs.letterSpacing) / s) + 'px';
        });
        claim.style.transition = 'opacity .35s ease .8s';
        claim.style.opacity = 0;
        glow.style.transition = 'opacity .35s ease .4s';
      });
    }
    h.classList.add('vorhang-raus');
    setTimeout(los, 380);
    setTimeout(() => { h.classList.remove('vorhang-an', 'vorhang-raus'); vorhang.remove(); }, 1250);
  };
  const timer = setTimeout(raus, 2500);
  const abkuerzen = () => { clearTimeout(timer); raus(); };
  vorhang.addEventListener('click', abkuerzen);
  ['keydown', 'wheel', 'touchstart'].forEach(t => addEventListener(t, abkuerzen, { once: true, passive: true }));
})();

// Terminbuchung (termin.html): 4 Schritte Behandlung → Termin → Daten → Zusammenfassung.
// Stufe 1 (Demo): freie Zeiten sind Beispielzeiten, gesendet wird per WhatsApp oder E-Mail durch die Person selbst.
// Stufe 2: zeitenLaden() fragt später den Buchungsserver nach echten freien Zeiten.
(() => {
  const bu = document.getElementById('buchung');
  const datenEl = document.getElementById('buchung-daten');
  if (!bu || !datenEl) return;
  const LEISTUNGEN = JSON.parse(datenEl.textContent);
  const SCHRITTE = ['Behandlung', 'Termin', 'Deine Daten', 'Zusammenfassung'];
  const TAGE_VORAUS = 42;
  const OEFFNUNG = { 1: [10, 19], 2: [10, 19], 3: [10, 19], 4: [10, 19], 5: [10, 19], 6: [10, 15] }; // Demo, So geschlossen
  const WOCHENTAG = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const WOCHENTAG_LANG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const MONAT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const MONAT_LANG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

  const $ = s => bu.querySelector(s);
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const euro = p => parseInt(String(p).replace(/\D/g, ''), 10) || 0;
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const datumLang = d => `${WOCHENTAG_LANG[d.getDay()]}, ${d.getDate()}. ${MONAT_LANG[d.getMonth()]} ${d.getFullYear()}`;
  const uhr = m => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

  const st = { schritt: 1, auswahl: new Map(), tag: null, zeit: null };

  // Gewählte Behandlung mit Variante → {name, min, preis}
  const posten = () => [...st.auswahl].map(([id, vi]) => {
    const l = LEISTUNGEN.find(x => x.id === id);
    const v = l.varianten.length ? l.varianten[vi] : null;
    return { name: l.name + (v ? ` (${v.name})` : ''), min: v ? v.min : l.min, preis: v ? v.preis : l.preis };
  });
  const summe = () => posten().reduce((a, p) => ({ min: a.min + p.min, preis: a.preis + euro(p.preis) }), { min: 0, preis: 0 });

  // Schritt 1: Behandlungen
  const liste = $('[data-liste]');
  const kats = [...new Set(LEISTUNGEN.map(l => l.kat))];
  liste.innerHTML = kats.map(k => `<p class="bu-kat" id="kat-${k === 'Augenbrauen-PMU' ? 'pmu' : 'gesicht'}">${esc(k)}</p>` +
    LEISTUNGEN.filter(l => l.kat === k).map(l => `
    <div class="bu-karte" data-id="${l.id}">
      <button class="bu-karte-kopf" type="button" aria-expanded="false">
        <span class="bu-haken" aria-hidden="true"></span>
        <span class="bu-name">${esc(l.name)}<span class="bu-dauer">${l.varianten.length ? 'ab ' + Math.min(...l.varianten.map(v => v.min)) : l.min} Min.</span></span>
        <span class="bu-karte-preis">${esc(l.preis)}</span>
      </button>
      <div class="bu-karte-mehr" hidden>
        <p>${esc(l.text)}</p>
        ${l.varianten.length ? `<fieldset class="bu-varianten"><legend>Variante wählen</legend>${l.varianten.map((v, i) => `
          <label class="bu-variante"><input type="radio" name="var-${l.id}" value="${i}"${i === 0 ? ' checked' : ''}><span>${esc(v.name)}</span><span class="muted">${v.min} Min.</span><span>${esc(v.preis)}</span></label>`).join('')}</fieldset>` : ''}
        <button class="bu-entfernen" type="button">Aus Auswahl entfernen</button>
      </div>
    </div>`).join('')).join('');

  const karteSetzen = (karte, an) => {
    const id = karte.dataset.id;
    if (an) {
      const r = karte.querySelector('input[type=radio]:checked');
      st.auswahl.set(id, r ? +r.value : 0);
    } else st.auswahl.delete(id);
    karte.classList.toggle('gewaehlt', an);
    karte.querySelector('.bu-karte-kopf').setAttribute('aria-expanded', an);
    karte.querySelector('.bu-karte-mehr').hidden = !an;
    st.tag = null; st.zeit = null; // Dauer geändert → Termin neu wählen
    aktualisieren();
  };
  liste.addEventListener('click', e => {
    const karte = e.target.closest('.bu-karte');
    if (!karte) return;
    if (e.target.closest('.bu-karte-kopf')) karteSetzen(karte, !st.auswahl.has(karte.dataset.id));
    if (e.target.closest('.bu-entfernen')) karteSetzen(karte, false);
  });
  liste.addEventListener('change', e => {
    const karte = e.target.closest('.bu-karte');
    if (karte && e.target.type === 'radio') { st.auswahl.set(karte.dataset.id, +e.target.value); st.tag = null; st.zeit = null; aktualisieren(); }
  });

  // Schritt 2: Tage und Uhrzeiten
  const ostern = j => { // Gaußsche Osterformel
    const a = j % 19, b = Math.floor(j / 100), c = j % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
      g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
      l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31);
    return new Date(j, mo - 1, ((h + l - 7 * m + 114) % 31) + 1);
  };
  const feiertag = d => { // Berlin
    const j = d.getFullYear(), o = ostern(j), plus = n => iso(new Date(o.getFullYear(), o.getMonth(), o.getDate() + n));
    return [`${j}-01-01`, `${j}-03-08`, `${j}-05-01`, `${j}-10-03`, `${j}-12-25`, `${j}-12-26`, plus(-2), plus(1), plus(39), plus(50)].includes(iso(d));
  };
  const tageEl = $('[data-tage]');
  const heute = new Date(); heute.setHours(0, 0, 0, 0);
  const tage = Array.from({ length: TAGE_VORAUS }, (_, i) => new Date(heute.getFullYear(), heute.getMonth(), heute.getDate() + i));
  tageEl.innerHTML = tage.map((d, i) => {
    const zu = i === 0 || !OEFFNUNG[d.getDay()] || feiertag(d);
    return `<button class="bu-tag" type="button" role="option" aria-selected="false" data-tag="${iso(d)}"${zu ? ' disabled' : ''}
      aria-label="${datumLang(d)}${zu ? ', nicht buchbar' : ''}"><span>${WOCHENTAG[d.getDay()]}</span><strong>${d.getDate()}</strong><span>${feiertag(d) ? 'Ftg.' : MONAT[d.getMonth()]}</span></button>`;
  }).join('');

  // Demo: Beispielzeiten (Öffnungszeiten minus zufällig, aber gleichbleibend belegte Zeiten)
  const zeitenLaden = (tagIso, dauer) => new Promise(ok => setTimeout(() => {
    const d = new Date(tagIso + 'T00:00'), [von, bis] = OEFFNUNG[d.getDay()];
    const frei = [];
    for (let m = von * 60; m + dauer <= bis * 60; m += 30) {
      const h = [...(tagIso + m)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7);
      if (h % 10 >= 4) frei.push(uhr(m));
    }
    ok(frei);
  }, 450));

  const zeitenWrap = $('[data-zeiten-wrap]'), zeitenEl = $('[data-zeiten]');
  tageEl.addEventListener('click', async e => {
    const b = e.target.closest('.bu-tag');
    if (!b || b.disabled) return;
    st.tag = b.dataset.tag; st.zeit = null;
    tageEl.querySelectorAll('.bu-tag').forEach(x => x.setAttribute('aria-selected', x === b));
    zeitenWrap.hidden = false;
    $('[data-zeiten-titel]').textContent = `Freie Zeiten am ${datumLang(new Date(st.tag + 'T00:00')).replace(/ \d{4}$/, '')}`;
    zeitenEl.innerHTML = '<p class="bu-laden">Freie Zeiten werden geladen …</p>';
    aktualisieren();
    const frei = await zeitenLaden(st.tag, summe().min);
    if (st.tag !== b.dataset.tag) return;
    zeitenEl.innerHTML = frei.length
      ? frei.map(z => `<button class="bu-zeit" type="button" role="option" aria-selected="false">${z}</button>`).join('')
      : '<p class="bu-laden">An diesem Tag ist für deine Behandlung leider nichts frei. Wähle bitte einen anderen Tag.</p>';
  });
  zeitenEl.addEventListener('click', e => {
    const b = e.target.closest('.bu-zeit');
    if (!b) return;
    st.zeit = b.textContent;
    zeitenEl.querySelectorAll('.bu-zeit').forEach(x => x.setAttribute('aria-selected', x === b));
    aktualisieren();
  });

  // Schritt 3: Kontaktdaten prüfen
  const form = document.getElementById('bu-daten');
  form.addEventListener('submit', e => e.preventDefault());
  const datenOk = () => {
    let ok = true;
    [...form.elements].filter(el => el.required).forEach(el => {
      const bad = el.type === 'checkbox' ? !el.checked : el.type === 'email' ? !/^\S+@\S+\.\S+$/.test(el.value.trim()) : !el.value.trim();
      el.closest('.field').classList.toggle('invalid', bad);
      el.setAttribute('aria-invalid', bad);
      if (bad && ok) { el.focus(); ok = false; }
    });
    return ok;
  };

  // Schritt 4: Zusammenfassung und Nachricht
  const nachricht = () => {
    const f = form.elements, s = summe(), d = new Date(st.tag + 'T00:00');
    return ['Hallo Malina, ich möchte gerne einen Termin anfragen:',
      ...posten().map(p => `• ${p.name}, ${p.min} Min., ${p.preis}`),
      `Wunschtermin: ${datumLang(d)}, ${st.zeit} Uhr`,
      `Gesamt: ${s.min} Min., ${s.preis} €`, '',
      `Name: ${f.vorname.value.trim()} ${f.nachname.value.trim()}`,
      `E-Mail: ${f.email.value.trim()}`, `Telefon: ${f.tel.value.trim()}`,
      f.notiz.value.trim() ? `Anmerkungen: ${f.notiz.value.trim()}` : '', '',
      'Die Bedingungen zu Absage und Verschiebung habe ich gelesen.'].filter((z, i, a) => z !== '' || a[i - 1] !== '').join('\n');
  };
  const zusammenfassen = () => {
    const f = form.elements, s = summe(), d = new Date(st.tag + 'T00:00');
    $('[data-zusammenfassung]').innerHTML = `
      <ul class="bu-posten">${posten().map(p => `<li><span>${esc(p.name)}<span class="muted">${p.min} Min.</span></span><span>${esc(p.preis)}</span></li>`).join('')}
        <li class="bu-gesamt"><span>Gesamt<span class="muted">${s.min} Min.</span></span><span>${s.preis} €</span></li></ul>
      <dl class="bu-angaben">
        <dt>Termin</dt><dd>${datumLang(d)}, ${st.zeit} Uhr</dd>
        <dt>Ort</dt><dd>SKIN ATELIER, Breite Straße 23, 13187 Berlin-Pankow</dd>
        <dt>Name</dt><dd>${esc(f.vorname.value.trim() + ' ' + f.nachname.value.trim())}</dd>
        <dt>Kontakt</dt><dd>${esc(f.email.value.trim())} · ${esc(f.tel.value.trim())}</dd>
        ${f.notiz.value.trim() ? `<dt>Anmerkungen</dt><dd>${esc(f.notiz.value.trim())}</dd>` : ''}
      </dl>`;
  };
  bu.querySelectorAll('[data-senden]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const t = nachricht();
    if (a.dataset.senden === 'whatsapp') window.open('https://wa.me/4916095902220?text=' + encodeURIComponent(t), '_blank', 'noopener');
    else location.href = 'mailto:info@skinatelier.studio?subject=' + encodeURIComponent('Terminanfrage ' + datumLang(new Date(st.tag + 'T00:00')) + ', ' + st.zeit + ' Uhr') + '&body=' + encodeURIComponent(t);
  }));

  // Fortschritt, Leiste unten, Navigation
  const weiter = $('[data-weiter]'), zurueck = $('[data-zurueck]');
  const aktualisieren = () => {
    const s = summe(), n = st.auswahl.size;
    $('[data-summe-text]').textContent = n ? `${n} ${n === 1 ? 'Behandlung' : 'Behandlungen'} · ${s.min} Min.` : 'Noch keine Behandlung gewählt';
    $('[data-summe-preis]').textContent = n ? `${s.preis} €` : '';
    weiter.disabled = st.schritt === 1 ? !n : st.schritt === 2 ? !st.zeit : false;
    weiter.hidden = st.schritt === 4;
    zurueck.hidden = st.schritt === 1;
    bu.querySelectorAll('.bu-fortschritt li').forEach((li, i) => { li.classList.toggle('fertig', i < st.schritt - 1); li.classList.toggle('aktiv', i === st.schritt - 1); });
    $('.bu-schritt-text').textContent = `Schritt ${st.schritt} von 4, ${SCHRITTE[st.schritt - 1]}`;
  };
  const zeigen = n => {
    if (n === 2 && !st.tag) { zeitenWrap.hidden = true; tageEl.querySelectorAll('.bu-tag').forEach(x => x.setAttribute('aria-selected', false)); }
    if (n === 4) zusammenfassen();
    st.schritt = n;
    bu.querySelectorAll('.bu-schritt').forEach(el => el.hidden = +el.dataset.schritt !== n);
    aktualisieren();
    bu.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const titel = bu.querySelector(`[data-schritt="${n}"] .bu-titel`);
    titel.setAttribute('tabindex', '-1'); titel.focus({ preventScroll: true });
  };
  weiter.addEventListener('click', () => { if (st.schritt === 3 && !datenOk()) return; zeigen(st.schritt + 1); });
  zurueck.addEventListener('click', () => zeigen(st.schritt - 1));

  // Vorauswahl über die Adresse, z. B. termin.html?id=pmu-vorberatung oder ?kat=pmu
  const q = new URLSearchParams(location.search);
  const vor = q.get('id') && liste.querySelector(`.bu-karte[data-id="${CSS.escape(q.get('id'))}"]`);
  if (vor) karteSetzen(vor, true);
  const kat = q.get('kat') && document.getElementById('kat-' + q.get('kat'));
  if (kat && !vor) setTimeout(() => kat.scrollIntoView({ block: 'center' }), 100);
  aktualisieren();
})();
