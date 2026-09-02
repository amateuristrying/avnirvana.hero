/**
 * One shared pointer tracker for the whole hero.
 *
 * Both the background and the particle field need cursor state every frame.
 * Rather than each mounting its own listeners (and each triggering React
 * renders), they subscribe to this ref-counted singleton and read it
 * imperatively inside their animation loops.
 */

export interface PointerState {
  /** Viewport position in CSS pixels. */
  x: number;
  y: number;
  /** Position relative to the viewport centre, normalised to roughly -1..1. */
  nx: number;
  ny: number;
  /** True while a mouse is over the document, or a touch is in progress. */
  active: boolean;
  /** Smoothed distance travelled per event, in CSS pixels. */
  speed: number;
  /** True on touch-first devices. */
  coarse: boolean;
}

const state: PointerState = {
  x: -9999,
  y: -9999,
  nx: 0,
  ny: 0,
  active: false,
  speed: 0,
  coarse: false,
};

let refCount = 0;
let detach: (() => void) | null = null;
let lastX = 0;
let lastY = 0;
let seenMove = false;
let touchTimer: ReturnType<typeof setTimeout> | null = null;

export function getPointer(): PointerState {
  return state;
}

function deactivate() {
  state.active = false;
  state.speed = 0;
  seenMove = false;
}

function record(clientX: number, clientY: number) {
  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;

  if (seenMove) {
    const d = Math.hypot(clientX - lastX, clientY - lastY);
    state.speed += (d - state.speed) * 0.25;
  }
  lastX = clientX;
  lastY = clientY;
  seenMove = true;

  state.x = clientX;
  state.y = clientY;
  state.nx = (clientX / w) * 2 - 1;
  state.ny = (clientY / h) * 2 - 1;
  state.active = true;
}

function armTouchRelease() {
  if (touchTimer) clearTimeout(touchTimer);
  touchTimer = setTimeout(deactivate, 900);
}

function attach() {
  state.coarse =
    typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;

  const onMove = (event: PointerEvent) => {
    record(event.clientX, event.clientY);
    if (event.pointerType === "touch") armTouchRelease();
    else if (touchTimer) {
      clearTimeout(touchTimer);
      touchTimer = null;
    }
  };

  const onDown = (event: PointerEvent) => {
    record(event.clientX, event.clientY);
    if (event.pointerType === "touch") armTouchRelease();
  };

  const onUp = (event: PointerEvent) => {
    if (event.pointerType === "touch") armTouchRelease();
  };

  // `relatedTarget === null` means the pointer genuinely left the window
  // rather than moving between elements.
  const onOut = (event: PointerEvent) => {
    if (!event.relatedTarget) deactivate();
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerdown", onDown, { passive: true });
  window.addEventListener("pointerup", onUp, { passive: true });
  window.addEventListener("pointercancel", deactivate, { passive: true });
  document.addEventListener("pointerout", onOut, { passive: true });
  window.addEventListener("blur", deactivate);

  return () => {
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", deactivate);
    document.removeEventListener("pointerout", onOut);
    window.removeEventListener("blur", deactivate);
    if (touchTimer) {
      clearTimeout(touchTimer);
      touchTimer = null;
    }
    deactivate();
  };
}

/** Subscribe to pointer tracking. Returns an unsubscribe function. */
export function subscribePointer(): () => void {
  if (typeof window === "undefined") return () => {};

  refCount++;
  if (refCount === 1) detach = attach();

  let released = false;
  return () => {
    if (released) return;
    released = true;
    refCount--;
    if (refCount === 0 && detach) {
      detach();
      detach = null;
    }
  };
}
