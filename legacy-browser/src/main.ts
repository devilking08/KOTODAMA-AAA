import { Game } from './engine/Game';
import { UI } from './ui/UI';
import './style.css';

const viewport = document.getElementById('viewport') as HTMLElement;
const uiRoot = document.getElementById('ui-root') as HTMLElement;

const canvas = document.createElement('canvas');
canvas.id = 'game-canvas';
viewport.appendChild(canvas);

const ui = new UI(uiRoot);
const game = new Game({ canvas, ui });

// Debug/test hook: the public API used by the test harness.
(window as unknown as { __kotodama?: { game: Game; ui: UI } }).__kotodama = { game, ui };

function hideBoot(): void {
  const boot = document.getElementById('boot-screen');
  if (boot) boot.classList.add('hidden');
}

window.addEventListener('error', (e) => {
  const overlay = document.createElement('div');
  overlay.className = 'fatal';
  overlay.innerHTML = `<div class="fatal-title">The world stuttered.</div><div class="fatal-msg">${String(e.message ?? e).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))}</div><div class="fatal-hint">If this repeats, try a lower quality setting or a newer browser with WebGL 2.</div>`;
  document.body.appendChild(overlay);
  hideBoot();
});

game.start().then(() => {
  hideBoot();
}).catch((err) => {
  console.error('failed to start', err);
  hideBoot();
});

// Keep the boot bar alive for at least a heartbeat so the transition reads as
// intentional rather than a white flash.
setTimeout(hideBoot, 600);
