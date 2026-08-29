import encodeUrl from '../encodeUrl';
import ChatMessage from './ChatMessage';
import MessageTypes from './MessageTypes';

/**
 * Return the highest priority flair with a color, if one exists. This is the
 * flair whose style should be applied to the user's username.
 */
export function usernameColorFlair(allFlairs, user) {
  return allFlairs
    .filter((flair) =>
      user.features.some((userFlair) => userFlair === flair.name),
    )
    .sort((a, b) => (a.priority - b.priority >= 0 ? 1 : -1))
    .find((f) => f.rainbowColor || f.color);
}

export default class ChatUserMessage extends ChatMessage {
  constructor(message, user, timestamp = null) {
    super(message, timestamp, MessageTypes.USER);
    this.user = user;
    this.id = null;
    this.isown = false;
    this.highlighted = false;
    this.historical = false;
    this.target = null;
    this.tag = null;
    this.title = '';
    this.slashme = false;
    this.mentioned = [];
    this.likes = 0;
    this.likedByUser = false;
    this.likeEl = null;
    this.hoverTarget = null;

    this.generateMessageHash();
  }

  html(chat = null) {
    const classes = [];
    const attr = {};

    if (this.id) {
      attr['data-id'] = this.id;
    }
    if (this.user && this.user.username) {
      classes.push(...this.user.features);
      attr['data-username'] = this.user.username;

      if (this.user.watching) {
        this.watching = this.user.watching;
        if (chat.user.equalWatching(this.user.watching)) {
          classes.push('watching-same');
        }
      }
    }
    if (this.mentioned && this.mentioned.length > 0) {
      attr['data-mentioned'] = this.mentioned.join(' ').toLowerCase();
    }

    if (this.isown) {
      classes.push('msg-own');
    }
    if (this.slashme) {
      classes.push('msg-me');
    }
    if (this.historical) {
      classes.push('msg-historical');
    }
    if (this.highlighted) {
      classes.push('msg-highlight');
    }
    if (this.continued && !this.target) {
      classes.push('msg-continue');
    }
    if (this.tag) {
      classes.push(`msg-tagged msg-tagged-${this.tag}`);
    }
    if (this.target) {
      classes.push(`msg-whisper`);
    }

    let ctrl = ': ';
    if (this.target) {
      ctrl = ' whispered: ';
    } else if (this.slashme || this.continued) {
      ctrl = '';
    }

    const colorFlair = usernameColorFlair(chat.flairs, this.user);
    const user = `${this.buildFeatures(this.user, chat)} <a title="${encodeUrl(
      this.title,
    )}" class="${['user', colorFlair?.name].filter(Boolean).join(' ')}">${
      this.user.displayName
    }</a>`;
    return this.wrap(
      `${this.buildTime()} ${user}<span class="ctrl">${ctrl}</span> ${this.buildMessageTxt(
        chat,
      )}`,
      classes,
      attr,
    );
  }

  buildFeatures(user, chat) {
    const features = (user.features || [])
      .filter((e) => chat.flairsMap.has(e))
      .map((e) => chat.flairsMap.get(e))
      .reduce(
        (str, e) =>
          `${str}<i data-flair="${e.name}" class="flair ${e.name}" title="${e.label}"></i> `,
        '',
      );
    return features !== '' ? `<span class="features">${features}</span>` : '';
  }

  setTag(newTag) {
    const previousTag = this.tag;
    if (previousTag) {
      this.ui.classList.remove('msg-tagged', `msg-tagged-${previousTag}`);
    }

    if (newTag) {
      this.ui.classList.add('msg-tagged', `msg-tagged-${newTag}`);
    }

    this.tag = newTag;
  }

  setTagTitle(newTitle) {
    this.ui.querySelector('.user').title = newTitle;
    this.title = newTitle;
  }

  highlight(shouldHighlight = true) {
    this.highlighted = shouldHighlight;
    this.ui.classList.toggle('msg-highlight', shouldHighlight);
  }

  /**
   * @param {boolean} isOwn
   */
  setOwnMessage(isOwn) {
    this.ui.classList.toggle('msg-own', isOwn);
    this.isown = isOwn;
  }

  /**
   * @param {boolean} isSlashMe
   */
  setSlashMe(isSlashMe) {
    this.ui.classList.toggle('msg-me', isSlashMe);
    const ctrl = this.ui.querySelector('.ctrl');
    if (ctrl && !this.target) {
      ctrl.textContent = this.slashme || this.continued ? '' : ': ';
    }

    this.slashme = isSlashMe;
  }

  /**
   * Set up the like hover target after message is rendered
   * @param {Function} onLikeClick - Callback for when like is clicked
   */
  setupLikeTarget(onLikeClick) {
    if (!this.ui || this.hoverTarget) {
      return;
    }

    this.hoverTarget = document.createElement('span');
    this.hoverTarget.className = 'like-hover-target';
    this.hoverTarget.addEventListener('click', () => {
      if (!this.user || !this.user.username) {
        console.error('Cannot like message: user or username is missing', this);
        return;
      }
      if (this.likedByUser) {
        return;
      }
      onLikeClick({
        messageNick: this.user.displayName,
        messageTimestamp: this.timestamp.valueOf(),
      });
    });
    this.ui.appendChild(this.hoverTarget);
  }

  /**
   * Add a like to this message
   * @param {boolean} isCurrentUser - Whether the current user liked it
   * @param {Function} onLikeClick - Callback for when like is clicked
   */
  addLike(isCurrentUser, onLikeClick) {
    this.likes += 1;

    if (isCurrentUser) {
      this.likedByUser = true;
    }

    // Create like element if it doesn't exist
    if (!this.likeEl) {
      this.likeEl = document.createElement('span');
      this.likeEl.className = 'msg-likes';
      this.likeEl.innerHTML = `
        <span class="heart-glow"></span>
        <span class="like-heart"></span>`;
      this.likeEl.style.cursor = 'pointer';
      this.likeEl.addEventListener('click', () => {
        if (!this.user || !this.user.username) {
          console.error(
            'Cannot like message: user or username is missing',
            this,
          );
          return;
        }
        // Prevent multiple likes from the same user
        if (this.likedByUser) {
          return;
        }
        onLikeClick({
          messageNick: this.user.displayName,
          messageTimestamp: this.timestamp.valueOf(),
        });
      });
      this.ui.appendChild(this.likeEl);
    }

    // Update like level
    this.updateLikeLevel();

    // Update liked state
    this.likeEl.classList.toggle('liked', this.likedByUser);

    // Create and animate floating ghost heart
    const ghost = document.createElement('span');
    ghost.className = 'heart-float-ghost';
    this.likeEl.appendChild(ghost);

    // Remove ghost after animation completes
    ghost.addEventListener('animationend', () => ghost.remove());
  }

  /**
   * Update the heart level based on like count
   * Levels will show different hearts (defined using like-heart CSS class)
   */
  updateLikeLevel() {
    if (!this.likeEl) {
      return;
    }

    let heartLevel = 0;
    if (this.likes >= 100) {
      heartLevel = 6;
    } else if (this.likes >= 50) {
      heartLevel = 5;
    } else if (this.likes >= 20) {
      heartLevel = 4;
    } else if (this.likes >= 10) {
      heartLevel = 3;
    } else if (this.likes >= 5) {
      heartLevel = 2;
    } else if (this.likes >= 1) {
      heartLevel = 1;
    }

    const heartEl = this.likeEl.querySelector('.like-heart');
    if (heartEl) {
      heartEl.dataset.level = heartLevel;
    }
  }
}
