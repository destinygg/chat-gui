import UserFeature from './features';

class ChatUser {
  constructor(args = {}) {
    if (typeof args === 'string') {
      this.id = null;
      this.nick = args;
      this.username = args;
      this.createdDate = args;
      this.features = [];
      this.watching = null;
    } else {
      this.id = args.id || null;
      this.nick = args.nick || '';
      this.username = args.nick || '';
      this.createdDate = args.createdDate || '';
      this.features = args.features || [];
      this.watching = args.watching || null;
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

  equalWatching(embed) {
    if (
      this.watching?.platform === embed?.platform &&
      this.watching?.id === embed?.id
    )
      return true;
    return false;
  }
}

export default ChatUser;
