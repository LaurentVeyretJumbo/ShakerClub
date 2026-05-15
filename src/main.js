import { STRINGS } from './strings.js';
import * as fx from './fx.js';

const SHAKE_THRESHOLD = 2.15;
const MAX_VERTICAL_FORCE = 11;
const PROGRESS_GAIN = 18;
const DECAY_PER_SECOND = 9;
const SENSOR_TIMEOUT_MS = 1800;
const SMOOTHING = 0.22;

const state = {
  screen: 'home',
  progress: 0,
  won: false,
  permissionState: 'idle',
  sensorSupported: 'DeviceMotionEvent' in window,
  sensorActive: false,
  status: STRINGS.initialStatus,
  smoothedVertical: 0,
  lastMotionAt: 0,
  lastFrameAt: performance.now(),
  fallbackImpulse: 0,
  fallbackPointerY: null,
  shakerOffset: 0,
  shakerTilt: 0,
  motionHandler: null,
  // lottery: null | { attempt, phase: 'rolling'|'result'|'fail', successCount }
  lottery: null,
};

const MAX_SAVES = 5;

const app = document.querySelector('#app');

// References to the elements updated every frame — populated by render(), nulled on home screen.
const dom = { meter: null, meterFill: null, percent: null, shaker: null, shakerHint: null, liquid: null, status: null };

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function isIosPermissionRequired() {
  return (
    typeof DeviceMotionEvent !== 'undefined' &&
    typeof DeviceMotionEvent.requestPermission === 'function'
  );
}

function render() {
  app.className = `app app--${state.screen}`;

  if (state.screen === 'home') {
    dom.meter = dom.meterFill = dom.percent = dom.shaker = dom.shakerHint = dom.liquid = dom.status = null;
    app.innerHTML = `
      <section class="hero" aria-labelledby="title">
        <div class="hero__glow hero__glow--cyan"></div>
        <div class="hero__glow hero__glow--pink"></div>
        <div class="club-card">
          <p class="eyebrow">${STRINGS.home.eyebrow}</p>
          <h1 id="title" class="neon-title">SHAKE<br><span>CLUB</span></h1>
          <div class="neon-shaker" aria-hidden="true">
            <span class="neon-shaker__cap"></span>
            <span class="neon-shaker__body"></span>
            <span class="neon-shaker__spark neon-shaker__spark--one"></span>
            <span class="neon-shaker__spark neon-shaker__spark--two"></span>
          </div>
          <p class="hero__copy">${STRINGS.home.heroCopy}</p>
          <button class="button button--play" type="button" data-action="play">${STRINGS.home.playButton}</button>
        </div>
      </section>
    `;
    return;
  }

  const roundedProgress = Math.round(state.progress);
  const showLotteryOverlay = ['rolling', 'result', 'fail'].includes(state.lottery?.phase);
  const permissionLabel = state.permissionState === 'requesting'
    ? STRINGS.game.permissionRequesting
    : state.sensorActive
      ? STRINGS.game.permissionActive
      : STRINGS.game.permissionIdle;

  app.innerHTML = `
    <section class="game" aria-labelledby="game-title">
      <div class="game__header">
        <p class="eyebrow">${STRINGS.game.eyebrow}</p>
        <h2 id="game-title">${STRINGS.game.title}</h2>
      </div>

      <div class="meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${roundedProgress}" aria-label="${STRINGS.game.progressAriaLabel}">
        <span class="meter__fill" style="width: ${state.progress}%"></span>
      </div>
      <strong class="percent">${roundedProgress}%</strong>

      ${renderRescueMeter()}

      <div class="stage">
        <div class="liquid" style="height: ${clamp(18 + state.progress * 0.62, 18, 82)}%"></div>
        <div class="shaker-hint" aria-hidden="true">
          <span class="shaker-hint__arrow shaker-hint__arrow--up"></span>
          <span class="shaker-hint__arrow shaker-hint__arrow--down"></span>
        </div>
        <div class="shaker" style="--shake-y: ${state.shakerOffset}px; --shake-tilt: ${state.shakerTilt}deg" aria-hidden="true">
          <span class="shaker__lid"></span>
          <span class="shaker__neck"></span>
          <span class="shaker__cup"></span>
          <span class="shaker__shine"></span>
        </div>
        <div class="victory ${showLotteryOverlay ? 'victory--visible' : ''} ${state.lottery?.phase === 'fail' ? 'victory--fail' : ''}" role="status" aria-live="polite">
          ${renderLotteryOverlay()}
        </div>
      </div>

      <p class="status">${state.status}</p>

      <div class="actions">
        <button class="button" type="button" data-action="permission" ${state.sensorActive || !state.sensorSupported ? 'disabled' : ''}>${permissionLabel}</button>
        <button class="button button--ghost" type="button" data-action="quit">${STRINGS.game.quitButton}</button>
      </div>

      <p class="hint">${STRINGS.game.hint}</p>
    </section>
  `;
  dom.meter     = app.querySelector('.meter');
  dom.meterFill = app.querySelector('.meter__fill');
  dom.percent   = app.querySelector('.percent');
  dom.shaker     = app.querySelector('.shaker');
  dom.shakerHint = app.querySelector('.shaker-hint');
  dom.liquid     = app.querySelector('.liquid');
  dom.status     = app.querySelector('.status');
}

function renderFrame() {
  if (!dom.meterFill) return;
  const rounded = Math.round(state.progress);
  dom.meter.setAttribute('aria-valuenow', rounded);
  dom.meterFill.style.width = `${state.progress}%`;
  dom.percent.textContent = `${rounded}%`;
  dom.shaker.style.setProperty('--shake-y', `${state.shakerOffset}px`);
  dom.shaker.style.setProperty('--shake-tilt', `${state.shakerTilt}deg`);
  dom.liquid.style.height = `${clamp(18 + state.progress * 0.62, 18, 82)}%`;
  dom.shakerHint.style.opacity = Math.max(0, 1 - state.progress / 40);
  dom.status.textContent = state.status;
}

function renderLotteryOverlay() {
  if (!state.lottery) return '';
  const { attempt, phase } = state.lottery;
  if (phase === 'rolling') {
    return `
      <span class="dice-spin">${STRINGS.lottery.rollingIcon}</span>
      <span>${STRINGS.lottery.rollingTitle(attempt)}</span>
      <div class="lottery-countdown" aria-hidden="true">
        <span>3</span><span>2</span><span>1</span>
      </div>
      <div class="lottery-timer-bar"><div class="lottery-timer-bar__fill"></div></div>
    `;
  }
  if (phase === 'result') {
    return `
      <span>${STRINGS.lottery.resultIcon}</span>
      <span>${STRINGS.lottery.resultTitle}</span>
    `;
  }
  if (phase === 'fail') {
    return `
      <span>${STRINGS.lottery.failIcon}</span>
      <span>${STRINGS.lottery.failTitle}</span>
    `;
  }
  return '';
}

function renderRescueMeter() {
  const currentAttempt = state.lottery?.attempt ?? 1;
  const phase = state.lottery?.phase ?? 'idle';
  const successCount = state.lottery?.successCount ?? 0;

  const items = Array.from({ length: MAX_SAVES }, (_, index) => {
    const attempt = index + 1;
    let modifier = 'pending';

    if (attempt <= successCount) {
      modifier = 'saved';
    } else if (phase === 'fail' && attempt === currentAttempt) {
      modifier = 'lost';
    } else if (attempt === currentAttempt && state.lottery) {
      modifier = (phase === 'rolling' || phase === 'shake') ? 'active' : 'current';
    } else if (phase === 'fail' && attempt > currentAttempt) {
      modifier = 'locked';
    }

    return `<div class="rescue-step rescue-step--${modifier}"><span class="rescue-step__index">${attempt}</span></div>`;
  }).join('');

  return `<div class="rescue-meter" aria-label="${STRINGS.game.rescueAriaLabel}"><div class="rescue-meter__grid">${items}</div></div>`;
}

function goHome() {
  if (state.motionHandler) {
    window.removeEventListener('devicemotion', state.motionHandler);
    state.motionHandler = null;
    state.sensorActive = false;
    state.permissionState = 'idle';
  }
  state.screen = 'home';
  state.lottery = null;
  render();
}

function triggerLottery() {
  state.won = true;
  state.lottery = { attempt: 1, phase: 'rolling', successCount: 0 };
  state.status = STRINGS.status.lotteryRolling;
  render();
  fx.playBuildUp();
  [0, 1000, 2000].forEach((delay, step) => setTimeout(() => fx.playTick(step), delay));
  setTimeout(doLotteryRoll, 3300);
}

function doLotteryRoll() {
  if (state.screen !== 'game' || !state.lottery) return;
  const { attempt, successCount } = state.lottery;
  // attempt 1→1/5, 2→1/4, 3→1/3, 4→1/2, 5→1/1 (mort certaine)
  const lost = attempt >= MAX_SAVES || Math.floor(Math.random() * (6 - attempt)) === 0;

  if (!lost) {
    const newCount = successCount + 1;
    state.lottery = { attempt, phase: 'result', successCount: newCount };
    state.status = '';
    fx.playSuccess();
    render();
    setTimeout(() => {
      if (state.screen !== 'game' || !state.lottery) return;
      state.lottery = { attempt: attempt + 1, phase: 'shake', successCount: newCount };
      state.won = false;
      state.progress = 0;
      state.status = STRINGS.status.lotteryShake;
      render();
    }, 1500);
  } else {
    state.lottery = { attempt, phase: 'fail', successCount };
    state.status = '';
    fx.playFail();
    render();
  }
}


function goToGame() {
  state.screen = 'game';
  fx.resume();
  resetGame();
  render();
  ensureMotionAccess();
}

function resetGame() {
  state.progress = 0;
  state.won = false;
  state.lottery = null;
  state.smoothedVertical = 0;
  state.lastMotionAt = 0;
  state.fallbackImpulse = 0;
  state.status = state.sensorSupported
    ? STRINGS.status.sensorReady
    : STRINGS.status.sensorUnavailable;
}

async function ensureMotionAccess() {
  if (!state.sensorSupported) {
    state.status = STRINGS.status.sensorNotSupported;
    render();
    return;
  }

  if (state.sensorActive || state.permissionState === 'requesting') {
    return;
  }

  if (isIosPermissionRequired()) {
    state.permissionState = 'requesting';
    state.status = STRINGS.status.iosPermissionPending;
    render();

    try {
      const answer = await DeviceMotionEvent.requestPermission();
      if (answer !== 'granted') {
        state.permissionState = 'denied';
        state.status = STRINGS.status.iosPermissionDenied;
        render();
        return;
      }
    } catch (error) {
      state.permissionState = 'denied';
      state.status = STRINGS.status.iosPermissionError;
      render();
      return;
    }
  }

  startMotionListener();
}

function startMotionListener() {
  if (state.sensorActive) return;

  state.motionHandler = (event) => {
    const vertical = event.acceleration?.y ?? event.accelerationIncludingGravity?.y ?? 0;
    const horizontalX = Math.abs(event.acceleration?.x ?? event.accelerationIncludingGravity?.x ?? 0);
    const horizontalZ = Math.abs(event.acceleration?.z ?? event.accelerationIncludingGravity?.z ?? 0);
    const verticalMagnitude = Math.abs(vertical);

    // Favorise les mouvements haut-bas : les axes horizontaux atténuent le score.
    const horizontalPenalty = Math.min((horizontalX + horizontalZ) * 0.09, 0.65);
    const verticalOnlyForce = Math.max(0, verticalMagnitude - horizontalPenalty);

    state.smoothedVertical = state.smoothedVertical * (1 - SMOOTHING) + verticalOnlyForce * SMOOTHING;
    state.lastMotionAt = performance.now();

    if (state.smoothedVertical > SHAKE_THRESHOLD) {
      state.status = STRINGS.status.sensorDetected;
      fx.playShakeTick(state.smoothedVertical);
    }
  };

  window.addEventListener('devicemotion', state.motionHandler, { passive: true });
  state.sensorActive = true;
  state.permissionState = 'granted';
  state.status = STRINGS.status.sensorActive;
  render();
}

function addFallbackShake(amount = 7) {
  if (state.screen !== 'game' || state.won) return;
  state.fallbackImpulse = Math.min(MAX_VERTICAL_FORCE, state.fallbackImpulse + amount);
  state.status = STRINGS.status.fallbackDesktop;
}

function update(timestamp) {
  const dt = Math.min((timestamp - state.lastFrameAt) / 1000, 0.05);
  state.lastFrameAt = timestamp;

  if (state.screen === 'game' && !state.won) {
    const sensorIsFresh = timestamp - state.lastMotionAt < SENSOR_TIMEOUT_MS;
    const sensorForce = sensorIsFresh ? state.smoothedVertical : 0;
    const force = clamp(Math.max(sensorForce, state.fallbackImpulse), 0, MAX_VERTICAL_FORCE);

    if (force > SHAKE_THRESHOLD) {
      const normalized = (force - SHAKE_THRESHOLD) / (MAX_VERTICAL_FORCE - SHAKE_THRESHOLD);
      state.progress = clamp(state.progress + normalized * PROGRESS_GAIN * dt, 0, 100);
    } else {
      state.progress = clamp(state.progress - DECAY_PER_SECOND * dt, 0, 100);
    }

    state.fallbackImpulse = Math.max(0, state.fallbackImpulse - 18 * dt);
    state.shakerOffset = Math.sin(timestamp / 55) * clamp(force * 2.8, 0, 28);
    state.shakerTilt = Math.sin(timestamp / 95) * clamp(force * 0.9, 0, 10);

    if (state.progress >= 100) {
      state.progress = 100;
      if (state.lottery?.phase === 'shake') {
        const { attempt, successCount } = state.lottery;
        state.won = true;
        state.lottery = { attempt, phase: 'rolling', successCount };
        state.status = STRINGS.status.lotteryRolling;
        render();
        fx.playBuildUp();
        [0, 1000, 2000].forEach((delay, step) => setTimeout(() => fx.playTick(step), delay));
        setTimeout(doLotteryRoll, 3300);
      } else {
        triggerLottery();
      }
    }

    renderFrame();
  }

  requestAnimationFrame(update);
}

app.addEventListener('click', (event) => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (!action) return;

  if (action === 'play') goToGame();
  if (action === 'permission') ensureMotionAccess();
  if (action === 'quit') goHome();
});

window.addEventListener('keydown', (event) => {
  if (['Space', 'ArrowUp', 'KeyW'].includes(event.code)) {
    event.preventDefault();
    addFallbackShake(8);
  }
});

window.addEventListener('pointerdown', (event) => {
  state.fallbackPointerY = event.clientY;
  addFallbackShake(3);
});

window.addEventListener('pointermove', (event) => {
  if (state.fallbackPointerY === null) return;
  const deltaY = Math.abs(event.clientY - state.fallbackPointerY);
  if (deltaY > 18) {
    addFallbackShake(clamp(deltaY / 8, 2, 9));
    state.fallbackPointerY = event.clientY;
  }
});

window.addEventListener('pointerup', () => {
  state.fallbackPointerY = null;
});

render();
requestAnimationFrame(update);
