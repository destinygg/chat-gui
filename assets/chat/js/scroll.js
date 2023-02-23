import $ from 'jquery';
// eslint-disable-next-line import/no-unresolved
import 'overlayscrollbars/overlayscrollbars.css';
import { OverlayScrollbars } from 'overlayscrollbars';

const isTouchDevice =
  'ontouchstart' in window || // works on most browsers
  navigator.maxTouchPoints; // works on IE10/11 and Surface

class ChatScrollPlugin {
  constructor(viewport, target = undefined, win = undefined) {
    this.viewportEl = $(viewport).get(0);
    if (!this.viewportEl) return;

    this.previousPosition = 0;
    this.previousDirection = 'same';

    const targetEl = $(target) ?? $(viewport);

    this.scroller = OverlayScrollbars(
      {
        target: targetEl.get(0),
        elements: {
          viewport: this.viewportEl,
        },
      },
      {
        overflow: {
          x: 'hidden',
          y: 'scroll',
        },
        scrollbars: {
          theme: 'dgg-scroller-theme',
          autoHide: isTouchDevice ? 'never' : 'move',
          autoHideDelay: 1000,
        },
      }
    );

    if (targetEl.find('.chat-scroll-notify').length > 0) {
      this.scroller.on('scroll', () => {
        const direction = this.scrollDirection;
        if (direction !== this.previousDirection) {
          win.waspinned = this.pinned;
          targetEl.toggleClass('chat-unpinned', !win.waspinned);
        }
        this.previousDirection = direction;
        this.previousPosition = this.viewportEl.scrollTop;
      });

      targetEl.on('click', '.chat-scroll-notify', () => {
        this.scrollBottom();
        return false;
      });
    }
  }

  get scrollDirection() {
    if (
      this.viewportEl.scrollHeight -
        this.viewportEl.clientHeight -
        this.viewportEl.scrollTop <
      30
    ) {
      return 'pinned';
    }
    return this.viewportEl.scrollTop > this.previousPosition ? 'down' : 'up';
  }

  get pinned() {
    // 30 is used to allow the scrollbar to be just offset, but still count as scrolled to bottom
    const { scrollTop, scrollHeight, clientHeight } = this.viewportEl;
    return scrollTop >= scrollHeight - clientHeight - 30;
  }

  scrollBottom() {
    this.viewportEl.scrollTo(0, this.viewportEl.scrollHeight);
  }

  reset() {
    this.scroller.update();
  }

  destroy() {
    this.scroller.destroy();
  }
}

export default ChatScrollPlugin;
