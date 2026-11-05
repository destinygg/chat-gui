import { settingsdefault } from './const';
import { mergeSettings, resolveSettings, sameSettings } from './settingssync';

const defaults = () => new Map(settingsdefault);
const withValues = (values) =>
  new Map([...defaults(), ...Object.entries(values)]);

describe('mergeSettings', () => {
  test('a customized local value beats a default on the server', () => {
    const merged = mergeSettings(
      defaults(),
      withValues({ showtime: true, maxlines: 500 }),
    );
    expect(merged.get('showtime')).toBe(true);
    expect(merged.get('maxlines')).toBe(500);
  });

  test('a default local value does not replace a customized server value', () => {
    const merged = mergeSettings(withValues({ showtime: true }), defaults());
    expect(merged.get('showtime')).toBe(true);
  });

  test('the server wins when both customized the same value', () => {
    const merged = mergeSettings(
      withValues({ timestampformat: 'HH:mm:ss' }),
      withValues({ timestampformat: 'h:mm a' }),
    );
    expect(merged.get('timestampformat')).toBe('HH:mm:ss');
  });

  test('lists are combined', () => {
    const merged = mergeSettings(
      withValues({ ignorenicks: ['a', 'b'] }),
      withValues({ ignorenicks: ['b', 'c'] }),
    );
    expect(merged.get('ignorenicks')).toEqual(['a', 'b', 'c']);
  });

  test('pair lists are combined by key, the server winning', () => {
    const merged = mergeSettings(
      withValues({ taggednicks: [['a', 'red']] }),
      withValues({
        taggednicks: [
          ['a', 'blue'],
          ['b', 'green'],
        ],
      }),
    );
    expect(new Map(merged.get('taggednicks'))).toEqual(
      new Map([
        ['a', 'red'],
        ['b', 'green'],
      ]),
    );
  });

  test('an empty server takes the local customizations', () => {
    const merged = mergeSettings(
      new Map(),
      withValues({ ignorenicks: ['a'], showtime: true }),
    );
    expect(merged.get('ignorenicks')).toEqual(['a']);
    expect(merged.get('showtime')).toBe(true);
  });

  test('the local profilesettings value is never taken', () => {
    const merged = mergeSettings(
      new Map(),
      withValues({ profilesettings: true }),
    );
    expect(merged.has('profilesettings')).toBe(false);
  });

  test('a legacy profile copy wins on single values, even defaults', () => {
    const merged = mergeSettings(
      withValues({ profilesettings: true, timestampformat: 'HH:mm:ss' }),
      withValues({ showtime: true, timestampformat: 'h:mm a' }),
      true,
    );
    expect(merged.get('showtime')).toBe(false);
    expect(merged.get('timestampformat')).toBe('HH:mm:ss');
  });

  test('a legacy profile copy still combines lists', () => {
    const merged = mergeSettings(
      withValues({
        profilesettings: true,
        ignorenicks: ['a'],
        taggednicks: [['a', 'red']],
      }),
      withValues({
        ignorenicks: ['x', 'y'],
        taggednicks: [
          ['a', 'blue'],
          ['b', 'green'],
        ],
        highlightnicks: ['h'],
      }),
      true,
    );
    expect(merged.get('ignorenicks')).toEqual(['a', 'x', 'y']);
    expect(new Map(merged.get('taggednicks'))).toEqual(
      new Map([
        ['a', 'red'],
        ['b', 'green'],
      ]),
    );
    expect(merged.get('highlightnicks')).toEqual(['h']);
  });
});

describe('sameSettings', () => {
  test('missing values count as defaults', () => {
    expect(sameSettings(new Map(), defaults())).toBe(true);
  });

  test('ignores bookkeeping keys', () => {
    expect(
      sameSettings(withValues({ profilesettings: true }), defaults()),
    ).toBe(true);
  });

  test('notices a changed value', () => {
    expect(sameSettings(withValues({ showtime: true }), defaults())).toBe(
      false,
    );
  });
});

describe('resolveSettings', () => {
  const USER = 1;
  const OTHER = 2;
  const firstSync = { userId: USER, syncedFor: null, pending: false };
  const synced = { userId: USER, syncedFor: USER, pending: false };

  test('an uncustomized device does not upload to an empty profile', () => {
    const { upload } = resolveSettings(new Map(), defaults(), firstSync);
    expect(upload).toBe(false);
  });

  test('an uncustomized device leaves a customized profile alone', () => {
    const server = withValues({ showtime: true, ignorenicks: ['a'] });
    const { settings, upload } = resolveSettings(server, defaults(), firstSync);
    expect(upload).toBe(false);
    expect(settings.get('showtime')).toBe(true);
    expect(settings.get('ignorenicks')).toEqual(['a']);
  });

  test('the main device wins over defaults a phone uploaded first', () => {
    // The phone synced first and uploaded its defaults.
    const phone = resolveSettings(new Map(), defaults(), firstSync);
    const server = phone.settings;

    const main = withValues({ showtime: true, ignorenicks: ['a'] });
    const { settings, upload } = resolveSettings(server, main, firstSync);
    expect(upload).toBe(true);
    expect(settings.get('showtime')).toBe(true);
    expect(settings.get('ignorenicks')).toEqual(['a']);
  });

  test('a customized device uploads to an empty profile', () => {
    const { settings, upload } = resolveSettings(
      new Map(),
      withValues({ ignorenicks: ['a'] }),
      firstSync,
    );
    expect(upload).toBe(true);
    expect(settings.get('ignorenicks')).toEqual(['a']);
  });

  test('a device that has synced takes the profile copy', () => {
    const server = withValues({ ignorenicks: ['a'] });
    const { settings, upload } = resolveSettings(
      server,
      withValues({ ignorenicks: ['a', 'removed-elsewhere'] }),
      synced,
    );
    expect(upload).toBe(false);
    expect(settings).toBe(server);
  });

  test('a legacy profile copy keeps its single values and gains lists', () => {
    const server = withValues({ profilesettings: true, ignorenicks: ['a'] });
    const { settings, upload } = resolveSettings(
      server,
      withValues({ ignorenicks: ['x'], showtime: true }),
      firstSync,
    );
    expect(upload).toBe(true);
    expect(settings.get('ignorenicks')).toEqual(['a', 'x']);
    expect(settings.get('showtime')).toBe(false);
    expect(settings.get('profilesettings')).toBe(true);
  });

  test('a legacy profile copy is not uploaded when the device adds nothing', () => {
    const server = withValues({ profilesettings: true, ignorenicks: ['a'] });
    const { upload } = resolveSettings(
      server,
      withValues({ ignorenicks: ['a'], showtime: true }),
      firstSync,
    );
    expect(upload).toBe(false);
  });

  test('a synced device with an empty profile uploads its settings', () => {
    const { upload } = resolveSettings(
      new Map(),
      withValues({ showtime: true }),
      synced,
    );
    expect(upload).toBe(true);
  });

  describe("a device holding another account's settings", () => {
    const otherAccount = { userId: USER, syncedFor: OTHER, pending: false };
    const theirs = withValues({
      ignorenicks: ['theirs'],
      taggednotes: [['someone', 'their note']],
      showtime: true,
    });

    test('takes the profile copy and uploads none of them', () => {
      const server = withValues({ ignorenicks: ['mine'] });
      const { settings, upload } = resolveSettings(
        server,
        theirs,
        otherAccount,
      );
      expect(upload).toBe(false);
      expect(settings.get('ignorenicks')).toEqual(['mine']);
      expect(settings.get('taggednotes')).toEqual([]);
      expect(settings.get('showtime')).toBe(false);
    });

    test('falls back to the defaults, not to theirs, for an empty profile', () => {
      const { settings, upload } = resolveSettings(
        new Map(),
        theirs,
        otherAccount,
      );
      expect(upload).toBe(false);
      expect(settings).toEqual(defaults());
    });

    test('ignores changes they had pending', () => {
      const { upload } = resolveSettings(new Map(), theirs, {
        ...otherAccount,
        pending: true,
      });
      expect(upload).toBe(false);
    });
  });

  test('pending changes on a synced device win over the profile copy', () => {
    const server = withValues({ ignorenicks: ['a'] });
    const local = withValues({ ignorenicks: ['a', 'added-offline'] });
    const { settings, upload } = resolveSettings(server, local, {
      ...synced,
      pending: true,
    });
    expect(upload).toBe(true);
    expect(settings).toEqual(local);
  });

  test('pending changes keep the legacy mark of the profile copy', () => {
    const { settings } = resolveSettings(
      withValues({ profilesettings: true }),
      withValues({ showtime: true }),
      { ...synced, pending: true },
    );
    expect(settings.get('profilesettings')).toBe(true);
    expect(settings.get('showtime')).toBe(true);
  });
});
