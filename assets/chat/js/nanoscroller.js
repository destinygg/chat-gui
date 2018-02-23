/* global $, window, document */

/*! nanoScrollerJS - v0.8.7 - 2015
* http://jamesflorentino.github.com/nanoScrollerJS/
* Copyright (c) 2015 James Florentino; Licensed MIT */

// MODIFIED FOR DGG CHAT. Plugin has become unsupported.

"use strict";

let BROWSER_IS_IE7, browserScrollbarWidth, cAF, rAF, getBrowserScrollbarWidth, hasTransform, isFFWithBuggyScrollbar,
    transform, _elementStyle, _prefixStyle, _vendor, passive;

const defaults = {
    /**
     a classname for the pane element.
     */
    paneClass: 'nano-pane',

    /**
     a classname for the slider element.
     */
    sliderClass: 'nano-slider',

    /**
     a classname for the content element.
     */
    contentClass: 'nano-content',

    /**
     a setting to enable native scrolling in iOS devices.
     */
    iOSNativeScrolling: false,

    /**
     a setting to prevent the rest of the page being
     scrolled when user scrolls the `.content` element.
     */
    preventPageScrolling: false,

    /**
     a setting to disable binding to the resize event.
     */
    disableResize: false,

    /**
     a setting to make the scrollbar always visible.
     */
    alwaysVisible: false,

    /**
     a default timeout for the `flash()` method.
     */
    flashDelay: 1500,

    /**
     a minimum height for the `.slider` element.
     */
    sliderMinHeight: 20,

    /**
     a maximum height for the `.slider` element.
     */
    sliderMaxHeight: null,

    /**
     an alternate document context.
     */
    documentContext: null,

    /**
     an alternate window context.
     */
    windowContext: null
};

const SCROLL = 'scroll',
    MOUSEDOWN = 'mousedown',
    MOUSEENTER = 'mouseenter',
    MOUSEMOVE = 'mousemove',
    MOUSEWHEEL = 'mousewheel',
    MOUSEUP = 'mouseup',
    RESIZE = 'resize',
    DRAG = 'drag',
    ENTER = 'enter',
    UP = 'up',
    PANEDOWN = 'panedown',
    DOMSCROLL = 'DOMMouseScroll',
    DOWN = 'down',
    WHEEL = 'wheel',
    TOUCHMOVE = 'touchmove';

BROWSER_IS_IE7 = window.navigator.appName === 'Microsoft Internet Explorer' && /msie 7./i.test(window.navigator.appVersion) && window.ActiveXObject;
browserScrollbarWidth = -1;
passive = {passive: true};
rAF = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
cAF = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

_elementStyle = document.createElement('div').style;
_vendor = (function () {
    let i, transform, vendor, vendors, _i, _len;
    vendors = ['t', 'webkitT', 'MozT', 'msT', 'OT'];
    for (i = _i = 0, _len = vendors.length; _i < _len; i = ++_i) {
        vendor = vendors[i];
        transform = vendors[i] + 'ransform';
        if (transform in _elementStyle) {
            return vendors[i].substr(0, vendors[i].length - 1);
        }
    }
    return false;
})();
_prefixStyle = function (style) {
    if (_vendor === false)
        return false;
    if (_vendor === '')
        return style;
    return _vendor + style.charAt(0).toUpperCase() + style.substr(1);
};
transform = _prefixStyle('transform');
hasTransform = transform !== false;

/**
 Returns browser's native scrollbar width
 */
getBrowserScrollbarWidth = function () {
    let outer, outerStyle, scrollbarWidth;
    outer = document.createElement('div');
    outerStyle = outer.style;
    outerStyle.position = 'absolute';
    outerStyle.width = '100px';
    outerStyle.height = '100px';
    outerStyle.overflow = SCROLL;
    outerStyle.top = '-9999px';
    document.body.appendChild(outer);
    scrollbarWidth = outer.offsetWidth - outer.clientWidth;
    document.body.removeChild(outer);
    return scrollbarWidth;
};
isFFWithBuggyScrollbar = function () {
    let isOSXFF, ua, version;
    ua = window.navigator.userAgent;
    isOSXFF = /(?=.+Mac OS X)(?=.+Firefox)/.test(ua);
    if (!isOSXFF) {
        return false;
    }
    version = /Firefox\/\d{2}\./.exec(ua);
    if (version) {
        version = version[0].replace(/\D+/g, '');
    }
    return isOSXFF && +version > 23;
};

function NanoScroll(el, options) {
    this.el = el;
    this.options = $.extend({}, defaults, options);
    browserScrollbarWidth = !browserScrollbarWidth || browserScrollbarWidth<0 ? getBrowserScrollbarWidth() : browserScrollbarWidth;
    this.$el = $(this.el);
    this.doc = $(this.options.documentContext || document);
    this.win = $(this.options.windowContext || window);
    this.body = this.doc.find('body');
    this.$content = this.$el.children(`.${this.options.contentClass}`);
    this.$content.attr('tabindex', this.options.tabIndex || 0);
    this.content = this.$content[0];
    this.previousPosition = 0;
    if (this.options.iOSNativeScrolling && this.el.style.WebkitOverflowScrolling != null) {
        this.nativeScrolling();
    } else {
        this.generate();
    }
    this.createEvents();
    this.addEvents();
    this.reset();
}

NanoScroll.prototype.nativeScrolling = function () {
    this.$content.css({WebkitOverflowScrolling: 'touch'});
    this.iOSNativeScrolling = true;
    this.isActive = true;
};

NanoScroll.prototype.updateScrollValues = function () {
    let content = this.content, direction;
    this.maxScrollTop = content.scrollHeight - content.clientHeight;
    this.prevScrollTop = this.contentScrollTop || 0;
    this.contentScrollTop = content.scrollTop;
    direction = this.contentScrollTop > this.previousPosition ? "down" : this.contentScrollTop < this.previousPosition ? "up" : "same";
    this.previousPosition = this.contentScrollTop;
    if (direction !== "same") {
        this.$el.trigger('update', {
            position: this.contentScrollTop,
            maximum: this.maxScrollTop,
            direction: direction
        });
    }
    if (!this.iOSNativeScrolling) {
        this.maxSliderTop = this.paneHeight - this.sliderHeight;
        this.sliderTop = this.maxScrollTop === 0 ? 0 : this.contentScrollTop * this.maxSliderTop / this.maxScrollTop;
    }
};

NanoScroll.prototype.setOnScrollStyles = function () {
    let cssValue;
    if (hasTransform) {
        cssValue = {};
        cssValue[transform] = `translate(0, ${this.sliderTop}px)`;
    } else {
        cssValue = {top: this.sliderTop};
    }
    if (rAF) {
        if (cAF && this.scrollRAF) {
            cAF(this.scrollRAF);
        }
        this.scrollRAF = rAF(() => {
            this.scrollRAF = null;
            return this.slider.css(cssValue);
        });
    } else {
        this.slider.css(cssValue);
    }
};

NanoScroll.prototype.createEvents = function () {
    this.events = {
        down: e => {
            this.isBeingDragged = true;
            this.offsetY = e.pageY - this.slider.offset().top;
            if (!this.slider.is(e.target)) {
                this.offsetY = 0;
            }
            this.pane.addClass('active');
            this.body.bind(MOUSEENTER, this.events[ENTER]);
            this.doc.bind(MOUSEMOVE, this.events[DRAG])
                    .bind(MOUSEUP, this.events[UP]);
            return false;
        },
        drag: e => {
            this.sliderY = e.pageY - this.$el.offset().top - this.paneTop - (this.offsetY || this.sliderHeight * 0.5);
            this.scroll();
            if (this.contentScrollTop >= this.maxScrollTop && this.prevScrollTop !== this.maxScrollTop) {
                this.$el.trigger('scrollend');
            } else if (this.contentScrollTop === 0 && this.prevScrollTop !== 0) {
                this.$el.trigger('scrolltop');
            }
            return false;
        },
        up: () => {
            this.isBeingDragged = false;
            this.pane.removeClass('active');
            this.body.unbind(MOUSEENTER, this.events[ENTER]);
            this.doc.unbind(MOUSEMOVE, this.events[DRAG])
                    .unbind(MOUSEUP, this.events[UP]);
            return false;
        },
        resize: () => {
            this.reset();
        },
        panedown: e => {
            this.sliderY = (e.offsetY || e.originalEvent.layerY) - (this.sliderHeight * 0.5);
            this.scroll();
            this.events.down(e);
            return false;
        },
        scroll: e => {
            this.updateScrollValues();
            if (this.isBeingDragged) {
                return;
            }
            if (!this.iOSNativeScrolling) {
                this.sliderY = this.sliderTop;
                this.setOnScrollStyles();
            }
            if (e == null) {
                return;
            }
            if (this.contentScrollTop >= this.maxScrollTop) {
                if (this.prevScrollTop !== this.maxScrollTop) {
                    this.$el.trigger('scrollend');
                }
            } else if (this.contentScrollTop === 0) {
                if (this.prevScrollTop !== 0) {
                    this.$el.trigger('scrolltop');
                }
            }
        },
        wheel: e => {
            let delta;
            if (e == null) {
                return;
            }
            delta = e['delta'] || e.wheelDelta || (e.originalEvent && e.originalEvent.wheelDelta) || -e.detail || (e.originalEvent && -e.originalEvent.detail);
            if (delta) {
                this.sliderY += -delta / 3;
            }
            this.scroll();
            return false;
        },
        enter: e => {
            let _ref;
            if (!this.isBeingDragged) {
                return;
            }
            if ((e.buttons || e.which) !== 1) {
                return (_ref = this.events)[UP].apply(_ref, arguments);
            }
        }
    };
};

NanoScroll.prototype.addEvents = function () {
    let events = this.events;
    this.removeEvents();
    if (!this.options.disableResize) {
        this.win.bind(RESIZE, events[RESIZE]);
    }
    if (!this.iOSNativeScrolling) {
        this.slider.bind(MOUSEDOWN, events[DOWN]);
        this.pane.bind(MOUSEDOWN, events[PANEDOWN]);
        this.pane.bind(MOUSEWHEEL, events[WHEEL]);
        this.pane.bind(DOMSCROLL, events[WHEEL]);
    }
    this.$content.bind(TOUCHMOVE, events[SCROLL]);
    this.$content.bind(MOUSEWHEEL, events[SCROLL]);
    this.$content.bind(DOMSCROLL, events[SCROLL]);
    this.$content.bind(SCROLL, events[SCROLL]);
};

NanoScroll.prototype.removeEvents = function () {
    let events = this.events, c = this.$content.get(0);
    this.win.unbind(RESIZE, events[RESIZE]);
    if (!this.iOSNativeScrolling) {
        this.slider.unbind();
        this.pane.unbind();
    }
    this.$content.unbind(TOUCHMOVE, events[SCROLL]);
    this.$content.unbind(MOUSEWHEEL, events[SCROLL]);
    this.$content.unbind(DOMSCROLL, events[SCROLL]);
    this.$content.unbind(SCROLL, events[SCROLL]);
};

NanoScroll.prototype.generate = function () {
    let cssRule, currentPadding, options, pane, paneClass, sliderClass;
    options = this.options;
    paneClass = options.paneClass;
    sliderClass = options.sliderClass;
    if (!(pane = this.$el.children(`.${paneClass}`)).length && !pane.children(`.${sliderClass}`).length) {
        this.$el.append(`<div class="${paneClass}"><div class="${sliderClass}" /></div>`);
    }
    this.pane = this.$el.children(`.${paneClass}`);
    this.slider = this.pane.find(`.${sliderClass}`);
    if (browserScrollbarWidth === 0 && isFFWithBuggyScrollbar()) {
        currentPadding = window.getComputedStyle(this.content, null).getPropertyValue('padding-right').replace(/[^0-9.]+/g, '');
        cssRule = {
            right: -14,
            paddingRight: +currentPadding + 14
        };
    } else if (browserScrollbarWidth) {
        cssRule = {right: -browserScrollbarWidth};
        this.$el.addClass('has-scrollbar');
    }
    if (cssRule != null) {
        this.$content.css(cssRule);
    }
    return this;
};

NanoScroll.prototype.restore = function () {
    this.stopped = false;
    if (!this.iOSNativeScrolling) {
        this.pane.show();
    }
    this.addEvents();
};

NanoScroll.prototype.reset = function () {
    let content, contentHeight, contentPosition, contentStyle, contentStyleOverflowY, paneBottom, paneHeight,
        paneOuterHeight, paneTop, parentMaxHeight, right, sliderHeight;
    if (this.iOSNativeScrolling) {
        this.contentHeight = this.content.scrollHeight;
        return;
    }
    if (!this.$el.find(`.${this.options.paneClass}`).length) {
        this.generate().stop();
    }
    if (this.stopped) {
        this.restore();
    }
    content = this.content;
    contentStyle = content.style;
    contentStyleOverflowY = contentStyle.overflowY;
    if (BROWSER_IS_IE7) {
        this.$content.css({height: this.$content.height()});
    }
    contentHeight = content.scrollHeight + browserScrollbarWidth;
    parentMaxHeight = parseInt(this.$el.css('max-height'), 10);
    if (parentMaxHeight > 0) {
        this.$el.height("");
        this.$el.height(content.scrollHeight > parentMaxHeight ? parentMaxHeight : content.scrollHeight);
    }
    paneHeight = this.pane.outerHeight(false);
    paneTop = parseInt(this.pane.css('top'), 10);
    paneBottom = parseInt(this.pane.css('bottom'), 10);
    paneOuterHeight = paneHeight + paneTop + paneBottom;
    sliderHeight = Math.round(paneOuterHeight / contentHeight * paneHeight);
    if (sliderHeight < this.options.sliderMinHeight) {
        sliderHeight = this.options.sliderMinHeight;
    } else if ((this.options.sliderMaxHeight != null) && sliderHeight > this.options.sliderMaxHeight) {
        sliderHeight = this.options.sliderMaxHeight;
    }
    if (contentStyleOverflowY === SCROLL && contentStyle.overflowX !== SCROLL) {
        sliderHeight = sliderHeight + browserScrollbarWidth;
    }
    this.maxSliderTop = paneOuterHeight - sliderHeight;
    this.contentHeight = contentHeight;
    this.paneHeight = paneHeight;
    this.sliderHeight = sliderHeight;
    this.paneTop = paneTop;
    this.slider.height(sliderHeight);
    this.events.scroll();
    this.pane.show();
    this.isActive = true;
    if ((content.scrollHeight === content.clientHeight) || (this.pane.outerHeight(true) >= content.scrollHeight && contentStyleOverflowY !== SCROLL)) {
        this.pane.hide();
        this.isActive = false;
    } else if (this.el.clientHeight === content.scrollHeight && contentStyleOverflowY === SCROLL) {
        this.slider.hide();
    } else {
        this.slider.show();
    }
    this.pane.css({
        opacity: (this.options.alwaysVisible ? 1 : ''),
        visibility: (this.options.alwaysVisible ? 'visible' : '')
    });
    contentPosition = this.$content.css('position');
    if (contentPosition === 'static' || contentPosition === 'relative') {
        right = parseInt(this.$content.css('right'), 10);
        if (right) {
            this.$content.css({
                right: '',
                marginRight: right
            });
        }
    }
    return this;
};

NanoScroll.prototype.scroll = function () {
    if (!this.isActive) return;
    this.sliderY = Math.max(0, this.sliderY);
    this.sliderY = Math.min(this.maxSliderTop, this.sliderY);
    this.$content.scrollTop(this.maxScrollTop * this.sliderY / this.maxSliderTop);
    if (!this.iOSNativeScrolling) {
        this.updateScrollValues();
        this.setOnScrollStyles();
    }
    return this;
};

NanoScroll.prototype.scrollBottom = function (offsetY) {
    if (!this.isActive) return;
    this.$content.scrollTop(this.contentHeight - this.$content.height() - offsetY).trigger(MOUSEWHEEL);
    this.stop().restore();
    return this;
};

NanoScroll.prototype.scrollTop = function (offsetY) {
    if (!this.isActive) return;
    this.$content.scrollTop(+offsetY).trigger(MOUSEWHEEL);
    this.stop().restore();
    return this;
};

NanoScroll.prototype.scrollTo = function (node) {
    if (!this.isActive) return;
    this.scrollTop(this.$el.find(node).get(0).offsetTop);
    return this;
};

NanoScroll.prototype.stop = function () {
    if (cAF && this.scrollRAF) {
        cAF(this.scrollRAF);
        this.scrollRAF = null;
    }
    this.stopped = true;
    this.removeEvents();
    if (!this.iOSNativeScrolling) {
        this.pane.hide();
    }
    return this;
};

NanoScroll.prototype.destroy = function () {
    if (!this.stopped) {
        this.stop();
    }
    if (!this.iOSNativeScrolling && this.pane.length) {
        this.pane.remove();
    }
    if (BROWSER_IS_IE7) {
        this.$content.height('');
    }
    this.$content.removeAttr('tabindex');
    if (this.$el.hasClass('has-scrollbar')) {
        this.$el.removeClass('has-scrollbar');
        this.$content.css({right: ''});
    }
    return this;
};

export {NanoScroll}