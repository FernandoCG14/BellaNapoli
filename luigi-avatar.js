// Avatar de Chef Luigi: monta el SVG y cambia de estado según los eventos de Botpress.
(() => {
  'use strict';

  const LABELS = {
    idle: 'Chef Luigi en espera',
    think: 'Chef Luigi está pensando',
    talk: 'Chef Luigi está respondiendo',
    idk: 'Chef Luigi no sabe la respuesta'
  };
  // Frases con las que el bot suele decir que no sabe algo. Ajusta a tu bot.
  const UNSURE = /\b(no s[eé]\b|no tengo (esa |la )?informaci[oó]n|no puedo (ayudarte|responder)|no estoy segur[oa]|no encontr[eé]|no cuento con|no entend[ií])/i;

  /*FACE*/
  const FACE = `
  <g class="all">
   <path d="M26 232 Q30 176 100 170 Q170 176 174 232Z" fill="#fff" stroke="#D9CDB4" stroke-width="3"/>
   <path d="M100 172 V232" stroke="#D9CDB4" stroke-width="3"/>
   <circle cx="90" cy="198" r="3" fill="#D9CDB4"/><circle cx="90" cy="214" r="3" fill="#D9CDB4"/>
   <path d="M70 168 L130 168 L100 200Z" fill="#e63946"/>
   <path d="M70 168 L100 200 L80 204Z" fill="#c92a37"/>
   <g class="head">
    <g fill="#fff" stroke="#D9CDB4" stroke-width="3">
     <circle cx="74" cy="40" r="22"/><circle cx="126" cy="40" r="22"/><circle cx="100" cy="28" r="27"/>
     <rect x="58" y="46" width="84" height="18" rx="5"/>
    </g>
    <rect x="58" y="56" width="84" height="5" fill="#2F5D3A"/>
    <circle cx="50" cy="104" r="9" fill="#EBA97E"/><circle cx="150" cy="104" r="9" fill="#EBA97E"/>
    <ellipse cx="100" cy="106" rx="51" ry="52" fill="#F4BC90"/>
    <path d="M58 64 Q100 74 142 64 V60 H58Z" fill="#F4BC90"/>
    <circle cx="66" cy="114" r="9" fill="#E8806F" opacity=".45"/><circle cx="134" cy="114" r="9" fill="#E8806F" opacity=".45"/>
    <g class="eye"><ellipse cx="82" cy="90" rx="9" ry="10" fill="#fff"/><circle class="pupil" cx="82" cy="91" r="4.8" fill="#3B2A22"/></g>
    <g class="eye"><ellipse cx="118" cy="90" rx="9" ry="10" fill="#fff"/><circle class="pupil" cx="118" cy="91" r="4.8" fill="#3B2A22"/></g>
    <path class="brow l" d="M70 75 Q82 69 94 75" stroke="#3B2A22" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path class="brow r" d="M106 75 Q118 69 130 75" stroke="#3B2A22" stroke-width="5" stroke-linecap="round" fill="none"/>
    <ellipse cx="100" cy="108" rx="10" ry="8" fill="#E6A279"/>
    <path class="m m-idle" d="M86 138 Q100 150 114 138" stroke="#3B2A22" stroke-width="3.5" stroke-linecap="round" fill="none"/>
    <ellipse class="m m-think" cx="106" cy="141" rx="4.5" ry="3.5" fill="#7A2E24"/>
    <g class="m m-talk"><ellipse class="open" cx="100" cy="141" rx="10" ry="8" fill="#7A2E24"/></g>
    <path class="m m-idk" d="M86 142 Q93 136 100 142 T114 142" stroke="#3B2A22" stroke-width="3.5" stroke-linecap="round" fill="none"/>
    <path class="stache" d="M100 118 C88 111 64 113 60 128 C58 137 69 140 75 133 C83 126 93 129 100 127 C107 129 117 126 125 133 C131 140 142 137 140 128 C136 113 112 111 100 118Z" fill="#3B2A22"/>
    <g class="x x-think"><circle class="dot" cx="150" cy="38" r="5" fill="#e63946"/><circle class="dot" cx="166" cy="30" r="5" fill="#e63946"/><circle class="dot" cx="182" cy="22" r="5" fill="#e63946"/></g>
    <g class="x x-talk" fill="none" stroke="#2F5D3A" stroke-width="4" stroke-linecap="round"><path class="arc" d="M164 96 Q172 106 164 116"/><path class="arc" d="M174 88 Q188 106 174 124"/></g>
    <g class="x x-idk"><text class="q" x="150" y="52" font-family="Playfair Display,Georgia,serif" font-weight="700" font-size="40" fill="#e63946">?</text><path class="sweat" d="M146 86 q6 10 0 14 q-6 -4 0 -14z" fill="#6FB6E8"/></g>
   </g>
  </g>`;
  /*END FACE*/

  const avatars = [];
  const live = document.createElement('span');
  live.className = 'luigi-sr';
  live.setAttribute('role', 'status');
  let hold, guard, fabEl, isOpen = false;

  let domWorks = false; // true cuando logramos detectar la ventana del chat en el DOM

  // Chat abierto: Luigi se coloca junto a la ventana (r = rectángulo medido del chat, si lo tenemos)
  function setOpen(v, r) {
    isOpen = v;
    if (!fabEl) return;
    fabEl.classList.toggle('is-beside', v);
    const s = fabEl.style;
    if (v && r) {
      s.left = 'auto';
      s.right = (innerWidth - r.left + 16) + 'px';
      s.bottom = Math.max(0, innerHeight - r.bottom) + 'px';
    } else { s.left = s.right = s.bottom = ''; }
    fabEl.setAttribute('aria-label', v ? 'Cerrar chat con Chef Luigi' : 'Abrir chat con Chef Luigi');
  }
  // Los eventos solo mandan mientras no podamos ver la ventana del chat en el DOM
  const viaEvent = v => { if (!domWorks) setOpen(v); };

  // Busca la ventana flotante del chat de Botpress y devuelve su rectángulo
  function candidates() {
    const sel = 'iframe,[id*="bp" i],[class*="bp" i],[id*="botpress" i],[class*="botpress" i]';
    return [...document.querySelectorAll(sel)].filter(el => !el.closest('.luigi-fab,.cart-drawer,.cart-drawer-overlay'));
  }
  function findChat() {
    for (const el of candidates()) {
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
      if (r.width >= 280 && r.width <= 700 && r.height >= 350 && r.left >= 0 && r.right <= innerWidth + 2 && r.top < innerHeight && r.bottom > 0) return r;
    }
    return null;
  }
  function tick() {
    const r = findChat();
    if (r) { domWorks = true; setOpen(true, r); }
    else if (domWorks && isOpen) setOpen(false);
  }
  window.luigiAvatar = Object.assign(window.luigiAvatar || {}, {
    debug() { console.table(candidates().map(el => { const r = el.getBoundingClientRect(); return { tag: el.tagName, id: el.id, cls: String(el.className).slice(0, 50), w: Math.round(r.width), h: Math.round(r.height), left: Math.round(r.left) }; })); console.log({ domWorks, isOpen }); }
  });

  function make(decorative) {
    const w = document.createElement('div');
    w.innerHTML = `<svg class="luigi-av" data-s="idle" viewBox="0 0 200 230" ${decorative ? 'aria-hidden="true"' : `role="img" aria-label="${LABELS.idle}"`}>${FACE}</svg>`;
    const svg = w.firstElementChild;
    avatars.push(svg);
    return svg;
  }

  // Cambia el estado. Con ms, vuelve a "idle" pasado ese tiempo.
  function set(state, ms) {
    clearTimeout(hold);
    clearTimeout(guard);
    avatars.forEach(a => {
      a.dataset.s = state;
      if (!a.hasAttribute('aria-hidden')) a.setAttribute('aria-label', LABELS[state]);
    });
    live.textContent = state === 'idle' ? '' : LABELS[state];
    // Si el bot tarda demasiado en contestar, Luigi se rinde.
    if (state === 'think') guard = setTimeout(() => set('idk', 4000), 25000);
    if (ms) hold = setTimeout(() => set('idle'), ms);
  }
  window.luigiAvatar = { set }; // control manual: luigiAvatar.set('talk', 3000)

  const textOf = m => typeof m === 'string' ? m :
    (m?.text || m?.payload?.text || m?.block?.text || m?.message?.payload?.text || '');

  function bind(tries = 0) {
    const bp = window.botpress;
    if (!bp?.on) {
      if (tries < 50) setTimeout(() => bind(tries + 1), 300);
      return;
    }
    // Eventos de apertura/cierre + respaldo envolviendo open() y close()
    bp.on('webchat:opened', () => viaEvent(true));
    bp.on('webchat:closed', () => viaEvent(false));
    bp.on('webchatVisibility', e => {
      const v = e?.visibility ?? e;
      if (v === 'show' || v === 'hide') viaEvent(v === 'show');
    });
    [['open', true], ['close', false]].forEach(([fn, val]) => {
      try {
        const orig = bp[fn]?.bind(bp);
        if (orig) bp[fn] = (...a) => { viaEvent(val); return orig(...a); };
      } catch (e) { /* si no se puede envolver, quedan los eventos */ }
    });
    bp.on('messageSent', () => set('think'));
    bp.on('message', m => {
      if (window.LUIGI_DEBUG) console.log('[Luigi] message', m);
      if (m?.direction === 'outgoing') return set('think'); // eco del mensaje del usuario
      const t = textOf(m);
      if (UNSURE.test(t)) set('idk', 4500);
      else set('talk', Math.min(7000, Math.max(1800, 1200 + t.length * 35)));
    });
  }

  function init() {
    document.querySelectorAll('[data-luigi-avatar]').forEach(h => h.appendChild(make(false)));

    const fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'luigi-fab';
    fab.setAttribute('aria-label', 'Abrir chat con Chef Luigi');
    fab.appendChild(make(true));
    fab.addEventListener('click', () => isOpen ? window.botpress?.close?.() : window.botpress?.open?.());
    fabEl = fab;
    document.body.append(fab, live);

    // Feedback inmediato al elegir una de las opciones de la sección
    document.querySelectorAll('.ai-option-card[data-prompt]').forEach(b =>
      b.addEventListener('click', () => set('think')));

    bind();
    setInterval(tick, 400);
    window.addEventListener('resize', tick);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
