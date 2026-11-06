/**
 * flairs.css colours the names of a `rainbowColor` flair with a gradient it
 * slides by animating `background-position`. Browsers can't run that on the
 * compositor, so every rainbow name on the page is repainted every frame, for
 * as long as it stays in the chat: a constant GPU load that grows with the
 * display's refresh rate and competes with OBS and with video in other tabs.
 * Rotating the hue of the still gradient with `filter` instead (`rainbow-hue`
 * in _base.scss) looks nearly the same and runs entirely on the compositor.
 *
 * Only `animation-name` is replaced, so the duration and timing still come
 * from flairs.css, and `pref-disableanimations` still turns it off.
 *
 * @param {Array<{name: string, rainbowColor?: boolean}>} flairs
 * @returns {string}
 */
export function rainbowFlairCss(flairs) {
  const selectors = flairs
    // The name becomes a class selector.
    .filter((flair) => flair.rainbowColor && /^[\w-]+$/.test(flair.name))
    // `:root` outranks flairs.css's `.user.<flair>`, which loads after us.
    .map((flair) => `:root .user.${flair.name}`);
  return selectors.length
    ? `${selectors.join(', ')} { animation-name: rainbow-hue; }`
    : '';
}

/**
 * @param {Array<{name: string, rainbowColor?: boolean}>} flairs
 */
export default function applyRainbowFlairs(flairs) {
  let style = document.getElementById('chat-rainbow-flairs');
  if (!style) {
    style = document.createElement('style');
    style.id = 'chat-rainbow-flairs';
    document.head.appendChild(style);
  }
  style.textContent = rainbowFlairCss(flairs);
}
