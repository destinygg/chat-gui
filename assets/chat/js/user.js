import UserFeature from './features'

class ChatUser {

    constructor(args={}){
        if(typeof args === 'string') {
            this.nick = args
            this.username = args
            this.features = []
        } else {
            this.nick = args.nick || ''
            this.username = args.nick || ''
            this.features = args.features || []
        }
    }

    hasAnyFeatures(...args){
        for (const element of args) {
            if(this.features.indexOf(typeof element !== 'string' ? element.toString() : element) !== -1)
                return true
        }
        return false
    }

    hasFeature(feature){
        return this.hasAnyFeatures(feature)
    }

    hasModPowers() {
        return this.hasAnyFeatures(UserFeature.ADMIN, UserFeature.MODERATOR)
    }

    isPrivileged() {
        return this.hasAnyFeatures(
            UserFeature.MODERATOR,
            UserFeature.PROTECTED,
            UserFeature.ADMIN,
            UserFeature.BROADCASTER,
            UserFeature.VIP
        );
    }

    isSubscriber() {
        return this.hasFeature(UserFeature.SUBSCRIBER);
    }

    isTwitchSub() {
        return this.hasFeature(UserFeature.TWITCHSUB);
    }

    get subTier() {
        if (this.hasFeature(UserFeature.SUB_TIER_4)) {
            return 4;
        } else if (this.hasFeature(UserFeature.SUB_TIER_3)) {
            return 3;
        } else if (this.hasFeature(UserFeature.SUB_TIER_2)) {
            return 2;
        } else if (this.hasFeature(UserFeature.SUB_TIER_1)) {
            return 1;
        } else {
            return 0;
        }
    }
}

export default ChatUser
