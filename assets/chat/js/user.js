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
}

export default ChatUser
