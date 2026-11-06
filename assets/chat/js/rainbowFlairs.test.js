import applyRainbowFlairs, { rainbowFlairCss } from './rainbowFlairs';

const flairs = [
  { name: 'flair42', rainbowColor: true, color: '#eb79da' },
  { name: 'flair13', rainbowColor: false, color: '#59AEEA' },
  { name: 'flair33', rainbowColor: true, color: '#eb79da' },
];

describe('rainbowFlairCss', () => {
  test('rotates the hue of rainbow flairs only', () => {
    expect(rainbowFlairCss(flairs)).toBe(
      ':root .user.flair42, :root .user.flair33 { animation-name: rainbow-hue; }',
    );
  });

  test('is empty without rainbow flairs', () => {
    expect(rainbowFlairCss([flairs[1]])).toBe('');
    expect(rainbowFlairCss([])).toBe('');
  });

  test('skips a name that is not a plain class name', () => {
    expect(
      rainbowFlairCss([{ name: 'x{} body', rainbowColor: true }, flairs[0]]),
    ).toBe(':root .user.flair42 { animation-name: rainbow-hue; }');
  });
});

describe('applyRainbowFlairs', () => {
  afterEach(() => document.getElementById('chat-rainbow-flairs')?.remove());

  test('keeps one style element, updated on reload', () => {
    applyRainbowFlairs(flairs);
    applyRainbowFlairs([flairs[2]]);
    const styles = document.querySelectorAll('#chat-rainbow-flairs');
    expect(styles).toHaveLength(1);
    expect(styles[0].textContent).toBe(
      ':root .user.flair33 { animation-name: rainbow-hue; }',
    );
  });
});
