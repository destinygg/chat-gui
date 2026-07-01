import { buildPollOptionHtml } from './poll';

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
