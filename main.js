/* FIP — interactions et animations */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---- Écran de chargement : logo animé + barre de progression ---- */
  (() => {
    const pre = $('#preloader'), bar = $('#preloader-bar'), pct = $('#preloader-pct');
    const root = document.documentElement;
    if (!pre) { root.classList.remove('is-loading'); return; }
    let seen = false;
    try { seen = sessionStorage.getItem('fip-intro') === '1'; sessionStorage.setItem('fip-intro', '1'); } catch (e) {}
    const MIN = reduce ? 400 : (seen ? 1300 : 2600), MAX = 7000, t0 = performance.now();
    // ressources réellement attendues : images non différées + polices
    const imgs = $$('img').filter(i => i.loading !== 'lazy' && !pre.contains(i));
    const total = imgs.length + 2;
    let loaded = 0, pageReady = false, shown = 0, finished = false;
    const tickLoad = () => { loaded = Math.min(total, loaded + 1); };
    imgs.forEach(i => { if (i.complete) tickLoad(); else { i.addEventListener('load', tickLoad, { once: true }); i.addEventListener('error', tickLoad, { once: true }); } });
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(tickLoad);
    const onLoad = () => { pageReady = true; tickLoad(); };
    if (document.readyState === 'complete') onLoad(); else window.addEventListener('load', onLoad, { once: true });

    const finish = () => {
      if (finished) return; finished = true;
      bar.style.width = '100%'; pct.textContent = '100%';
      setTimeout(() => {
        pre.classList.add('is-done');
        root.classList.remove('is-loading');
        pre.setAttribute('aria-hidden', 'true');
        setTimeout(() => pre.remove(), 1500);
      }, reduce ? 50 : 380);
    };
    const step = now => {
      if (finished) return;
      const elapsed = now - t0;
      const real = loaded / total;                       // progression réelle
      const time = Math.min(1, elapsed / MIN);           // progression minimale dans le temps
      const target = Math.min(real, time) * 100;
      shown += (target - shown) * 0.12;                   // lissage
      const v = Math.min(99, Math.round(shown));
      bar.style.width = v + '%'; pct.textContent = v + '%';
      if ((pageReady && elapsed >= MIN && shown > 97) || elapsed > MAX) finish();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  })();

  /* ---- Navigation : fond au défilement, menu mobile, lien actif ---- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 10);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const burger = $('#burger'), menu = $('#mobile-menu');
  const closeMenu = () => { burger.setAttribute('aria-expanded', 'false'); menu.hidden = true; burger.setAttribute('aria-label', 'Ouvrir le menu'); };
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    if (open) closeMenu(); else { burger.setAttribute('aria-expanded', 'true'); menu.hidden = false; burger.setAttribute('aria-label', 'Fermer le menu'); }
  });
  $$('a', menu).forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  const links = $$('.nav__links a');
  const sectionObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) links.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(l => { const s = $(l.getAttribute('href')); if (s) sectionObs.observe(s); });

  /* ---- Apparitions au défilement (avec cascade) ---- */
  const groups = new Map();
  $$('.reveal').forEach(el => {
    const p = el.parentElement;
    const i = groups.get(p) || 0; groups.set(p, i + 1);
    el.style.setProperty('--d', Math.min(i * 0.08, 0.4) + 's');
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in-view'); io.unobserve(en.target); } });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---- Projecteur qui suit la souris sur les cartes ---- */
  $$('.spot').forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---- Constellation : les initiatives qui se relient ---- */
  const cv = $('#constellation');
  if (cv && !reduce) {
    const ctx = cv.getContext('2d');
    const colors = ['34,197,94', '252,209,22', '96,165,250'];
    let w, h, pts = [], dpr = Math.min(window.devicePixelRatio || 1, 2), mouse = { x: -999, y: -999 }, running = true;
    const resize = () => {
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(70, (w * h) / 16000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
        c: colors[Math.floor(Math.random() * 3)], r: Math.random() * 1.4 + .6
      }));
    };
    resize();
    window.addEventListener('resize', resize);
    cv.parentElement.addEventListener('pointermove', e => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    cv.parentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
    new IntersectionObserver(([en]) => { running = en.isIntersecting; if (running) requestAnimationFrame(tick); }).observe(cv);
    function tick() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (dm < 140) { p.x += (mouse.x - p.x) * .004; p.y += (mouse.y - p.y) * .004; }
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 120) { ctx.strokeStyle = `rgba(${a.c},${(1 - d / 120) * .22})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
        const p = pts[i], near = Math.hypot(p.x - mouse.x, p.y - mouse.y) < 140;
        ctx.fillStyle = `rgba(${p.c},${near ? .95 : .55})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, near ? p.r + 1.2 : p.r, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---- Carte « pipeline » animée en boucle ---- */
  const steps = $$('#pipeline li'), bar = $('#pipe-bar'), status = $('#pipe-status');
  const times = ['0:00', '0:12', '0:31', '0:48'];
  let k = 0;
  const runPipe = () => {
    steps.forEach((li, i) => {
      li.classList.toggle('is-on', i <= k);
      li.classList.toggle('is-ok', i < k || (k === steps.length));
      li.classList.toggle('is-run', i === k);
      $('.t', li).textContent = i <= k ? times[i] : '—';
    });
    bar.style.width = (Math.min(k, steps.length) / steps.length * 100) + '%';
    const done = k === steps.length;
    status.classList.toggle('is-done', done);
    $('span', status).textContent = done ? 'Accompagnée' : 'En cours';
    if (done) steps.forEach(li => { li.classList.remove('is-run'); li.classList.add('is-ok', 'is-on'); });
  };
  if (reduce) { k = steps.length; runPipe(); }
  else {
    runPipe();
    setInterval(() => { k = k >= steps.length ? 0 : k + 1; runPipe(); }, 1500);
  }

  /* ---- Lecteur vidéo du Directeur ---- */
  const video = $('#director-video'), overlay = $('#player-overlay'), empty = $('#player-empty');
  let videoOk = true;
  const src = video.querySelector('source');
  src.addEventListener('error', () => { videoOk = false; });
  video.addEventListener('error', () => { videoOk = false; });
  overlay.addEventListener('click', async () => {
    if (!videoOk || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
      empty.hidden = false; overlay.classList.add('is-hidden'); return;
    }
    overlay.classList.add('is-hidden');
    try { await video.play(); } catch { empty.hidden = false; }
  });
  video.addEventListener('pause', () => { if (video.currentTime === 0) overlay.classList.remove('is-hidden'); });
  // surligne le chapitre en cours pendant la lecture
  const chapBtns = $$('.player__chapters button');
  video.addEventListener('timeupdate', () => {
    let cur = 0;
    chapBtns.forEach((b, i) => { if (video.currentTime >= +b.dataset.time) cur = i; });
    chapBtns.forEach((b, i) => b.classList.toggle('is-current', i === cur && video.currentTime > 0));
  });
  $$('.player__chapters button').forEach(b => b.addEventListener('click', () => {
    if (!videoOk || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) { empty.hidden = false; overlay.classList.add('is-hidden'); return; }
    video.currentTime = +b.dataset.time; overlay.classList.add('is-hidden'); video.play().catch(() => {});
  }));

  /* ---- Rail de progression du parcours ---- */
  const stepsWrap = $('#steps'), prog = $('#steps-progress'), stepEls = $$('.step', stepsWrap);
  const onStepsScroll = () => {
    const r = stepsWrap.getBoundingClientRect(), vh = window.innerHeight;
    const p = Math.max(0, Math.min(1, (vh * .6 - r.top) / r.height));
    prog.style.height = (p * 100) + '%';
    stepEls.forEach(s => { const sr = s.getBoundingClientRect(); s.classList.toggle('is-lit', sr.top < vh * .6); });
  };
  window.addEventListener('scroll', onStepsScroll, { passive: true });
  onStepsScroll();

  /* ---- Compteurs ---- */
  const countObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target, end = +el.dataset.count, suf = el.dataset.suffix || '';
      countObs.unobserve(el);
      if (reduce) { el.textContent = end + suf; return; }
      const start = end > 1000 ? end - 40 : 0, t0 = performance.now(), dur = 1600;
      const step = now => {
        const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(start + (end - start) * e) + (p === 1 ? suf : '');
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: .5 });
  $$('[data-count]').forEach(el => countObs.observe(el));

  /* ---- Quiz d'orientation ---- */
  const quiz = $('#quiz'), qSteps = $$('.quiz__step', quiz), qBar = $('#quiz-bar'), result = $('#quiz-result'), back = $('#quiz-back');
  const answers = {};
  let qi = 0;
  const profils = {
    idee: 'porteur·se d\'idée', tpe: 'dirigeant·e de TPE', pme: 'dirigeant·e de PME', pmi: 'dirigeant·e de PMI'
  };
  const besoins = {
    financement: { t: 'Cap sur le financement', s: ['Présentez votre projet et vos besoins chiffrés à la FIP', 'Construisez avec nous un dossier solide', 'Accédez à une solution financière juste et adaptée'] },
    accompagnement: { t: 'Un accompagnement sur mesure', s: ['Échange de diagnostic avec l\'équipe FIP', 'Plan d\'action concret pour votre activité', 'Suivi régulier et mise en relation'] },
    reseau: { t: 'Rejoignez le réseau FIP', s: ['Inscrivez-vous comme membre du réseau', 'Rencontrez d\'autres entrepreneurs gabonais', 'Portez une voix commune auprès des décideurs'] },
    formalisation: { t: 'Formaliser pour grandir', s: ['Faites le point sur le statut de votre activité', 'Laissez-vous guider dans les démarches', 'Ouvrez la porte au financement et aux marchés'] }
  };
  const show = i => {
    qSteps.forEach((s, j) => s.classList.toggle('is-active', j === i));
    qBar.style.width = (i / qSteps.length * 100) + '%';
    back.hidden = i === 0 || i >= qSteps.length;
    const first = qSteps[i] && $('button', qSteps[i]);
    if (first && document.activeElement && quiz.contains(document.activeElement)) first.focus({ preventScroll: true });
  };
  const finish = () => {
    qSteps.forEach(s => s.classList.remove('is-active'));
    qBar.style.width = '100%'; back.hidden = true;
    const b = besoins[answers.besoin];
    $('#result-title').textContent = b.t;
    $('#result-text').textContent = `En tant que ${profils[answers.profil]} dans la province ${answers.lieu === 'Estuaire' ? 'de l\'Estuaire' : 'du ' + answers.lieu}, la FIP peut vous accompagner. Voici votre parcours conseillé :`;
    $('#result-steps').innerHTML = b.s.map(x => `<li>${x}</li>`).join('');
    result.hidden = false;
    $('#result-title').setAttribute('tabindex', '-1'); $('#result-title').focus({ preventScroll: true });
    // pré-remplir le formulaire
    const sel = $('select[name="profil"]');
    const map = { idee: 0, tpe: 1, pme: 2, pmi: 3 };
    sel.selectedIndex = map[answers.profil];
    const msg = $('textarea[name="message"]');
    if (!msg.value) msg.value = `Province : ${answers.lieu}\nBesoin principal : ${b.t}\n\nMon initiative : `;
  };
  qSteps.forEach((s, i) => {
    $$('button', s).forEach(btn => btn.addEventListener('click', () => {
      $$('button', s).forEach(x => x.classList.remove('is-picked'));
      btn.classList.add('is-picked');
      answers[s.dataset.q] = btn.dataset.v;
      setTimeout(() => { qi = i + 1; if (qi < qSteps.length) show(qi); else finish(); }, reduce ? 0 : 220);
    }));
  });
  back.addEventListener('click', () => { if (qi > 0) { qi--; show(qi); } });
  $('#quiz-reset').addEventListener('click', () => {
    result.hidden = true; qi = 0; $$('.is-picked', quiz).forEach(x => x.classList.remove('is-picked')); show(0);
    $('button', qSteps[0]).focus();
  });

  /* ---- Formulaire de contact (ouvre la messagerie) ---- */
  const form = $('#contact-form'), note = $('#form-note');
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    $$('[required]', form).forEach(f => {
      const bad = !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
      f.setAttribute('aria-invalid', bad); if (bad) ok = false;
    });
    if (!ok) { note.textContent = 'Merci de compléter votre nom, un e-mail valide et votre message.'; note.className = 'form__note is-err'; $('[aria-invalid="true"]', form).focus(); return; }
    const d = Object.fromEntries(new FormData(form));
    const body = `Nom : ${d.nom}\nTéléphone : ${d.tel || '—'}\nE-mail : ${d.email}\nProfil : ${d.profil}\n\n${d.message}`;
    window.location.href = `mailto:fondation@fip-gabon.org?subject=${encodeURIComponent('Initiative — ' + d.nom)}&body=${encodeURIComponent(body)}`;
    note.textContent = 'Votre messagerie s\'ouvre avec votre demande. Merci, l\'équipe FIP vous répondra rapidement.';
    note.className = 'form__note is-ok';
  });
  $$('[required]', form).forEach(f => f.addEventListener('input', () => f.removeAttribute('aria-invalid')));

  /* ---- Nos actions : parallaxe du fond + frise qui se remplit ---- */
  const actions = $('#realisations'), actBg = $('#actions-bg'), tl = $('#timeline'), tlProg = $('#tl-progress');
  const tlItems = $$('.tl', tl);
  const onActionsScroll = () => {
    const vh = window.innerHeight;
    const r = actions.getBoundingClientRect();
    if (r.bottom > 0 && r.top < vh && !reduce) actBg.style.transform = `translate3d(0, ${(r.top * -0.12).toFixed(1)}px, 0)`;
    const tr = tl.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (vh * 0.6 - tr.top) / tr.height));
    tlProg.style.height = (p * 100) + '%';
    tlItems.forEach(li => { const t = $('time', li).getBoundingClientRect(); li.classList.toggle('is-lit', t.top < vh * 0.6); });
  };
  window.addEventListener('scroll', onActionsScroll, { passive: true });
  window.addEventListener('resize', onActionsScroll);
  onActionsScroll();

  // inclinaison 3D des cartes au survol (souris uniquement)
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    $$('.tl__card', tl).forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        card.classList.add('is-tilting');
        card.style.setProperty('--ry', (x * 8).toFixed(2) + 'deg');
        card.style.setProperty('--rx', (y * -8).toFixed(2) + 'deg');
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-tilting');
        card.style.setProperty('--ry', '0deg'); card.style.setProperty('--rx', '0deg');
      });
    });
  }

  /* ---- Carrousel de la galerie ---- */
  (() => {
    const car = $('#carousel'), track = $('#car-track');
    if (!car) return;
    const slides = $$('.slide', track), dotsWrap = $('#car-dots'), count = $('#car-count'), timer = $('#car-timer');
    const n = slides.length, DELAY = 5000;
    let idx = 0, paused = false, visible = false, tStart = performance.now(), holdUntil = 0;
    const pad = i => String(i + 1).padStart(2, '0');

    const dots = slides.map((s, i) => {
      s.setAttribute('aria-label', `${i + 1} sur ${n}`);
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-label', `Photo ${i + 1}`);
      b.addEventListener('click', () => { go(i); hold(); });
      dotsWrap.appendChild(b); return b;
    });

    const centerOf = i => slides[i].offsetLeft - (track.clientWidth - slides[i].offsetWidth) / 2;
    function go(i, smooth = true) {
      idx = (i + n) % n;
      track.scrollTo({ left: centerOf(idx), behavior: smooth && !reduce ? 'smooth' : 'auto' });
      setActive(idx);
    }
    function setActive(i) {
      idx = i;
      slides.forEach((s, j) => { s.classList.toggle('is-active', j === i); s.setAttribute('aria-hidden', j === i ? 'false' : 'true'); });
      dots.forEach((d, j) => d.setAttribute('aria-selected', j === i ? 'true' : 'false'));
      count.textContent = `${pad(i)} / ${pad(n - 1)}`;
      tStart = performance.now();
    }
    const hold = () => { holdUntil = performance.now() + 8000; tStart = performance.now(); };

    // diapositive active = la plus proche du centre
    let raf;
    track.addEventListener('scroll', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const c = track.scrollLeft + track.clientWidth / 2;
        let best = 0, bd = Infinity;
        slides.forEach((s, j) => { const d = Math.abs(s.offsetLeft + s.offsetWidth / 2 - c); if (d < bd) { bd = d; best = j; } });
        if (best !== idx) setActive(best);
      });
    }, { passive: true });

    $('#car-prev').addEventListener('click', () => { go(idx - 1); hold(); });
    $('#car-next').addEventListener('click', () => { go(idx + 1); hold(); });
    car.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1); hold(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1); hold(); }
    });

    // glisser à la souris (le tactile utilise le défilement natif)
    let down = false, startX = 0, startL = 0, moved = 0, startIdx = 0;
    track.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = 0; startX = e.clientX; startL = track.scrollLeft; startIdx = idx;
      track.classList.add('is-drag'); track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - startX; moved = Math.max(moved, Math.abs(dx));
      track.scrollLeft = startL - dx;
    });
    const end = e => {
      if (!down) return; down = false; track.classList.remove('is-drag');
      const dx = e.clientX - startX;
      // un geste franc passe à la photo voisine, sinon on se recentre
      go(Math.abs(dx) > 60 ? startIdx + (dx < 0 ? 1 : -1) : startIdx); hold();
    };
    track.addEventListener('pointerup', end);
    track.addEventListener('pointercancel', end);
    track.addEventListener('touchstart', hold, { passive: true });

    // lecture automatique : pause au survol, au focus et hors écran
    car.addEventListener('pointerenter', () => { paused = true; });
    car.addEventListener('pointerleave', () => { paused = false; tStart = performance.now(); });
    car.addEventListener('focusin', () => { paused = true; });
    car.addEventListener('focusout', () => { paused = false; });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; tStart = performance.now(); }, { threshold: .4 }).observe(car);

    const loop = now => {
      const active = visible && !paused && !reduce && now > holdUntil;
      if (active) {
        const p = Math.min(1, (now - tStart) / DELAY);
        timer.style.width = (p * 100) + '%';
        if (p >= 1) go(idx + 1);
      } else if (!visible || reduce) timer.style.width = '0%';
      requestAnimationFrame(loop);
    };
    setActive(0);
    window.addEventListener('load', () => go(0, false));
    window.addEventListener('resize', () => go(idx, false));
    requestAnimationFrame(loop);
  })();

  $('#year').textContent = new Date().getFullYear();
})();
