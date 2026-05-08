/* =========================================================================
 * Tempo — Cronómetro & Cuenta Atrás
 * Vanilla JS. Sin dependencias.
 *
 * Estrategia de tiempo:
 *  - performance.now() → reloj monotónico (no afectado por cambios de hora).
 *  - requestAnimationFrame → repintado eficiente, pausado en background.
 *  - El tiempo se RECALCULA en cada frame a partir de timestamps absolutos,
 *    nunca se incrementa. Esto elimina cualquier drift acumulado.
 * ========================================================================= */

(() => {
  'use strict';

  /* ---------- Utilidades de formato ---------- */

  /** Formatea milisegundos a HH:MM:SS y SSS por separado. */
  function formatTime(ms) {
    if (ms < 0) ms = 0;
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const millis = Math.floor(ms % 1000);
    const pad = (n, l = 2) => String(n).padStart(l, '0');
    return {
      hms: `${pad(h)}:${pad(m)}:${pad(s)}`,
      ms: pad(millis, 3),
    };
  }

  /** Formato compacto sin milisegundos para vueltas y countdown. */
  function formatHMS(ms) {
    const { hms } = formatTime(ms);
    return hms;
  }

  /* ===========================================================
   *  CRONÓMETRO
   * =========================================================== */

  const stopwatch = (() => {
    // Estado
    let startTime = 0;       // timestamp performance.now() cuando arrancó el ciclo actual
    let accumulated = 0;     // ms acumulados en pausas anteriores
    let running = false;
    let rafId = null;
    const laps = [];         // array de { total, split }

    // DOM
    const display = document.getElementById('sw-display');
    const startBtn = document.getElementById('sw-start');
    const lapBtn = document.getElementById('sw-lap');
    const resetBtn = document.getElementById('sw-reset');
    const lapsList = document.getElementById('sw-laps');
    const status = document.getElementById('sw-status');

    /** Devuelve los ms transcurridos totales en este momento. */
    function getElapsed() {
      if (!running) return accumulated;
      return accumulated + (performance.now() - startTime);
    }

    function render() {
      const { hms, ms } = formatTime(getElapsed());
      display.innerHTML = `${hms}<span class="ms">.${ms}</span>`;
      if (running) rafId = requestAnimationFrame(render);
    }

    function setStatus(state) {
      status.classList.remove('is-running', 'is-paused');
      const label = status.querySelector('.label');
      if (state === 'running') {
        status.classList.add('is-running');
        label.textContent = 'En marcha';
      } else if (state === 'paused') {
        status.classList.add('is-paused');
        label.textContent = 'Pausado';
      } else {
        label.textContent = 'Listo';
      }
    }

    function updateButtons() {
      const hasTime = accumulated > 0 || running;
      if (running) {
        startBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
          <span>Pausar</span>`;
      } else if (accumulated > 0) {
        startBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
          <span>Reanudar</span>`;
      } else {
        startBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
          <span>Iniciar</span>`;
      }
      lapBtn.disabled = !running;
      resetBtn.disabled = !hasTime;
    }

    function start() {
      if (running) {
        // pausar
        accumulated += performance.now() - startTime;
        running = false;
        cancelAnimationFrame(rafId);
        setStatus('paused');
      } else {
        startTime = performance.now();
        running = true;
        setStatus('running');
        rafId = requestAnimationFrame(render);
      }
      updateButtons();
    }

    function reset() {
      running = false;
      cancelAnimationFrame(rafId);
      accumulated = 0;
      laps.length = 0;
      lapsList.innerHTML = '';
      render();
      setStatus('idle');
      updateButtons();
    }

    function lap() {
      if (!running) return;
      const total = getElapsed();
      const lastTotal = laps.length ? laps[laps.length - 1].total : 0;
      const split = total - lastTotal;
      laps.push({ total, split });
      renderLaps();
    }

    function renderLaps() {
      if (laps.length === 0) {
        lapsList.innerHTML = '';
        return;
      }
      // Identifica mejor y peor vuelta (sólo si hay 2+)
      let best = -1, worst = -1;
      if (laps.length >= 2) {
        let min = Infinity, max = -Infinity;
        laps.forEach((l, i) => {
          if (l.split < min) { min = l.split; best = i; }
          if (l.split > max) { max = l.split; worst = i; }
        });
      }
      lapsList.innerHTML = laps
        .map((l, i) => {
          const cls = i === best ? 'is-best' : i === worst ? 'is-worst' : '';
          const num = String(laps.length - i).padStart(2, '0'); // visualmente invertimos: la última arriba
          return `
            <li class="lap-item ${cls}">
              <span class="lap-num">#${num}</span>
              <span class="lap-split">+${formatHMS(l.split)}.${formatTime(l.split).ms}</span>
              <span class="lap-total">${formatHMS(l.total)}.${formatTime(l.total).ms}</span>
            </li>`;
        })
        .reverse()
        .join('');
    }

    function pauseExternally() {
      // Llamado al salir de la vista: no perdemos el tiempo, sólo paramos el rAF.
      if (running) {
        accumulated += performance.now() - startTime;
        running = false;
        cancelAnimationFrame(rafId);
        setStatus('paused');
        updateButtons();
      }
    }

    // Eventos
    startBtn.addEventListener('click', start);
    lapBtn.addEventListener('click', lap);
    resetBtn.addEventListener('click', reset);

    // Render inicial
    render();
    updateButtons();

    return {
      toggle: start,
      reset,
      pauseExternally,
      isRunning: () => running,
    };
  })();

  /* ===========================================================
   *  CUENTA ATRÁS
   * =========================================================== */

  const timer = (() => {
    let totalDuration = 0;   // ms configurados
    let startTime = 0;       // performance.now() del ciclo actual
    let remainingAtPause = 0;
    let running = false;
    let finished = false;
    let rafId = null;

    // DOM
    const display = document.getElementById('tm-display');
    const inputs = document.getElementById('tm-inputs');
    const inputH = document.getElementById('tm-h');
    const inputM = document.getElementById('tm-m');
    const inputS = document.getElementById('tm-s');
    const startBtn = document.getElementById('tm-start');
    const resetBtn = document.getElementById('tm-reset');
    const status = document.getElementById('tm-status');
    const presets = document.getElementById('tm-presets');

    function readInputs() {
      const h = clamp(parseInt(inputH.value, 10) || 0, 0, 99);
      const m = clamp(parseInt(inputM.value, 10) || 0, 0, 59);
      const s = clamp(parseInt(inputS.value, 10) || 0, 0, 59);
      return ((h * 3600) + (m * 60) + s) * 1000;
    }

    function clamp(n, min, max) {
      return Math.max(min, Math.min(max, n));
    }

    function getRemaining() {
      if (!running) return remainingAtPause;
      return Math.max(0, remainingAtPause - (performance.now() - startTime));
    }

    function render() {
      const remaining = getRemaining();
      // Redondeo hacia arriba para que "1s" se muestre 00:00:01 hasta llegar a cero
      const displayMs = Math.ceil(remaining / 1000) * 1000;
      display.textContent = formatHMS(displayMs);

      if (running && remaining <= 0) {
        finish();
        return;
      }
      if (running) rafId = requestAnimationFrame(render);
    }

    function setStatus(state, msg) {
      status.classList.remove('is-running', 'is-paused', 'is-finished');
      const label = status.querySelector('.label');
      if (state === 'running') { status.classList.add('is-running'); label.textContent = msg || 'En marcha'; }
      else if (state === 'paused') { status.classList.add('is-paused'); label.textContent = msg || 'Pausado'; }
      else if (state === 'finished') { status.classList.add('is-finished'); label.textContent = msg || '¡Tiempo!'; }
      else { label.textContent = msg || 'Configura el tiempo'; }
    }

    function showDisplay(show) {
      display.hidden = !show;
      inputs.style.display = show ? 'none' : '';
      presets.style.display = show ? 'none' : '';
    }

    function updateButtons() {
      if (running) {
        startBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
          <span>Pausar</span>`;
        startBtn.disabled = false;
      } else if (finished) {
        startBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
          <span>Iniciar</span>`;
        startBtn.disabled = true;
      } else if (remainingAtPause > 0 && remainingAtPause < totalDuration) {
        startBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
          <span>Reanudar</span>`;
        startBtn.disabled = false;
      } else {
        startBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
          <span>Iniciar</span>`;
        startBtn.disabled = false;
      }
      const hasState = totalDuration > 0 || remainingAtPause > 0 || finished;
      resetBtn.disabled = !hasState;
    }

    function start() {
      if (running) {
        // pausar
        remainingAtPause = getRemaining();
        running = false;
        cancelAnimationFrame(rafId);
        setStatus('paused');
        updateButtons();
        return;
      }

      if (finished) return;

      // Si venimos de inputs sin haber arrancado, leer
      if (remainingAtPause === 0 && totalDuration === 0) {
        const dur = readInputs();
        if (dur === 0) {
          // Pequeño feedback visual al input
          [inputH, inputM, inputS].forEach(i => {
            i.style.borderColor = 'var(--danger)';
            setTimeout(() => { i.style.borderColor = ''; }, 600);
          });
          return;
        }
        totalDuration = dur;
        remainingAtPause = dur;
      }

      display.classList.remove('is-finished');
      showDisplay(true);
      startTime = performance.now();
      running = true;
      setStatus('running');
      updateButtons();
      rafId = requestAnimationFrame(render);
    }

    function reset() {
      running = false;
      finished = false;
      cancelAnimationFrame(rafId);
      totalDuration = 0;
      remainingAtPause = 0;
      display.classList.remove('is-finished');
      showDisplay(false);
      setStatus('idle');
      updateButtons();
    }

    function finish() {
      running = false;
      finished = true;
      remainingAtPause = 0;
      cancelAnimationFrame(rafId);
      display.textContent = '00:00:00';
      display.classList.add('is-finished');
      setStatus('finished', '¡Tiempo!');
      updateButtons();
      // Beep suave (sin assets externos): Web Audio API
      try { beep(); } catch (_) { /* ignore */ }
      // Vibración en móvil si está soportado
      if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
    }

    function beep() {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      // Tres pitidos cortos
      [0, 0.25, 0.5].forEach(t => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, now + t);
        gain.gain.linearRampToValueAtTime(0.15, now + t + 0.02);
        gain.gain.linearRampToValueAtTime(0, now + t + 0.18);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + 0.2);
      });
      // Cerrar el contexto cuando termine
      setTimeout(() => ctx.close().catch(() => {}), 1500);
    }

    function pauseExternally() {
      if (running) {
        remainingAtPause = getRemaining();
        running = false;
        cancelAnimationFrame(rafId);
        setStatus('paused');
        updateButtons();
      }
    }

    // Eventos
    startBtn.addEventListener('click', start);
    resetBtn.addEventListener('click', reset);

    // Sanitizado de inputs
    [inputH, inputM, inputS].forEach((input, i) => {
      const max = i === 0 ? 99 : 59;
      input.addEventListener('input', () => {
        let v = input.value.replace(/[^\d]/g, '');
        if (v.length > 2 && i !== 0) v = v.slice(0, 2);
        input.value = v;
      });
      input.addEventListener('blur', () => {
        let n = parseInt(input.value, 10);
        if (isNaN(n) || n < 0) n = 0;
        if (n > max) n = max;
        input.value = n;
      });
      input.addEventListener('focus', () => input.select());
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); start(); }
      });
    });

    // Presets
    presets.addEventListener('click', e => {
      const btn = e.target.closest('.preset');
      if (!btn) return;
      const sec = parseInt(btn.dataset.seconds, 10);
      inputH.value = Math.floor(sec / 3600);
      inputM.value = Math.floor((sec % 3600) / 60);
      inputS.value = sec % 60;
    });

    // Estado inicial
    showDisplay(false);
    setStatus('idle');
    updateButtons();

    return {
      toggle: start,
      reset,
      pauseExternally,
      isRunning: () => running,
    };
  })();

  /* ===========================================================
   *  ROUTING (hash-based)
   * =========================================================== */

  const router = (() => {
    const views = {
      home: document.getElementById('view-home'),
      stopwatch: document.getElementById('view-stopwatch'),
      timer: document.getElementById('view-timer'),
    };
    const backBtn = document.getElementById('backBtn');
    const validRoutes = ['home', 'stopwatch', 'timer'];

    function getRoute() {
      const hash = window.location.hash.replace('#', '');
      return validRoutes.includes(hash) ? hash : 'home';
    }

    function navigate(route) {
      if (!validRoutes.includes(route)) route = 'home';
      window.location.hash = route === 'home' ? '' : route;
    }

    function render() {
      const route = getRoute();
      Object.entries(views).forEach(([name, el]) => {
        el.classList.toggle('active', name === route);
      });
      backBtn.hidden = route === 'home';
      // Foco accesible al cambiar de vista
      const activeView = views[route];
      if (activeView) {
        const heading = activeView.querySelector('h1, h2');
        if (heading) heading.focus?.();
      }
      // Pausa automática al salir
      if (route !== 'stopwatch') stopwatch.pauseExternally();
      if (route !== 'timer') timer.pauseExternally();
    }

    // Tarjetas de la home
    document.querySelectorAll('.card[data-route]').forEach(card => {
      card.addEventListener('click', () => navigate(card.dataset.route));
    });

    backBtn.addEventListener('click', () => navigate('home'));
    window.addEventListener('hashchange', render);

    return { render, getRoute, navigate };
  })();

  /* ===========================================================
   *  ATAJOS DE TECLADO
   * =========================================================== */

  document.addEventListener('keydown', e => {
    // No interferir si el usuario está escribiendo en un input
    const inField = e.target.matches('input, textarea, select');
    const route = router.getRoute();

    if (e.key === 'Escape' && route !== 'home') {
      e.preventDefault();
      router.navigate('home');
      return;
    }

    if (inField) return;

    if (e.code === 'Space') {
      if (route === 'stopwatch') { e.preventDefault(); stopwatch.toggle(); }
      else if (route === 'timer') { e.preventDefault(); timer.toggle(); }
    } else if (e.key === 'r' || e.key === 'R') {
      if (route === 'stopwatch') stopwatch.reset();
      else if (route === 'timer') timer.reset();
    }
  });

  /* ===========================================================
   *  INICIALIZACIÓN
   * =========================================================== */
  router.render();
})();
