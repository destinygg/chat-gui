import {
  buildModerationTooltipElement,
  buildModerationTooltipSections,
  createDefaultModerationState,
  formatCountdown,
  formatModAction,
  getVisibleModes,
  isMalformedModerationState,
  normalizeModerationState,
  resolveIndicator,
} from './moderation-state';

function regularUser(subTier = 0) {
  return {
    hasModPowers: () => false,
    isPrivileged: () => false,
    subTier,
  };
}

function modUser(subTier = 0) {
  return {
    hasModPowers: () => true,
    isPrivileged: () => true,
    subTier,
  };
}

function protectedUser(subTier = 0) {
  return {
    hasModPowers: () => false,
    isPrivileged: () => true,
    subTier,
  };
}

function state(overrides = {}) {
  return normalizeModerationState({
    ...createDefaultModerationState(),
    ...overrides,
  });
}

function nuke(overrides = {}) {
  return {
    key: 'plain:king mouton',
    phrase: 'KING MOUTON',
    regex: false,
    duration: 600,
    mega: false,
    addedBy: 'ModName',
    addedAt: 1770000000000,
    expiresAt: 1770000300000,
    ...overrides,
  };
}

function nukedUser(overrides = {}) {
  return {
    id: 123,
    nick: 'Chatter',
    nukeKey: 'plain:king mouton',
    mega: false,
    expiresAt: 1770000600000,
    ...overrides,
  };
}

describe('Normalizing moderation state', () => {
  test('defaults missing state to off and empty', () => {
    const result = normalizeModerationState({});

    expect(result).toEqual(createDefaultModerationState());
  });

  test('tolerates a non-object payload', () => {
    expect(normalizeModerationState(null)).toEqual(
      createDefaultModerationState(),
    );
    expect(normalizeModerationState('nope')).toEqual(
      createDefaultModerationState(),
    );
  });

  test('keeps a valid server snapshot', () => {
    const result = normalizeModerationState({
      subonly: { tier: 2, changedBy: 'ModName', timestamp: 100 },
      nukes: [nuke()],
      mutelinks: {
        mode: 'on',
        duration: 60,
        mention: 'ModName',
        changedBy: 'ModName',
        timestamp: 200,
      },
      breakingnews: {
        mode: 'all',
        maxAge: 300,
        changedBy: 'ModName',
        timestamp: 300,
      },
      nukedUsers: [nukedUser()],
      timestamp: 400,
    });

    expect(result.subonly.tier).toBe(2);
    expect(result.nukes[0].phrase).toBe('KING MOUTON');
    expect(result.mutelinks).toMatchObject({
      mode: 'on',
      duration: 60,
      mention: 'ModName',
    });
    expect(result.breakingnews.mode).toBe('all');
    expect(result.nukedUsers[0].nick).toBe('Chatter');
    expect(result.timestamp).toBe(400);
  });

  test('treats unknown modes as off', () => {
    const result = normalizeModerationState({
      mutelinks: { mode: 'sometimes' },
      breakingnews: { mode: 'everyone' },
    });

    expect(result.mutelinks.mode).toBe('off');
    expect(result.breakingnews.mode).toBe('off');
  });

  test('coerces missing arrays and negative tiers to safe values', () => {
    const result = normalizeModerationState({
      subonly: { tier: -2 },
      nukes: null,
      nukedUsers: 'no',
    });

    expect(result.subonly.tier).toBe(0);
    expect(result.nukes).toEqual([]);
    expect(result.nukedUsers).toEqual([]);
  });

  test('flags wrong-shaped payloads for one-time logging', () => {
    expect(isMalformedModerationState(null)).toBe(true);
    expect(isMalformedModerationState({ nukes: {} })).toBe(true);
    expect(isMalformedModerationState({ nukedUsers: 'x' })).toBe(true);
    expect(isMalformedModerationState({ subonly: { tier: '2' } })).toBe(true);
    expect(isMalformedModerationState({ subonly: { tier: 2 } })).toBe(false);
    expect(isMalformedModerationState({})).toBe(false);
  });
});

describe('Selecting visible modes', () => {
  test('shows nothing when every mode is off', () => {
    expect(getVisibleModes(state(), regularUser())).toEqual([]);
    expect(getVisibleModes(state(), modUser())).toEqual([]);
  });

  test('shows subscriber-only to a regular user below the tier', () => {
    expect(
      getVisibleModes(state({ subonly: { tier: 2 } }), regularUser(1)),
    ).toEqual(['subonly']);
  });

  test('hides subscriber-only from a user at or above the tier', () => {
    expect(
      getVisibleModes(state({ subonly: { tier: 2 } }), regularUser(2)),
    ).toEqual([]);
  });

  test('shows subscriber-only to mods even when they are exempt', () => {
    expect(
      getVisibleModes(state({ subonly: { tier: 2 } }), modUser(5)),
    ).toEqual(['subonly']);
  });

  test('keeps nukes visible from nuked users alone', () => {
    expect(
      getVisibleModes(state({ nukedUsers: [nukedUser()] }), regularUser()),
    ).toEqual(['nuke']);
  });

  test('orders modes by priority', () => {
    const result = getVisibleModes(
      state({
        subonly: { tier: 1 },
        nukes: [nuke()],
        mutelinks: { mode: 'all' },
        breakingnews: { mode: 'on' },
      }),
      regularUser(),
    );

    expect(result).toEqual(['subonly', 'nuke', 'mutelinks', 'breakingnews']);
  });

  test('hides the three non-subscriber modes from protected-only users', () => {
    const result = getVisibleModes(
      state({
        subonly: { tier: 2 },
        nukes: [nuke()],
        mutelinks: { mode: 'all' },
        breakingnews: { mode: 'on' },
      }),
      protectedUser(0),
    );

    expect(result).toEqual(['subonly']);
  });

  test('shows no indicator to a protected-only user with only other modes', () => {
    const result = getVisibleModes(
      state({ nukes: [nuke()], mutelinks: { mode: 'all' } }),
      protectedUser(),
    );

    expect(result).toEqual([]);
  });

  test('resolves the top mode and the additional count', () => {
    expect(resolveIndicator([])).toEqual({ mode: null, additional: 0 });
    expect(resolveIndicator(['nuke'])).toEqual({
      mode: 'nuke',
      additional: 0,
    });
    expect(resolveIndicator(['nuke', 'mutelinks', 'breakingnews'])).toEqual({
      mode: 'nuke',
      additional: 2,
    });
  });
});

describe('Formatting nuke countdowns', () => {
  test('renders minutes and seconds', () => {
    expect(formatCountdown(1000 + 272 * 1000, 1000)).toBe('04:32');
  });

  test('clamps expired rules at zero', () => {
    expect(formatCountdown(1000, 2000)).toBe('00:00');
  });

  test('rounds a partial second up', () => {
    expect(formatCountdown(1500, 1000)).toBe('00:01');
  });
});

describe('Building the tooltip content', () => {
  const now = 1770000000000;

  test('describes subscriber-only tiers', () => {
    expect(
      buildModerationTooltipSections(
        state({ subonly: { tier: 1 } }),
        ['subonly'],
        regularUser(),
        now,
      ),
    ).toEqual([
      {
        mode: 'subonly',
        title: 'Subscriber only mode is on.',
        rows: [],
        meta: [],
      },
    ]);

    expect(
      buildModerationTooltipSections(
        state({ subonly: { tier: 2 } }),
        ['subonly'],
        regularUser(),
        now,
      )[0].title,
    ).toBe('Subscriber only mode is on (Tier 2+).');
  });

  test('lists nuke phrases for regular users without moderator detail', () => {
    const [section] = buildModerationTooltipSections(
      state({ nukes: [nuke()], nukedUsers: [nukedUser()] }),
      ['nuke'],
      regularUser(),
      now,
    );

    expect(section.title).toBe('1 nuke is active.');
    expect(section.detail).toBe('Messages matching them are muted.');
    expect(section.rows).toEqual([
      {
        phrase: '"KING MOUTON"',
        countdown: '05:00',
        expiresAt: 1770000300000,
        mega: false,
        addedBy: null,
      },
    ]);
    expect(section.meta).toEqual([]);
  });

  test('uses a short label when nukes are shown alongside other modes', () => {
    const sections = buildModerationTooltipSections(
      state({ subonly: { tier: 1 }, nukes: [nuke()] }),
      ['subonly', 'nuke'],
      regularUser(),
      now,
    );

    expect(sections[1].title).toBe('Nukes: 1 active.');
  });

  test('marks regex and mega rules', () => {
    const [section] = buildModerationTooltipSections(
      state({
        nukes: [nuke({ phrase: 'spoiler', regex: true, mega: true })],
      }),
      ['nuke'],
      regularUser(),
      now,
    );

    expect(section.rows[0].phrase).toBe('/spoiler/');
    expect(section.rows[0].mega).toBe(true);
  });

  test('keeps the nuke mode when only nuked users remain', () => {
    const [section] = buildModerationTooltipSections(
      state({ nukes: [], nukedUsers: [nukedUser()] }),
      ['nuke'],
      regularUser(),
      now,
    );

    expect(section.title).toBe('Nuke mutes are still active.');
    expect(section.rows).toEqual([]);
    expect(section.meta).toEqual([]);
  });

  test('shows the muted-user count when only nuked users remain', () => {
    const [section] = buildModerationTooltipSections(
      state({ nukes: [], nukedUsers: [nukedUser()] }),
      ['nuke'],
      modUser(),
      now,
    );

    expect(section.meta).toEqual(['1 user is currently muted by nukes.']);
  });

  test('adds added-by rows and the muted-user count for mods', () => {
    const [section] = buildModerationTooltipSections(
      state({
        nukes: [nuke()],
        nukedUsers: [nukedUser(), nukedUser({ id: 124 })],
      }),
      ['nuke'],
      modUser(),
      now,
    );

    expect(section.rows[0].addedBy).toBe('added by ModName');
    expect(section.meta).toEqual(['2 users are currently muted by nukes.']);
  });

  test('describes each mutelinks mode with its duration and mention', () => {
    const on = buildModerationTooltipSections(
      state({
        mutelinks: { mode: 'on', duration: 90, mention: 'ModName' },
      }),
      ['mutelinks'],
      regularUser(),
      now,
    )[0];
    expect(on.title).toBe(
      'Messages that include links and mention @ModName will be muted for 90s.',
    );

    const all = buildModerationTooltipSections(
      state({ mutelinks: { mode: 'all' } }),
      ['mutelinks'],
      regularUser(),
      now,
    )[0];
    expect(all.title).toBe(
      'Messages that include links will be muted for 60s.',
    );

    const repeat = buildModerationTooltipSections(
      state({ mutelinks: { mode: 'repeat', duration: 30 } }),
      ['mutelinks'],
      regularUser(),
      now,
    )[0];
    expect(repeat.title).toBe(
      'Messages that include repeated links will be muted for 30s.',
    );
  });

  test('describes breaking-news modes with a short age', () => {
    const on = buildModerationTooltipSections(
      state({
        breakingnews: { mode: 'on', maxAge: 300, mention: 'ModName' },
      }),
      ['breakingnews'],
      regularUser(),
      now,
    )[0];
    expect(on.title).toBe(
      'Breaking news mode is on: messages that include links older than 5m and mention @ModName will be muted.',
    );

    const all = buildModerationTooltipSections(
      state({ breakingnews: { mode: 'all', maxAge: 900 } }),
      ['breakingnews'],
      regularUser(),
      now,
    )[0];
    expect(all.title).toBe(
      'Breaking news mode is on: messages that include links older than 15m will be muted.',
    );
  });

  test('adds set-by metadata for mods only', () => {
    const stateWithMeta = state({
      mutelinks: {
        mode: 'all',
        changedBy: 'ModName',
        timestamp: Date.UTC(2026, 0, 2, 3, 4),
      },
    });

    const modSection = buildModerationTooltipSections(
      stateWithMeta,
      ['mutelinks'],
      modUser(),
      now,
    )[0];
    expect(modSection.meta[0]).toContain('Set by ModName');

    const regularSection = buildModerationTooltipSections(
      stateWithMeta,
      ['mutelinks'],
      regularUser(),
      now,
    )[0];
    expect(regularSection.meta).toEqual([]);
  });

  test('shows who enabled subscriber-only to mods only', () => {
    const stateWithMeta = state({
      subonly: {
        tier: 1,
        changedBy: 'ModName',
        timestamp: Date.UTC(2026, 0, 2, 3, 4),
      },
    });

    const modSection = buildModerationTooltipSections(
      stateWithMeta,
      ['subonly'],
      modUser(),
      now,
    )[0];
    expect(modSection.meta[0]).toContain('Set by ModName');

    const regularSection = buildModerationTooltipSections(
      stateWithMeta,
      ['subonly'],
      regularUser(),
      now,
    )[0];
    expect(regularSection.meta).toEqual([]);

    const protectedSection = buildModerationTooltipSections(
      stateWithMeta,
      ['subonly'],
      protectedUser(),
      now,
    )[0];
    expect(protectedSection.meta).toEqual([]);
  });
});

describe('Rendering tooltip DOM', () => {
  test('inserts phrases as text, not markup', () => {
    const sections = buildModerationTooltipSections(
      state({ nukes: [nuke({ phrase: '<img src=x onerror=alert(1)>' })] }),
      ['nuke'],
      regularUser(),
      Date.now(),
    );
    const element = buildModerationTooltipElement(sections);

    expect(element.querySelector('img')).toBeNull();
    expect(element.querySelector('.mod-state-phrase').textContent).toBe(
      '"<img src=x onerror=alert(1)>"',
    );
  });

  test('sets expiry data for the live countdown and mega marker', () => {
    const sections = buildModerationTooltipSections(
      state({ nukes: [nuke({ mega: true })] }),
      ['nuke'],
      modUser(),
      Date.now(),
    );
    const element = buildModerationTooltipElement(sections);

    expect(element.querySelector('.mod-state-mega').textContent).toBe('MEGA');
    expect(
      element.querySelector('.mod-state-countdown').dataset.expiresAt,
    ).toBe('1770000300000');
    expect(element.classList.contains('moderation-tooltip')).toBe(true);
    expect(element.getAttribute('tabindex')).toBe('0');
  });
});

describe('Formatting MODACTION lines', () => {
  test('renders the old SUBONLY wording from the point-in-time payload', () => {
    expect(
      formatModAction({
        action: 'subonly',
        payload: { mode: 'on', tier: 2 },
        nick: 'ModName',
      }),
    ).toBe('Subscriber only mode (Tier 2+) enabled by ModName.');
  });

  test('defaults a missing tier to 1 when enabling', () => {
    expect(
      formatModAction({
        action: 'subonly',
        payload: { mode: 'on' },
        nick: 'ModName',
      }),
    ).toBe('Subscriber only mode enabled by ModName.');
  });

  test('renders disable lines without a tier', () => {
    expect(
      formatModAction({
        action: 'subonly',
        payload: { mode: 'off', tier: 3 },
        nick: 'ModName',
      }),
    ).toBe('Subscriber only mode disabled by ModName.');
  });

  test('omits the actor suffix when there is no nick', () => {
    expect(
      formatModAction({
        action: 'subonly',
        payload: { mode: 'off' },
      }),
    ).toBe('Subscriber only mode disabled.');
  });

  test('ignores unknown and malformed actions', () => {
    expect(formatModAction(null)).toBeNull();
    expect(formatModAction({ action: 'nuke' })).toBeNull();
    expect(formatModAction({ action: 'subonly' })).toBeNull();
    expect(
      formatModAction({ action: 'subonly', payload: { mode: 'maybe' } }),
    ).toBeNull();
  });
});
