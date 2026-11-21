// Midnight Gallery — bootstrap and the animation loop.
//
// Wires the canvas, input, sound and game together, runs the frame loop,
// and exposes the live game on window.__game so a play-test can drive it
// and read its state. With ?shot=start|play|end in the URL the game poses
// one staged frame for screenshots instead of starting the title screen.

import { createSound } from './audio.js';
import { createGame, update } from './game.js';
import { createInput } from './input.js';
import { render } from './render.js';
import { applyShot } from './shots.js';
import { VIEW_HEIGHT, VIEW_WIDTH } from './config.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_WIDTH;
canvas.height = VIEW_HEIGHT;

const sound = createSound();
const game = createGame(sound);
const input = createInput(canvas);

// Play-tests and screenshot tools reach the live state through here.
window.__game = game;
window.__input = input;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot === 'start' || shot === 'play' || shot === 'end') {
  applyShot(game, shot);
  render(ctx, game);
  window.__shotReady = true;
} else {
  let last = performance.now();
  function frame(now) {
    const dt = (now - last) / 1000;
    last = now;
    update(game, input, dt);
    render(ctx, game);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Clicking anywhere on the title or end screen counts as starting, so the
// game is playable with the mouse alone for its first and last steps.
canvas.addEventListener('mousedown', () => {
  if (game.screen === 'title') input.startPressed = true;
  if (game.screen === 'over') input.restartPressed = true;
});
