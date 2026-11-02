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

// The user whose settings this device's local copy holds: written whenever a
// load from the profile is applied. Unset on a device that has never synced.
const SYNCED_KEY = 'chat.settings.synced';

// {user, token}: this device has changes for that user that the profile copy
// doesn't have yet. Cleared when an upload succeeds.
const PENDING_KEY = 'chat.settings.pending';

function sameValue(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function hasValue(value) {
  return value !== undefined && value !== null;
}

function isCustomized(key, value) {
  return hasValue(value) && !sameValue(value, settingsdefault.get(key));
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
 * A legacy profile copy, saved by a device that opted in before syncing was
 * automatic, holds choices the user made on purpose, defaults included, so
 * all its single values win. Its lists are still combined: the device may
 * never have opted in, and its ignore list and tags are its own. The cost is
 * that a device that had opted in brings back entries removed elsewhere since
 * it last loaded.
 *
 * @param {Map} server the profile copy
 * @param {Map} local this device's settings
 * @param {boolean} legacy whether the profile copy is a legacy one
 * @returns {Map}
 */
function mergeSettings(server, local, legacy = false) {
  const merged = new Map();
  for (const key of settingsdefault.keys()) {
    const serverValue = server.get(key);
    const localValue = local.get(key);
    if (BOOKKEEPING.has(key)) {
      if (hasValue(serverValue)) {
        merged.set(key, serverValue);
      } else if (key === 'schemaversion' && isCustomized(key, localValue)) {
        merged.set(key, localValue);
      }
      continue;
    }

    const isList = Array.isArray(settingsdefault.get(key));
    const serverSet = isCustomized(key, serverValue);
    const localSet = isCustomized(key, localValue);
    if (isList && serverSet && localSet) {
      merged.set(key, unionList(key, serverValue, localValue));
    } else if (serverSet || (legacy && !isList && hasValue(serverValue))) {
      merged.set(key, serverValue);
    } else if (localSet) {
      merged.set(key, localValue);
    } else if (hasValue(serverValue)) {
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
 * Every setting, from `settings` where it has a value and the defaults
 * otherwise. Applying a partial map leaves the missing settings as they were,
 * which is wrong when they belong to someone else.
 */
function withDefaults(settings) {
  return new Map(
    [...settingsdefault].map(([key, fallback]) => [
      key,
      settings.get(key) ?? fallback,
    ]),
  );
}

/**
 * Decides what a device does with the profile copy it just loaded.
 *
 * - The local copy is another account's (the device last synced for someone
 *   else): none of it is this user's, so the profile copy is taken, with
 *   defaults for whatever it lacks. Nothing is uploaded.
 * - The device has synced for this user and has changes the profile copy
 *   doesn't (an upload failed, was cancelled by a reload, or was held back
 *   while the profile copy loaded): they are the newest, so they're kept and
 *   uploaded, replacing the profile copy.
 * - The device has synced for this user: the profile copy is the truth.
 * - Otherwise (the device's first sync, or an empty profile copy): merge, and
 *   upload if the merge changed the profile copy.
 *
 * @param {Map} server the profile copy
 * @param {Map} local this device's settings
 * @param {object} state
 * @param {number} state.userId the logged-in user
 * @param {?number} state.syncedFor SYNCED_KEY: the user this device last
 *   synced for, or null if it never has
 * @param {boolean} state.pending whether this device has changes for this
 *   user that the profile copy doesn't have
 * @returns {{settings: Map, upload: boolean}}
 */
function resolveSettings(server, local, { userId, syncedFor, pending }) {
  if (hasValue(syncedFor) && syncedFor !== userId) {
    return { settings: withDefaults(server), upload: false };
  }
  if (syncedFor === userId && pending) {
    // Except the legacy mark, which only the profile copy carries: the local
    // copy is always cached without it.
    const settings = new Map(local);
    if (hasValue(server.get('profilesettings'))) {
      settings.set('profilesettings', server.get('profilesettings'));
    }
    return { settings, upload: true };
  }
  if (syncedFor === userId && server.size > 0) {
    return { settings: server, upload: false };
  }
  const legacy = server.get('profilesettings') === true;
  const settings = mergeSettings(server, local, legacy);
  return { settings, upload: !sameSettings(settings, server) };
}

export {
  PENDING_KEY,
  SYNCED_KEY,
  isCustomized,
  mergeSettings,
  resolveSettings,
  sameSettings,
};
