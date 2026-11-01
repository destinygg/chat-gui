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
  test('an uncustomized device does not upload to an empty profile', () => {
    const { upload } = resolveSettings(new Map(), defaults(), false);
    expect(upload).toBe(false);
  });

  test('an uncustomized device leaves a customized profile alone', () => {
    const server = withValues({ showtime: true, ignorenicks: ['a'] });
    const { settings, upload } = resolveSettings(server, defaults(), false);
    expect(upload).toBe(false);
    expect(settings.get('showtime')).toBe(true);
    expect(settings.get('ignorenicks')).toEqual(['a']);
  });

  test('the main device wins over defaults a phone uploaded first', () => {
    // The phone synced first and uploaded its defaults.
    const phone = resolveSettings(new Map(), defaults(), false);
    const server = phone.settings;

    const main = withValues({ showtime: true, ignorenicks: ['a'] });
    const { settings, upload } = resolveSettings(server, main, false);
    expect(upload).toBe(true);
    expect(settings.get('showtime')).toBe(true);
    expect(settings.get('ignorenicks')).toEqual(['a']);
  });

  test('a customized device uploads to an empty profile', () => {
    const { settings, upload } = resolveSettings(
      new Map(),
      withValues({ ignorenicks: ['a'] }),
      false,
    );
    expect(upload).toBe(true);
    expect(settings.get('ignorenicks')).toEqual(['a']);
  });

  test('a device that has synced takes the profile copy', () => {
    const server = withValues({ ignorenicks: ['a'] });
    const { settings, upload } = resolveSettings(
      server,
      withValues({ ignorenicks: ['a', 'removed-elsewhere'] }),
      true,
    );
    expect(upload).toBe(false);
    expect(settings).toBe(server);
  });

  test('a profile copy from a device that opted in is taken as is', () => {
    const server = withValues({ profilesettings: true, ignorenicks: ['a'] });
    const { settings, upload } = resolveSettings(
      server,
      withValues({ ignorenicks: ['a', 'removed-elsewhere'], showtime: true }),
      false,
    );
    expect(upload).toBe(false);
    expect(settings).toBe(server);
  });

  test('a synced device with an empty profile uploads its settings', () => {
    const { upload } = resolveSettings(
      new Map(),
      withValues({ showtime: true }),
      true,
    );
    expect(upload).toBe(true);
  });
});
