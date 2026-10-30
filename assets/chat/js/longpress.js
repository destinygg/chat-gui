// About as long as the platforms' own long-press, so the gesture feels native.
const HOLD_MS = 500;
// A finger never holds perfectly still. Moving further than this is a scroll
// or a drag rather than a press.
const MOVE_TOLERANCE = 10;

/**
 * Calls `handler` when a touch is held on an element `claim` accepts.
 *
 * Browsers don't agree on what a long-press is: Chrome on Android fires
 * `contextmenu` for it, iOS Safari fires nothing at all. Timing it from pointer
 * events gives every touch device the same gesture. Mice and pens are left
 * alone; a right-click already reaches the `contextmenu` handlers.
 *
 * `claim` gets the element the press started on and returns the element it is
 * a press on, or nothing to ignore it. Once a press is claimed, the browser's
 * own reaction to it -- Android's `contextmenu`, any click it sends after
 * the finger lifts -- is swallowed, so the press doesn't also act as a tap or a
 * right-click.
 *
 * `handler` gets an event-like object: the claimed element as `currentTarget`,
 * and where the press started as `clientX`/`clientY`.
 */
export default function onLongPress(container, claim, handler) {
  // The press being timed: who it is, where it started, what it claimed.
  let press = null;
  // Set once a press has fired, until the next one starts. The browser's
  // follow-up events for the gesture arrive after the finger lifts.
  let fired = false;

  const cancel = () => {
    clearTimeout(press?.timer);
    press = null;
  };

  const fire = () => {
    const { target, x, y } = press;
    cancel();
    fired = true;
    // Whatever the platform began selecting under the finger.
    window.getSelection()?.removeAllRanges();
    handler({ currentTarget: target, target, clientX: x, clientY: y });
  };

  container.addEventListener('pointerdown', (e) => {
    cancel();
    fired = false;

    if (e.pointerType !== 'touch' || !e.isPrimary) {
      return;
    }

    const target = claim(e.target);
    if (!target) {
      return;
    }

    press = {
      id: e.pointerId,
      target,
      x: e.clientX,
      y: e.clientY,
      timer: setTimeout(fire, HOLD_MS),
    };
  });

  container.addEventListener('pointermove', (e) => {
    if (
      press?.id === e.pointerId &&
      Math.hypot(e.clientX - press.x, e.clientY - press.y) > MOVE_TOLERANCE
    ) {
      cancel();
    }
  });

  // A scroll taking over the gesture arrives as `pointercancel`. The
  // follow-up events land right after the finger lifts, so a press that fired
  // stops swallowing soon after -- a click from the keyboard sends no
  // `pointerdown` to reset it.
  const end = () => {
    cancel();
    if (fired) {
      setTimeout(() => {
        fired = false;
      }, HOLD_MS);
    }
  };
  container.addEventListener('pointerup', end);
  container.addEventListener('pointercancel', end);

  // Captured on the container, so these run before -- and stop -- the
  // handlers delegated to it.
  container.addEventListener(
    'contextmenu',
    (e) => {
      if (!press && !fired) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      // Android got there first; there's no need to wait out the timer.
      if (press) {
        fire();
      }
    },
    true,
  );

  ['mousedown', 'mouseup', 'click'].forEach((type) => {
    container.addEventListener(
      type,
      (e) => {
        if (fired) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true,
    );
  });
}
