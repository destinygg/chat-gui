import moment from 'moment';

/**
 * Modes the chat-state indicator knows about, in display priority order.
 */
export const MODERATION_MODES = Object.freeze([
  'subonly',
  'nuke',
  'mutelinks',
  'breakingnews',
]);

export const MODERATION_MODE_LABELS = Object.freeze({
  subonly: 'Subscriber only mode',
  nuke: 'Nukes',
  mutelinks: 'Link banning',
  breakingnews: 'Breaking news',
});

const MUTELINKS_MODES = new Set(['off', 'on', 'all', 'repeat']);
const BREAKINGNEWS_MODES = new Set(['off', 'on', 'all']);

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value
    : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asString(value) {
  return typeof value === 'string' ? value : '';
}

function asNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function asMode(value, allowed) {
  return typeof value === 'string' && allowed.has(value) ? value : 'off';
}

function normalizeNuke(nuke) {
  const value = asObject(nuke);
  return {
    key: asString(value.key),
    phrase: asString(value.phrase),
    regex: value.regex === true,
    duration: asNumber(value.duration),
    mega: value.mega === true,
    addedBy: asString(value.addedBy),
    addedAt: asNumber(value.addedAt),
    expiresAt: asNumber(value.expiresAt),
  };
}

function normalizeNukedUser(user) {
  const value = asObject(user);
  return {
    id: asNumber(value.id),
    nick: asString(value.nick),
    nukeKey: asString(value.nukeKey),
    mega: value.mega === true,
    expiresAt: asNumber(value.expiresAt),
  };
}

/**
 * The empty moderation snapshot. Used before the first `STATES` event and for
 * missing fields in a partial payload.
 */
export function createDefaultModerationState() {
  return {
    subonly: { tier: 0, changedBy: '', timestamp: 0 },
    nukes: [],
    mutelinks: {
      mode: 'off',
      duration: 0,
      mention: '',
      changedBy: '',
      timestamp: 0,
    },
    breakingnews: {
      mode: 'off',
      maxAge: 0,
      mention: '',
      changedBy: '',
      timestamp: 0,
    },
    nukedUsers: [],
    timestamp: 0,
  };
}

/**
 * Replace the local snapshot from a `STATES` payload. Missing objects and
 * arrays fall back to empty/off so a partial or malformed payload cannot throw.
 */
export function normalizeModerationState(data) {
  const value = asObject(data);
  const subonly = asObject(value.subonly);
  const mutelinks = asObject(value.mutelinks);
  const breakingnews = asObject(value.breakingnews);

  return {
    subonly: {
      tier: Math.max(0, Math.trunc(asNumber(subonly.tier))),
      changedBy: asString(subonly.changedBy),
      timestamp: asNumber(subonly.timestamp),
    },
    nukes: asArray(value.nukes).map(normalizeNuke),
    mutelinks: {
      mode: asMode(mutelinks.mode, MUTELINKS_MODES),
      duration: asNumber(mutelinks.duration),
      mention: asString(mutelinks.mention),
      changedBy: asString(mutelinks.changedBy),
      timestamp: asNumber(mutelinks.timestamp),
    },
    breakingnews: {
      mode: asMode(breakingnews.mode, BREAKINGNEWS_MODES),
      maxAge: asNumber(breakingnews.maxAge),
      mention: asString(breakingnews.mention),
      changedBy: asString(breakingnews.changedBy),
      timestamp: asNumber(breakingnews.timestamp),
    },
    nukedUsers: asArray(value.nukedUsers).map(normalizeNukedUser),
    timestamp: asNumber(value.timestamp),
  };
}

/**
 * Whether a payload has fields of the wrong shape. The normalized snapshot is
 * still safe to use; `Chat` only uses this to log the first bad broadcast.
 */
export function isMalformedModerationState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return true;
  }
  if (data.subonly != null && typeof data.subonly !== 'object') {
    return true;
  }
  if (data.mutelinks != null && typeof data.mutelinks !== 'object') {
    return true;
  }
  if (data.breakingnews != null && typeof data.breakingnews !== 'object') {
    return true;
  }
  if (data.nukes != null && !Array.isArray(data.nukes)) {
    return true;
  }
  if (data.nukedUsers != null && !Array.isArray(data.nukedUsers)) {
    return true;
  }
  if (
    data.subonly &&
    data.subonly.tier != null &&
    typeof data.subonly.tier !== 'number'
  ) {
    return true;
  }
  return false;
}

function getUserAccess(user) {
  const isMod = Boolean(user?.hasModPowers?.());
  return {
    isMod,
    isProtectedOnly: Boolean(user?.isPrivileged?.()) && !isMod,
    subTier: asNumber(user?.subTier),
  };
}

/**
 * Modes that are both active and relevant to this user, in priority order.
 */
export function getVisibleModes(state, user) {
  const { isMod, isProtectedOnly, subTier } = getUserAccess(user);
  const visible = [];

  // Admins/mods always see subscriber-only when it is on. Everyone else only
  // sees it when it blocks them.
  if (state.subonly.tier > 0 && (isMod || subTier < state.subonly.tier)) {
    visible.push('subonly');
  }

  // Protected-only users are not affected by nukes, link banning, or breaking
  // news, so those modes are hidden from them.
  if (!isProtectedOnly) {
    // Expired nukes can leave victims muted, but the nuke itself is no longer
    // lingering, so there is nothing to advertise.
    if (state.nukes.length > 0) {
      visible.push('nuke');
    }
    if (state.mutelinks.mode !== 'off') {
      visible.push('mutelinks');
    }
    if (state.breakingnews.mode !== 'off') {
      visible.push('breakingnews');
    }
  }

  return visible;
}

/**
 * The mode shown by the indicator and the number of extra visible modes for
 * the badge.
 */
export function resolveIndicator(visible) {
  return {
    mode: visible[0] ?? null,
    additional: Math.max(0, visible.length - 1),
  };
}

function formatNukePhrase(nuke) {
  return nuke.regex ? `/${nuke.phrase}/` : `"${nuke.phrase}"`;
}

function formatNukeEffect(nuke) {
  const duration = nuke.duration > 0 ? nuke.duration : 600;
  return `${nuke.mega ? 'Banned' : 'Muted'} for ${formatShortDuration(duration)}`;
}

function pluralize(count, singular, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

/**
 * Format a remaining duration as `MM:SS`, clamped at `00:00`.
 */
export function formatCountdown(expiresAt, now = Date.now()) {
  const remaining = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
    2,
    '0',
  )}`;
}

function formatShortDuration(seconds) {
  const value = Math.max(0, Math.trunc(seconds));
  if (value > 0 && value % 3600 === 0) {
    return `${value / 3600}h`;
  }
  if (value > 0 && value % 60 === 0) {
    return `${value / 60}m`;
  }
  return `${value}s`;
}

function formatModerationMeta(changedBy, timestamp) {
  const parts = [];
  if (changedBy) {
    parts.push(`by ${changedBy}`);
  }
  if (timestamp > 0) {
    parts.push(moment(timestamp).format('MMM D, HH:mm'));
  }
  return parts.length > 0 ? `Set ${parts.join(' · ')}` : null;
}

function buildSubonlySection(state, { isMod }) {
  const { tier, changedBy, timestamp } = state.subonly;
  const meta = isMod ? formatModerationMeta(changedBy, timestamp) : null;
  return {
    mode: 'subonly',
    title:
      tier > 1
        ? `Subscriber only mode is on (Tier ${tier}+)`
        : 'Subscriber only mode is on',
    rows: [],
    meta: meta ? [meta] : [],
  };
}

function buildNukeSection(state, { combined, isMod, now }) {
  const { nukes, nukedUsers } = state;
  const mutedUsersMeta =
    isMod && nukedUsers.length > 0
      ? [
          `${nukedUsers.length} ${pluralize(
            nukedUsers.length,
            'user is',
            'users are',
          )} currently muted by nukes.`,
        ]
      : [];

  return {
    mode: 'nuke',
    title: combined
      ? `Nukes: ${nukes.length} active`
      : `${nukes.length} nuke${pluralize(nukes.length, '', 's')} ${pluralize(
          nukes.length,
          'is',
          'are',
        )} still lingering`,
    detail:
      'Messages matching one of these nukes will be muted or banned, depending on the nuke type.',
    rows: nukes.map((nuke) => ({
      phrase: formatNukePhrase(nuke),
      countdown: formatCountdown(nuke.expiresAt, now),
      expiresAt: nuke.expiresAt,
      mega: nuke.mega,
      effect: formatNukeEffect(nuke),
      addedBy: isMod && nuke.addedBy ? `added by ${nuke.addedBy}` : null,
    })),
    meta: mutedUsersMeta,
  };
}

function buildMutelinksSection(state, { isMod }) {
  const { mode, duration, mention, changedBy, timestamp } = state.mutelinks;
  const seconds = duration > 0 ? duration : 60;
  let title;

  switch (mode) {
    case 'on':
      title = mention
        ? `Messages that include links and mention @${mention} will be muted for ${seconds}s`
        : `Messages that include links and mention the configured user will be muted for ${seconds}s`;
      break;
    case 'all':
      title = `Messages that include links will be muted for ${seconds}s`;
      break;
    case 'repeat':
      title = `Messages that include repeated links will be muted for ${seconds}s`;
      break;
    default:
      title = '';
  }

  const meta = isMod ? formatModerationMeta(changedBy, timestamp) : null;
  return {
    mode: 'mutelinks',
    title,
    rows: [],
    meta: meta ? [meta] : [],
  };
}

function buildBreakingNewsSection(state, { isMod }) {
  const { mode, maxAge, mention, changedBy, timestamp } = state.breakingnews;
  const age = formatShortDuration(maxAge > 0 ? maxAge : 300);
  let title;

  switch (mode) {
    case 'on':
      title = mention
        ? `Breaking news mode is on: messages that include links older than ${age} and mention @${mention} will be muted`
        : `Breaking news mode is on: messages that include links older than ${age} will be muted`;
      break;
    case 'all':
      title = `Breaking news mode is on: messages that include links older than ${age} will be muted`;
      break;
    default:
      title = '';
  }

  const meta = isMod ? formatModerationMeta(changedBy, timestamp) : null;
  return {
    mode: 'breakingnews',
    title,
    rows: [],
    meta: meta ? [meta] : [],
  };
}

/**
 * Presentation model for the tooltip: the visible modes in priority order,
 * with role-appropriate detail. Text is plain; the renderer puts it in text
 * nodes so server strings never become markup.
 */
export function buildModerationTooltipSections(
  state,
  visible,
  user,
  now = Date.now(),
) {
  const { isMod } = getUserAccess(user);
  const combined = visible.length > 1;
  const sections = [];

  for (const mode of visible) {
    switch (mode) {
      case 'subonly':
        sections.push(buildSubonlySection(state, { isMod }));
        break;
      case 'nuke':
        sections.push(buildNukeSection(state, { combined, isMod, now }));
        break;
      case 'mutelinks':
        sections.push(buildMutelinksSection(state, { isMod }));
        break;
      case 'breakingnews':
        sections.push(buildBreakingNewsSection(state, { isMod }));
        break;
      default:
        break;
    }
  }

  return sections;
}

function createElement(tag, className, text = null) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== null) {
    element.textContent = text;
  }
  return element;
}

/**
 * Build the tooltip DOM from the presentation model. All server-provided text
 * is inserted with `textContent`.
 */
export function buildModerationTooltipElement(sections) {
  const root = createElement('div', 'moderation-tooltip');
  root.tabIndex = 0;

  for (const section of sections) {
    const wrapper = createElement('section', 'mod-state-section');
    wrapper.dataset.mode = section.mode;

    const header = createElement('div', 'mod-state-header');
    const icon = createElement('span', 'mod-state-icon');
    icon.dataset.mode = section.mode;
    icon.setAttribute('aria-hidden', 'true');
    header.append(icon);
    header.append(createElement('span', 'mod-state-title', section.title));
    wrapper.append(header);

    if (section.detail) {
      wrapper.append(createElement('div', 'mod-state-detail', section.detail));
    }

    if (section.rows.length > 0) {
      const rules = createElement('div', 'mod-state-rules');
      for (const rule of section.rows) {
        const row = createElement('div', 'mod-state-rule');
        const main = createElement('div', 'mod-state-rule-main');
        main.append(createElement('span', 'mod-state-phrase', rule.phrase));
        if (rule.mega) {
          main.append(createElement('span', 'mod-state-mega', 'MEGA'));
        }
        const rowMeta = [rule.effect, rule.addedBy].filter(Boolean).join(' · ');
        if (rowMeta) {
          main.append(createElement('span', 'mod-state-rule-meta', rowMeta));
        }

        const countdown = createElement(
          'span',
          'mod-state-countdown',
          rule.countdown,
        );
        countdown.dataset.expiresAt = String(rule.expiresAt);
        row.append(main, countdown);
        rules.append(row);
      }
      wrapper.append(rules);
    }

    for (const line of section.meta) {
      wrapper.append(createElement('div', 'mod-state-meta', line));
    }

    root.append(wrapper);
  }

  return root;
}

/**
 * Turn a cached `MODACTION` event into the scrollback command line. Returns
 * `null` for unknown actions or malformed payloads.
 */
export function formatModAction(data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  switch (data.action) {
    case 'subonly': {
      const payload = asObject(data.payload);
      if (payload.mode !== 'on' && payload.mode !== 'off') {
        return null;
      }

      const isOn = payload.mode === 'on';
      const tier = isOn ? asNumber(payload.tier) || 1 : 0;
      const tierText = tier > 1 ? ` (Tier ${tier}+)` : '';
      const nick = asString(data.nick);
      return `Subscriber only mode${tierText} ${
        isOn ? 'enabled' : 'disabled'
      }${nick ? ` by ${nick}` : ''}.`;
    }
    default:
      return null;
  }
}
