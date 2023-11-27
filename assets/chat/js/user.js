import UserFeature from './features';

/**
 * @typedef {Object} User
 * @property {Number} id
 * @property {string} nick
 * @property {string} createdDate
 * @property {string[]} features
 */

class ChatUser {
  /**
   * User's immutable ID.
   * @type {?Number}
   */
  id = null;

  /**
   * User's name that is displayed in chat (i.e. with case preserved).
   * @type {string}
   */
  displayName = '';

  /**
   * User's normalized (lowercase) name.
   * @type {string}
   */
  username = '';

  /**
   * User's creation date as an RFC3339 date-time string (e.g. '2069-04-20T13:37:00Z').
   * @type {string}
   */
  createdDate = '';

  /**
   * User's features (a.k.a. flairs).
   * @type {[]string}
   */
  features = [];

  /**
   * @param {string|User} user
   */
  constructor(user = '') {
    if (typeof user === 'string') {
      this.displayName = user;
      this.username = this.displayName.toLowerCase();
    } else {
      this.id = user.id;
      this.displayName = user.nick;
      this.username = this.displayName.toLowerCase();
      this.createdDate = user.createdDate;
      this.features = user.features;
    }
  }

  hasAnyFeatures(...features) {
    let exists = false;
    features.forEach((f) => {
      if (
        this.features.indexOf(typeof f !== 'string' ? f.toString() : f) !== -1
      )
        exists = true;
    });

    return exists;
  }

  hasFeature(feature) {
    return this.hasAnyFeatures(feature);
  }

  hasModPowers() {
    return this.hasAnyFeatures(UserFeature.ADMIN, UserFeature.MODERATOR);
  }

  isPrivileged() {
    return this.hasAnyFeatures(
      UserFeature.MODERATOR,
      UserFeature.PROTECTED,
      UserFeature.ADMIN,
      UserFeature.BROADCASTER,
      UserFeature.VIP,
    );
  }

  isSubscriber() {
    return this.hasFeature(UserFeature.SUBSCRIBER);
  }

  isTwitchSub() {
    return this.hasFeature(UserFeature.TWITCHSUB);
  }

  get subTier() {
    if (this.hasFeature(UserFeature.SUB_TIER_5)) {
      return 5;
    }
    if (this.hasFeature(UserFeature.SUB_TIER_4)) {
      return 4;
    }
    if (this.hasFeature(UserFeature.SUB_TIER_3)) {
      return 3;
    }
    if (this.hasFeature(UserFeature.SUB_TIER_2)) {
      return 2;
    }
    if (this.hasFeature(UserFeature.SUB_TIER_1)) {
      return 1;
    }
    return 0;
  }
}

export default ChatUser;
