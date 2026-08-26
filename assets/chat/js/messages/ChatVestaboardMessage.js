import ChatEventMessage from './ChatEventMessage';
import MessageTypes from './MessageTypes';
import { buildBoardElement } from './vestaboardCharacters';

// Header verb for the single-user announcements. LEAD is handled separately
// because its copy depends on whether the leader is a brand-new design or an
// existing one that a contribution pushed to #1.
const VESTABOARD_VERBS = {
  [MessageTypes.VESTABOARD_HOURLY]: 'is leading the Vestaboard',
  [MessageTypes.VESTABOARD_RESET]: 'won the Vestaboard auction',
};
const LEAD_NEW_DESIGN_VERB = 'took the lead with a new design';

// Call-to-action line shown above the auction link, tailored to each event.
const VESTABOARD_PROMPTS = {
  [MessageTypes.VESTABOARD_LEAD]:
    'Think you can top it? Fund a challenger or submit your own.',
  [MessageTypes.VESTABOARD_HOURLY]:
    "The auction's live. Fund a design to take the lead.",
  [MessageTypes.VESTABOARD_RESET]:
    'A new auction begins now! Submit a design to claim the board.',
};

// Shown when the hourly nudge fires with no submissions yet, so there is no
// leader to name (the board carries the "waiting for the first design" default).
const VESTABOARD_OPEN_HEADER = 'No designs on the Vestaboard yet';
const VESTABOARD_OPEN_PROMPT =
  'Be the first. Submit a design to claim the board.';

function formatUsd(cents) {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

// A right-clickable username element (matches `.msg-chat .user`, which the
// user-info context menu binds to), falling back to a bare anchor if the
// template is missing.
function userChip(name) {
  const el =
    document.querySelector('#user-template')?.content.cloneNode(true)
      .firstElementChild ?? document.createElement('a');
  el.classList.add('user');
  el.textContent = name;
  return el;
}

/**
 * One message class for all three Vestaboard announcements. Every card renders
 * the design's board and, when present, its top contributors; the header text
 * varies by `type` (and, for LEAD, by whether the design is new).
 */
export default class ChatVestaboardMessage extends ChatEventMessage {
  constructor(
    type,
    submitter,
    total,
    designId,
    characters,
    artist,
    contributors,
    isNewDesign,
    timestamp,
    expirationTimestamp,
    uuid,
  ) {
    super('', timestamp, uuid);
    this.type = type;
    this.submitter = submitter;
    this.total = total;
    this.designId = designId;
    this.characters = characters;
    this.artist = artist;
    this.contributors = Array.isArray(contributors) ? contributors : [];
    this.isNewDesign = isNewDesign;
    this.expirationTimestamp = expirationTimestamp;

    this.generateMessageHash();
  }

  get hasActions() {
    return false;
  }

  html(chat = null) {
    const eventTemplate = super.html(chat);

    // An hourly nudge with no design (nobody has submitted yet) names no leader.
    const isOpenHourly =
      this.type === MessageTypes.VESTABOARD_HOURLY && !this.submitter;
    const info = eventTemplate.querySelector('.event-info');
    const amount = formatUsd(this.total);

    if (isOpenHourly) {
      info.textContent = VESTABOARD_OPEN_HEADER;
    } else if (
      this.type === MessageTypes.VESTABOARD_LEAD &&
      !this.isNewDesign
    ) {
      // A contribution pushed an existing design to #1: credit the backer and
      // name whose design they lifted (both right-clickable).
      info.append(
        userChip(this.submitter),
        ' funded ',
        userChip(this.artist),
        `'s design into the lead · ${amount}`,
      );
    } else {
      const verb =
        this.type === MessageTypes.VESTABOARD_LEAD
          ? LEAD_NEW_DESIGN_VERB
          : (VESTABOARD_VERBS[this.type] ?? 'is on the Vestaboard');
      info.append(userChip(this.submitter), ` ${verb} · ${amount}`);
    }

    eventTemplate.classList.add('msg-vestaboard');
    eventTemplate.querySelector('.event-icon').classList.add('vestaboard');

    // The base event template drops `.event-bottom` for empty messages, so
    // build the body (board + contributors + call-to-action) explicitly.
    const bottom = document.createElement('div');
    bottom.className = 'event-bottom';

    const board = buildBoardElement(this.characters);
    if (board) {
      bottom.append(board);
    }

    if (this.contributors.length > 0) {
      bottom.append(this.buildContributors());
    }

    const prompt = document.createElement('span');
    prompt.className = 'event-bottom-text';
    prompt.textContent = isOpenHourly
      ? VESTABOARD_OPEN_PROMPT
      : (VESTABOARD_PROMPTS[this.type] ?? 'Fund a design or submit your own.');
    bottom.append(prompt);

    /** @type HTMLAnchorElement */
    const link = document
      .querySelector('#vestaboard-link-template')
      ?.content.cloneNode(true).firstElementChild;
    if (link) {
      link.href = `${chat?.config?.dggOrigin ?? ''}/vestaboard`;
      bottom.append(link);
    }

    eventTemplate.querySelector('.event-wrapper').append(bottom);

    const classes = Array.from(eventTemplate.classList);
    const attributes = eventTemplate
      .getAttributeNames()
      .reduce((object, attributeName) => {
        if (attributeName === 'class') {
          return object;
        }
        return {
          ...object,
          [attributeName]: eventTemplate.getAttribute(attributeName),
        };
      }, {});

    return this.wrap(eventTemplate.innerHTML, classes, attributes);
  }

  // "Top contributors" line: each backer as a right-clickable @user chip plus
  // their total, separated by dots.
  buildContributors() {
    const wrap = document.createElement('div');
    wrap.className = 'event-bottom-contributors';

    const label = document.createElement('span');
    label.className = 'event-bottom-contributors__label';
    label.textContent = 'Top contributors';
    wrap.append(label);

    const list = document.createElement('span');
    list.className = 'event-bottom-contributors__list';
    this.contributors.forEach((contributor, index) => {
      if (index > 0) {
        list.append(' · ');
      }
      list.append(
        '@',
        userChip(contributor.name),
        ` ${formatUsd(contributor.amountCents)}`,
      );
    });
    wrap.append(list);

    return wrap;
  }
}
