import $ from 'jquery';
import { debounce } from 'throttle-debounce';
// eslint-disable-next-line import/no-unresolved
import 'overlayscrollbars/overlayscrollbars.css';
import { OverlayScrollbars } from 'overlayscrollbars';

const isTouchDevice =
  'ontouchstart' in window || // works on most browsers
  navigator.maxTouchPoints; // works on IE10/11 and Surface

class ChatScrollPlugin {
  constructor(viewport, target = undefined) {
    this.viewport = $(viewport).get(0);
    if (!this.viewport) return;
    this.target = $(target) ?? $(viewport);

    this.scroller = OverlayScrollbars(
      {
        target: this.target.get(0),
        elements: {
          viewport: this.viewport,
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
      },
    );

    if (this.target.find('.chat-scroll-notify').length > 0) {
      this.wasPinned = true;
      this.setupResize();

      this.scroller.on('scroll', () => {
        this.wasPinned = this.pinned;
        this.target.toggleClass('chat-unpinned', !this.wasPinned);
      });

      this.target.on('click', '.chat-scroll-notify', () => {
        this.scrollBottom();
        return false;
      });
    }
  }

  setupResize() {
    let resizing = false;
    let pinnedBeforeResize = this.wasPinned;
    const onResizeComplete = debounce(
      100,
      () => {
        resizing = false;
        this.update(pinnedBeforeResize);
      },
      { atBegin: false },
    );
    this.resizeObserver = new ResizeObserver(() => {
      if (!resizing) {
        resizing = true;
        pinnedBeforeResize = this.pinned;
      }
      onResizeComplete();
    });
    this.resizeObserver.observe(this.viewport);
  }

  get pinned() {
    // 30 is used to allow the scrollbar to be just offset, but still count as scrolled to bottom
    const { scrollTop, scrollHeight, clientHeight } = this.viewport;
    return scrollTop >= scrollHeight - clientHeight - 30;
  }

  scrollBottom() {
    this.viewport.scrollTo(0, this.viewport.scrollHeight);
  }

  update(forcePin) {
    if (this.wasPinned || forcePin) this.scrollBottom();
  }

  reset() {
    this.scroller.update();
  }

  destroy() {
    this.scroller.destroy();
  }
}

export default ChatScrollPlugin;
