import { buildPollOptionHtml, countClippedOptions } from './poll';

/**
 * Parse an option's rendered HTML into a detached DOM node so we can inspect
 * how a browser would actually interpret it.
 * @param {string} html
 * @return {HTMLElement} the `.opt` element
 */
function renderOption(html) {
  const container = document.createElement('div');
  container.innerHTML = html;
  return container.querySelector('.opt');
}

describe('Escaping poll options (XSS prevention)', () => {
  test('escapes an element-injection payload in option content', () => {
    const html = buildPollOptionHtml('<img src=x onerror=alert(1)>', 0);

    // The angle brackets must be encoded, so no real element is created...
    expect(html).toContain('&lt;img');
    expect(html).not.toContain('<img');

    const opt = renderOption(html);
    expect(opt.querySelector('img')).toBeNull();
    // ...and the payload shows up as literal text instead.
    expect(opt.querySelector('.opt-bar-option').textContent.trim()).toBe(
      '<img src=x onerror=alert(1)>',
    );
  });

  test('does not let an option break out of the title attribute', () => {
    const opt = renderOption(buildPollOptionHtml('" onmouseover="alert(1)', 0));

    // The stray quote must stay inside title="", never becoming its own attr.
    expect(opt.getAttribute('onmouseover')).toBeNull();
    expect(opt.getAttribute('title')).toBe('Vote " onmouseover="alert(1)');
  });

  test('renders a benign option as text with the correct vote number', () => {
    const opt = renderOption(buildPollOptionHtml('Yes', 0));

    expect(opt.querySelector('.opt-bar-option').textContent.trim()).toBe('Yes');
    expect(opt.querySelector('.opt-vote-number').textContent.trim()).toBe('1');
  });

  test('preserves non-ASCII option text when parsed back', () => {
    const opt = renderOption(buildPollOptionHtml('Café', 2));

    expect(opt.querySelector('.opt-bar-option').textContent.trim()).toBe(
      'Café',
    );
    expect(opt.querySelector('.opt-vote-number').textContent.trim()).toBe('3');
  });
});

/**
 * Build the rects for `count` options of a fixed height stacked from the top of
 * the scrolled content, as seen from a viewport scrolled down by `scrollTop`.
 * @param {number} count
 * @param {number} scrollTop
 * @param {number} optionHeight
 * @return {Array<{top: number, bottom: number}>}
 */
function optionRects(count, scrollTop, optionHeight = 40) {
  return Array.from({ length: count }, (_, i) => ({
    top: i * optionHeight - scrollTop,
    bottom: (i + 1) * optionHeight - scrollTop,
  }));
}

describe('Counting the poll options cut off by the scroller', () => {
  // A viewport showing exactly three 40px options.
  const viewport = { top: 0, bottom: 120 };

  test('reports nothing hidden when every option fits', () => {
    expect(countClippedOptions(viewport, optionRects(3, 0))).toEqual({
      above: 0,
      below: 0,
    });
  });

  test('counts the options below when scrolled to the top', () => {
    expect(countClippedOptions(viewport, optionRects(12, 0))).toEqual({
      above: 0,
      below: 9,
    });
  });

  test('counts the options above when scrolled to the bottom', () => {
    expect(countClippedOptions(viewport, optionRects(12, 360))).toEqual({
      above: 9,
      below: 0,
    });
  });

  test('counts in both directions when scrolled to the middle', () => {
    expect(countClippedOptions(viewport, optionRects(12, 160))).toEqual({
      above: 4,
      below: 5,
    });
  });

  test('counts a partly visible option as hidden, since it still needs scrolling to', () => {
    // Scrolled by half an option, so the first and last are each half cut off.
    expect(countClippedOptions(viewport, optionRects(4, 20))).toEqual({
      above: 1,
      below: 1,
    });
  });

  test('tolerates a subpixel overhang at a flush edge', () => {
    const flush = [
      { top: -0.4, bottom: 39.6 },
      { top: 39.6, bottom: 79.6 },
      { top: 79.6, bottom: 120.4 },
    ];

    expect(countClippedOptions(viewport, flush)).toEqual({
      above: 0,
      below: 0,
    });
  });
});
