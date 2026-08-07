import $ from 'jquery';
import moment from 'moment';
import { debounce } from 'throttle-debounce';
import ChatMenu from './ChatMenu';
import ChatUser from '../user';
import { DATE_FORMATS } from '../const';

// Unread counts past this render as "99+".
const MAX_DISPLAY_COUNT = 99;
function formatCount(n) {
  return n > MAX_DISPLAY_COUNT ? `${MAX_DISPLAY_COUNT}+` : String(n);
}

/**
 * The conversations panel: all of the user's DM threads, newest first,
 * cursor-paginated with a "Load more" button and searchable by username.
 *
 * Data lives in `chat.whispers` (a Map keyed by lowercased username) — the
 * single store the rest of chat.js reads for window interop. This panel only
 * owns the *order* of what it shows: `conversations` and `searchResults` are
 * arrays of keys into that Map, so search mode never disturbs the normal list.
 * The unread badge is a scalar seeded from a dedicated endpoint, never summed
 * from the (now partial) list.
 */
export default class ChatWhisperUsers extends ChatMenu {
  constructor(ui, btn, chat) {
    super(ui, btn, chat);

    this.unread = 0;
    this.prevUnread = 0;

    this.conversations = [];
    this.searchResults = [];
    this.cursor = null;
    this.searchCursor = null;
    this.more = false;
    this.searchMore = false;
    this.loading = false;
    this.loaded = false;
    this.searchterm = '';
    this.searchSeq = 0;

    this.empty = $(`<span class="empty">No conversations yet</span>`);
    this.notif = $(`<span id="chat-whisper-unread-indicator"></span>`);
    this.btn.append(this.notif);

    this.listEl = ui.find('ul:first');
    this.loadMoreEl = ui.find('.whisper-load-more');
    this.searchinput = ui.find('#chat-whisper-search .form-control:first');

    this.listEl.on('click', '.conversation', (e) =>
      chat.openConversation(e.currentTarget.getAttribute('data-username')),
    );
    this.loadMoreEl.on('click', 'button', () => this.loadMore());
    this.searchinput.on(
      'keyup',
      debounce(
        250,
        () => {
          this.searchterm = this.searchinput.val().toString().trim();
          this.onSearchChange();
        },
        { atBegin: false },
      ),
    );
  }

  show() {
    super.show();
    if (this.chat.isDesktop) {
      this.searchinput.focus();
    }
    if (!this.loaded && !this.loading) {
      this.loadFirstPage();
    }
  }

  redraw() {
    this.updateNotification();
    if (this.visible) {
      this.renderList();
    }
    super.redraw();
  }

  // --- unread badge (scalar) --------------------------------------------

  updateNotification() {
    if (this.prevUnread < this.unread) {
      this.btn.addClass('ping');
      setTimeout(() => this.btn.removeClass('ping'), 2000);
    }
    this.prevUnread = this.unread;
    const shown = formatCount(this.unread);
    this.notif.text(shown);
    this.notif.toggle(this.unread > 0);
    try {
      // Mirror the unread total into the parent window title. The strip regex
      // allows a trailing "+" so a capped "(99+) " prefix is replaced, not
      // stacked, on the next update.
      const t = window.parent.document.title.replace(/\([0-9]+\+?\) /, '');
      window.parent.document.title =
        this.unread > 0 ? `(${shown}) ${t}` : `${t}`;
    } catch {} // eslint-disable-line no-empty
  }

  seedUnread(count) {
    this.unread = Math.max(0, count | 0);
    this.updateNotification();
  }

  incrementUnread(n = 1) {
    this.unread = Math.max(0, this.unread + n);
    this.updateNotification();
  }

  decrementUnread(n = 1) {
    this.unread = Math.max(0, this.unread - n);
    this.updateNotification();
  }

  // --- fetching / pagination --------------------------------------------

  buildUrl(search, cursor) {
    const base = `${this.chat.config.api.base}/api/messages/conversations`;
    const params = new URLSearchParams();
    if (cursor) {
      params.set('last-timestamp', cursor.timestamp);
      params.set('last-id', cursor.id);
    }
    if (search) {
      params.set('search', search);
    }
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  async fetchPage(search, cursor) {
    const empty = { results: [], more: false, nextPageOffset: null };
    this.loading = true;
    this.updateLoadMore();
    try {
      const res = await fetch(this.buildUrl(search, cursor), {
        credentials: 'include',
      });
      // Unwrap the JsonResponse envelope: { success, data: { results, ... } }.
      const { data } = await res.json();
      return data && Array.isArray(data.results) ? data : empty;
    } catch {
      return empty;
    } finally {
      this.loading = false;
    }
  }

  /**
   * Fold a page of DTOs into the Map and return their keys in order. For a
   * conversation already known locally, keep the local `unread`/`open` (which
   * may be ahead of the server) and only refresh the preview fields.
   */
  upsertResults(results) {
    return results.map((dto) => {
      const key = dto.username.toLowerCase();
      const existing = this.chat.whispers.get(key);
      const conv = existing || { open: false, unread: dto.unread };
      conv.id = dto.userId;
      conv.nick = dto.username;
      conv.username = key;
      conv.lastMessage = dto.lastMessage;
      conv.timestamp = dto.timestamp;
      conv.lastMessageFromMe = dto.lastMessageFromMe;
      this.chat.whispers.set(key, conv);
      return key;
    });
  }

  async loadFirstPage() {
    const data = await this.fetchPage('', null);
    this.conversations = this.upsertResults(data.results);
    this.cursor = data.nextPageOffset;
    this.more = data.more;
    this.loaded = true;
    this.renderList();
  }

  loadMore() {
    if (this.loading) {
      return;
    }
    if (this.searchterm) {
      this.loadNextSearchPage();
    } else {
      this.loadNextPage();
    }
  }

  async loadNextPage() {
    if (!this.more || !this.cursor) {
      return;
    }
    const data = await this.fetchPage('', this.cursor);
    const keys = this.upsertResults(data.results);
    this.conversations.push(...keys);
    this.cursor = data.nextPageOffset;
    this.more = data.more;
    this.appendRows(keys);
    this.updateLoadMore();
  }

  async loadNextSearchPage() {
    if (!this.searchMore || !this.searchCursor) {
      return;
    }
    const term = this.searchterm;
    const data = await this.fetchPage(term, this.searchCursor);
    if (term !== this.searchterm) {
      return;
    }
    const keys = this.upsertResults(data.results);
    this.searchResults.push(...keys);
    this.searchCursor = data.nextPageOffset;
    this.searchMore = data.more;
    this.appendRows(keys);
    this.updateLoadMore();
  }

  // --- search -----------------------------------------------------------

  onSearchChange() {
    if (this.searchterm === '') {
      this.searchResults = [];
      this.searchCursor = null;
      this.searchMore = false;
      this.renderList();
      return;
    }
    this.runSearch();
  }

  async runSearch() {
    const term = this.searchterm;
    const seq = (this.searchSeq += 1);
    const data = await this.fetchPage(term, null);
    // Ignore a response the user has already typed past.
    if (seq !== this.searchSeq) {
      return;
    }
    this.searchResults = this.upsertResults(data.results);
    this.searchCursor = data.nextPageOffset;
    this.searchMore = data.more;
    this.renderList();
  }

  // --- rendering --------------------------------------------------------

  activeKeys() {
    return this.searchterm ? this.searchResults : this.conversations;
  }

  activeMore() {
    return this.searchterm ? this.searchMore : this.more;
  }

  renderList() {
    if (!this.visible) {
      return;
    }
    this.listEl.empty();
    const keys = this.activeKeys();
    if (keys.length === 0) {
      this.listEl.append(this.empty);
    } else {
      keys.forEach((key) => this.listEl.append(this.buildRow(key)));
    }
    this.updateLoadMore();
  }

  appendRows(keys) {
    keys.forEach((key) => this.listEl.append(this.buildRow(key)));
  }

  updateLoadMore() {
    const button = this.loadMoreEl.find('button');
    if (this.activeMore()) {
      this.loadMoreEl.show();
      button.prop('disabled', this.loading);
      button.text(this.loading ? 'Loading…' : 'Load more');
    } else {
      this.loadMoreEl.hide();
    }
  }

  buildRow(key) {
    const conv = this.chat.whispers.get(key);
    if (!conv) {
      return $();
    }
    const user = this.chat.users.get(key) || new ChatUser(conv.nick);
    const unread = conv.unread || 0;

    const row = $('<li class="conversation"></li>')
      .toggleClass('conversation--unread', unread > 0)
      .attr('data-username', user.username);

    // A dot rather than a coloured name signals unread (blue) vs read (grey).
    $('<span class="conversation__indicator"></span>').appendTo(row);

    const body = $('<div class="conversation__body"></div>').appendTo(row);
    const header = $('<div class="conversation__header"></div>').appendTo(body);
    // .text() throughout: the preview is arbitrary user-authored message text.
    $('<span class="conversation__user"></span>')
      .text(user.displayName)
      .appendTo(header);

    const meta = $('<span class="conversation__meta"></span>').appendTo(header);
    // New-message count badge, to the left of the last-activity time.
    if (unread > 0) {
      $('<span class="conversation__count"></span>')
        .text(`${formatCount(unread)} new`)
        .appendTo(meta);
    }
    if (conv.timestamp != null) {
      const when = moment(conv.timestamp);
      $('<time class="conversation__time"></time>')
        .attr('datetime', when.toISOString())
        .attr('title', when.format(DATE_FORMATS.FULL))
        .text(when.fromNow())
        .appendTo(meta);
    }

    const preview =
      (conv.lastMessageFromMe ? 'You: ' : '') + (conv.lastMessage || '');
    $('<div class="conversation__preview"></div>').text(preview).appendTo(body);

    return row;
  }

  /**
   * Move a conversation to the top of the normal list (dedupe first). Called
   * when a whisper is sent or received so recent threads float up.
   */
  bumpConversation(key) {
    const idx = this.conversations.indexOf(key);
    if (idx !== -1) {
      this.conversations.splice(idx, 1);
    }
    this.conversations.unshift(key);
    if (this.visible && this.searchterm === '') {
      this.renderList();
    }
  }

  /**
   * Drop the loaded list so the next open refetches from scratch. Used on
   * reconnect, where the badge is separately reseeded from the endpoint.
   */
  invalidate() {
    this.loaded = false;
    this.conversations = [];
    this.cursor = null;
    this.more = false;
    this.searchterm = '';
    this.searchResults = [];
    this.searchCursor = null;
    this.searchMore = false;
    if (this.searchinput) {
      this.searchinput.val('');
    }
    if (this.visible) {
      this.loadFirstPage();
    }
  }
}
