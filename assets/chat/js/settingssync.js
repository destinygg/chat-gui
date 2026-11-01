import { settingsdefault } from './const';

/**
 * Chat settings are saved to the user's profile from every device. Before
 * that, only devices that opted in did, so on a device's first sync its
 * local settings and the profile copy can disagree. These helpers decide what
 * survives.
 */

// Keys that record bookkeeping rather than a choice the user made. They are
// never merged: the profile copy's value is kept.
const BOOKKEEPING = new Set(['schemaversion', 'profilesettings']);

// List settings whose items are [key, value] pairs (they become Maps).
const PAIR_LISTS = new Set(['taggednicks', 'taggednotes']);

const SYNCED_KEY = 'chat.settings.synced';

function sameValue(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function isCustomized(key, value) {
  return (
    value !== undefined &&
    value !== null &&
    !sameValue(value, settingsdefault.get(key))
  );
}

function unionList(key, server, local) {
  if (PAIR_LISTS.has(key)) {
    // Server wins when both sides have an entry for the same key.
    return [...new Map([...local, ...server])];
  }
  return [...new Set([...server, ...local])];
}

/**
 * Merges a device's local settings into the profile copy, for that device's
 * first sync. Only values that differ from the defaults count: a device the
 * user never customized contributes nothing, so it can't overwrite another
 * device's settings with defaults. Lists are combined; when both sides
 * customized a single value differently, the profile copy wins.
 *
 * @param {Map} server the profile copy
 * @param {Map} local this device's settings
 * @returns {Map}
 */
function mergeSettings(server, local) {
  const merged = new Map();
  for (const key of settingsdefault.keys()) {
    const serverValue = server.get(key);
    const localValue = local.get(key);
    if (BOOKKEEPING.has(key)) {
      if (serverValue !== undefined && serverValue !== null) {
        merged.set(key, serverValue);
      } else if (key === 'schemaversion' && isCustomized(key, localValue)) {
        merged.set(key, localValue);
      }
      continue;
    }

    const serverSet = isCustomized(key, serverValue);
    const localSet = isCustomized(key, localValue);
    if (serverSet && localSet && Array.isArray(settingsdefault.get(key))) {
      merged.set(key, unionList(key, serverValue, localValue));
    } else if (serverSet) {
      merged.set(key, serverValue);
    } else if (localSet) {
      merged.set(key, localValue);
    } else if (serverValue !== undefined && serverValue !== null) {
      merged.set(key, serverValue);
    }
  }
  return merged;
}

/**
 * Whether two settings maps amount to the same settings once missing values
 * fall back to the defaults. Bookkeeping keys are ignored.
 */
function sameSettings(a, b) {
  return [...settingsdefault.keys()]
    .filter((key) => !BOOKKEEPING.has(key))
    .every((key) => {
      const fallback = settingsdefault.get(key);
      return sameValue(a.get(key) ?? fallback, b.get(key) ?? fallback);
    });
}

/**
 * Decides what a device does with the profile copy it just loaded.
 *
 * - The device has synced before for this user, or the profile copy was
 *   saved by a device that opted in before syncing became automatic: the
 *   profile copy is the truth.
 * - Otherwise (the device's first sync): merge, and upload if the merge
 *   changed the profile copy.
 *
 * @param {Map} server the profile copy
 * @param {Map} local this device's settings
 * @param {boolean} synced whether this device has synced for this user
 * @returns {{settings: Map, upload: boolean}}
 */
function resolveSettings(server, local, synced) {
  const legacyOptIn = server.get('profilesettings') === true;
  if (server.size > 0 && (synced || legacyOptIn)) {
    return { settings: server, upload: false };
  }
  const settings = mergeSettings(server, local);
  return { settings, upload: !sameSettings(settings, server) };
}

export {
  SYNCED_KEY,
  isCustomized,
  mergeSettings,
  resolveSettings,
  sameSettings,
};
