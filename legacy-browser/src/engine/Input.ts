import type { InputAction } from '../types';

/**
 * Keyboard / mouse / touch input.
 *
 * Actions are edge-triggered (`wasPressed`) *and* stateful (`isDown`), which
 * keeps combat readable: a parry consumes a press, while guard / sprint read
 * the held state. Mouse capture is best-effort; the game remains playable with
 * the drag-to-look fallback and the on-screen touch pad.
 */
export class Input {
  private held = new Set<InputAction>();
  private pressed = new Set<InputAction>();
  private released = new Set<InputAction>();
  private keys = new Set<string>();
  private lookX = 0;
  private lookY = 0;
  private touchMove = { x: 0, y: 0 };
  private touchId: number | null = null;
  private touchStart = { x: 0, y: 0 };
  private stickRadius = 54;
  private touchLookId: number | null = null;
  private touchLookLast = { x: 0, y: 0 };
  private disposed = false;
  private hadPointerLock = false;
  public usingTouch = false;
  public sensitivity = 1;
  public invertY = false;
  public enabled = true;

  private readonly onKeyDown = (e: KeyboardEvent) => {
    if (!this.enabled) return;
    const target = e.target as HTMLElement | null;
    if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    this.keys.add(e.code);
    for (const action of this.mapKey(e.code)) this.press(action);
  };

  private readonly onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
    for (const action of this.mapKey(e.code)) this.release(action);
  };

  private readonly onPointerDown = (e: PointerEvent) => {
    if (!this.enabled) return;
    if (e.pointerType === 'touch') {
      this.usingTouch = true;
      return;
    }
    if (e.button === 0) {
      if (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) this.press('heavy');
      else this.press('light');
    } else if (e.button === 2) {
      this.press('guard');
    } else if (e.button === 1) {
      this.press('lockOn');
    }
    this.requestPointerLock();
  };

  private readonly onPointerUp = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (e.button === 0) {
      this.release('light');
      this.release('heavy');
    } else if (e.button === 2) {
      this.release('guard');
    }
  };

  private readonly onMouseMove = (e: MouseEvent) => {
    if (document.pointerLockElement) {
      this.lookX += e.movementX;
      this.lookY += e.movementY;
    }
  };

  private readonly onContextMenu = (e: Event) => e.preventDefault();

  private readonly onPointerLockChange = () => {
    this.hadPointerLock = !!document.pointerLockElement;
  };

  constructor(private readonly canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp);
    canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('contextmenu', this.onContextMenu);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    window.addEventListener('blur', this.clear);
  }

  private mapKey(code: string): InputAction[] {
    switch (code) {
      case 'KeyJ':
        return ['light'];
      case 'KeyH':
        return ['heavy'];
      case 'KeyQ':
        return ['guard'];
      case 'Space':
        return ['dodge', 'confirm'];
      case 'ShiftLeft':
      case 'ShiftRight':
        return ['sprint'];
      case 'KeyE':
        return ['interact', 'confirm'];
      case 'Tab':
        return ['lockOn'];
      case 'KeyR':
        return ['heal'];
      case 'KeyF':
        return ['special'];
      case 'KeyG':
        return ['grapple'];
      case 'KeyC':
        return ['crouch'];
      case 'KeyX':
        return ['item'];
      case 'KeyT':
        return ['weaponNext'];
      case 'KeyY':
        return ['weaponPrev'];
      case 'Escape':
        return ['pause', 'cancel'];
      case 'KeyJ2':
        return ['journal'];
      case 'KeyM':
        return ['map'];
      case 'KeyK':
        return ['skills'];
      case 'KeyB':
        return ['codex'];
      case 'KeyP':
        return ['photo'];
      case 'ArrowUp':
        return ['menuUp'];
      case 'ArrowDown':
        return ['menuDown'];
      case 'ArrowLeft':
        return ['menuLeft'];
      case 'ArrowRight':
        return ['menuRight'];
      case 'Enter':
        return ['confirm'];
      default:
        return [];
    }
  }

  /** Journal gets its own key because J is the light-attack alternate. */
  get journalPressed(): boolean {
    return this.keys.has('KeyN') ? this.consumeKey('KeyN') : false;
  }

  private consumeKey(code: string): boolean {
    if (this.keys.has(code)) {
      this.keys.delete(code);
      return true;
    }
    return false;
  }

  press(action: InputAction): void {
    if (this.held.has(action)) return;
    this.held.add(action);
    this.pressed.add(action);
  }

  release(action: InputAction): void {
    if (this.held.delete(action)) this.released.add(action);
  }

  isDown(action: InputAction): boolean {
    return this.held.has(action);
  }

  wasPressed(action: InputAction): boolean {
    return this.pressed.has(action);
  }

  wasReleased(action: InputAction): boolean {
    return this.released.has(action);
  }

  /** Call once per frame after all systems have read input. */
  endFrame(): void {
    this.pressed.clear();
    this.released.clear();
  }

  clear = (): void => {
    this.held.clear();
    this.pressed.clear();
    this.released.clear();
    this.keys.clear();
    this.touchMove.x = 0;
    this.touchMove.y = 0;
  };

  get moveAxis(): { x: number; y: number } {
    if (this.touchMove.x !== 0 || this.touchMove.y !== 0) return this.touchMove;
    let x = 0;
    let y = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    const len = Math.hypot(x, y);
    return len > 1 ? { x: x / len, y: y / len } : { x, y };
  }

  consumeLook(): { x: number; y: number } {
    const out = { x: this.lookX, y: this.lookY };
    this.lookX = 0;
    this.lookY = 0;
    if (this.invertY) out.y *= -1;
    return out;
  }

  get pointerLocked(): boolean {
    return !!document.pointerLockElement;
  }

  get pointerAvailable(): boolean {
    return typeof this.canvas.requestPointerLock === 'function';
  }

  get everLocked(): boolean {
    return this.hadPointerLock;
  }

  requestPointerLock(): void {
    if (this.usingTouch || document.pointerLockElement) return;
    if (!this.canvas.requestPointerLock) return;
    try {
      const promise = this.canvas.requestPointerLock() as unknown;
      if (promise && typeof (promise as Promise<void>).catch === 'function') {
        (promise as Promise<void>).catch(() => undefined);
      }
    } catch {
      /* drag fallback */
    }
  }

  releasePointerLock(): void {
    if (document.pointerLockElement) document.exitPointerLock?.();
  }

  /**
   * Wires the touch overlay. Markup contract:
   *   [data-touch="light"] ... action buttons
   *   #touch-stick / #touch-knob ... movement pad
   *   #touch-look ... camera swipe area
   */
  bindTouchControls(root: HTMLElement): void {
    root.querySelectorAll<HTMLElement>('[data-touch]').forEach((el) => {
      const action = el.dataset.touch as InputAction;
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.usingTouch = true;
        this.press(action);
        el.classList.add('active');
      });
      const up = (e: Event) => {
        e.preventDefault();
        this.release(action);
        el.classList.remove('active');
      };
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('pointerleave', up);
    });

    const stick = root.querySelector<HTMLElement>('#touch-stick');
    const knob = root.querySelector<HTMLElement>('#touch-knob');
    if (stick && knob) {
      const update = (e: PointerEvent) => {
        const rect = stick.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let dx = e.clientX - cx;
        let dy = e.clientY - cy;
        const len = Math.hypot(dx, dy);
        if (len > this.stickRadius) {
          dx = (dx / len) * this.stickRadius;
          dy = (dy / len) * this.stickRadius;
        }
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
        this.touchMove.x = dx / this.stickRadius;
        this.touchMove.y = dy / this.stickRadius;
        this.usingTouch = true;
      };
      stick.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.touchId = e.pointerId;
        stick.setPointerCapture(e.pointerId);
        update(e);
      });
      stick.addEventListener('pointermove', (e) => {
        if (this.touchId === e.pointerId) update(e);
      });
      const reset = (e: PointerEvent) => {
        if (this.touchId !== e.pointerId) return;
        this.touchId = null;
        this.touchMove.x = 0;
        this.touchMove.y = 0;
        knob.style.transform = 'translate(0,0)';
      };
      stick.addEventListener('pointerup', reset);
      stick.addEventListener('pointercancel', reset);
    }

    const look = root.querySelector<HTMLElement>('#touch-look');
    if (look) {
      look.addEventListener('pointerdown', (e) => {
        this.touchLookId = e.pointerId;
        this.touchLookLast.x = e.clientX;
        this.touchLookLast.y = e.clientY;
      });
      look.addEventListener('pointermove', (e) => {
        if (this.touchLookId !== e.pointerId) return;
        this.lookX += (e.clientX - this.touchLookLast.x) * 1.35;
        this.lookY += (e.clientY - this.touchLookLast.y) * 1.35;
        this.touchLookLast.x = e.clientX;
        this.touchLookLast.y = e.clientY;
        this.usingTouch = true;
      });
      const end = () => { this.touchLookId = null; };
      look.addEventListener('pointerup', end);
      look.addEventListener('pointercancel', end);
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('contextmenu', this.onContextMenu);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    window.removeEventListener('blur', this.clear);
  }
}
