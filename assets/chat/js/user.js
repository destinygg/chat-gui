import UserFeature from './features';
import UserRole from './roles';

/**
 * @typedef {Object} User
 * @property {Number} id
 * @property {string} nick
 * @property {string} createdDate
 * @property {string[]} features
 * @property {string[]} roles
 * @property {?string} [bio]
 * @property {?string} [gender]
 * @property {?string} [age]
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
   * User's roles.
   * @type {[]string}
   */
  roles = [];

  /**
   * User's watching embed.
   * @type {?Object}
   */
  watching = null;

  /**
   * User's profile bio.
   * @type {?string}
   */
  bio = null;

  /**
   * User's gender as a raw enum value (e.g. 'nonbinary'); mapped to a label for display.
   * @type {?string}
   */
  gender = null;

  /**
   * User's age range as a raw enum value (e.g. '18-24'); mapped to a label for display.
   * @type {?string}
   */
  age = null;

  /**
   * @param {string|User} user
   */
  constructor(user = '') {
    if (typeof user === 'string') {
      this.displayName = user;
      this.username = this.displayName.toLowerCase();
    } else {
      this.id = user.id || null;
      this.displayName = user.nick || '';
      this.username = this.displayName.toLowerCase();
      this.createdDate = user.createdDate || '';
      this.features = user.features || [];
      this.roles = user.roles || [];
      this.watching = user.watching || null;
      this.bio = user.bio ?? null;
      this.gender = user.gender ?? null;
      this.age = user.age ?? null;
    }
  }

  hasAnyFeatures(...features) {
    for (const feature of features) {
      if (this.features.includes(feature)) {
        return true;
      }
    }

    return false;
  }

  hasAnyRoles(...roles) {
    for (const role of roles) {
      if (this.roles.includes(role)) {
        return true;
      }
    }

    return false;
  }

  hasFeature(feature) {
    return this.features.includes(feature);
  }

  hasRole(role) {
    return this.roles.includes(role);
  }

  // Privileges come only from roles; features (flairs) are cosmetic.
  hasModPowers() {
    return this.hasAnyRoles(UserRole.ADMIN, UserRole.MODERATOR);
  }

  isPrivileged() {
    return this.hasAnyRoles(
      UserRole.MODERATOR,
      UserRole.PROTECTED,
      UserRole.ADMIN,
      UserRole.VIP,
    );
  }

  isBot() {
    return this.hasRole(UserRole.BOT);
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

  equalWatching(embed) {
    return (
      this.watching?.platform === embed?.platform &&
      this.watching?.id === embed?.id
    );
  }

  isSystem() {
    return this.id === -1;
  }
}

export default ChatUser;
