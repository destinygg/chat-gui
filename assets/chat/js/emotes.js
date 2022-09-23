const Type = Object.freeze({
    NORMAL: Symbol("normal"),
    TWITCH: Symbol("twitch"),
});

function regexForEmotes(emotes) {
    const prefixes = emotes.map(e => e.prefix);
    return new RegExp(`(^|\\s)(${prefixes.join('|')})(?=$|\\s)`, 'gm');
}

export default class EmoteService {
    emotes = [];
    emoteRegex = new Map();

    buildRegex(emotes) {
        this.emotes = emotes;
        const groups = [
            [Type.NORMAL, this.emotes.filter(e => !e.twitch)],
            [Type.TWITCH, this.emotes],
        ];

        this.emoteRegex = new Map();
        for (const g of groups) {
            const [type, e] = g;
            this.emoteRegex.set(type, regexForEmotes(e));
        }
    }

    emoteRegexForUser(user) {
        const type = user.isTwitchSub() ? Type.TWITCH: Type.NORMAL;
        return this.emoteRegex.get(type);
    }

    get prefixes() {
        return this.emotes.map(e => e.prefix);
    }

    get systemEmoteRegex() {
        return this.emoteRegex.get(Type.TWITCH);
    }

    get twitchEmotePrefixes() {
        return this.emotes.filter(e => e.twitch).map(e => e.prefix);
    }

    get destinyEmotePrefixes() {
        return this.emotes.filter(e => !e.twitch).map(e => e.prefix);
    }
}
