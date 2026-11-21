// Midnight Gallery — keyboard and mouse input.
//
// Movement is WASD or the arrow keys. Shift held down is sneak: slower,
// harder to spot. Q drops a smoke pellet at the thief's feet. A mouse
// click tosses a coin toward that spot to pull a guard away. Enter starts
// the game, R restarts after a win or a bust, P pauses, M mutes the sound.

export function createInput(canvas) {
  const keys = new Set();
  const input = {
    keys,
    // Set by the game when a coin is tossed or smoke is dropped.
    coinTarget: null,
    smokeRequested: false,
    // True for one frame when the player presses Enter or clicks to start.
    startPressed: false,
    restartPressed: false,
    pausePressed: false,
    mutePressed: false,
  };

  const KEY_ACTIONS = {
    Enter: 'startPressed',
    KeyR: 'restartPressed',
    KeyP: 'pausePressed',
    KeyM: 'mutePressed',
  };

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    keys.add(event.code);
    const action = KEY_ACTIONS[event.code];
    if (action) input[action] = true;
    if (event.code === 'KeyQ') input.smokeRequested = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
  });
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    input.coinTarget = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return input;
}

// Read the current movement direction from the held keys: a unit vector,
// or null when no movement key is down. Diagonal movement is normalized.
export function readMoveVector(input) {
  let x = 0;
  let y = 0;
  if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) x -= 1;
  if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) x += 1;
  if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) y -= 1;
  if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) y += 1;
  if (x === 0 && y === 0) return null;
  const len = Math.hypot(x, y);
  return { x: x / len, y: y / len };
}

export function isSneaking(input) {
  return input.keys.has('ShiftLeft') || input.keys.has('ShiftRight');
}

// One-shot flags are cleared after each update so a single press fires once.
export function clearEdgeFlags(input) {
  input.startPressed = false;
  input.restartPressed = false;
  input.pausePressed = false;
  input.mutePressed = false;
  input.smokeRequested = false;
  input.coinTarget = null;
}
