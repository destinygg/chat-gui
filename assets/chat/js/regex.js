const regexslashcmd = /^\/([a-z0-9]+)[\s]?/i;
const regextime =
  /(?<number>\d+)(?<unit>s(econds?)?$|m(inutes?)?$|h(ours?)?$|d(ays?)?$)?/i;
const nickmessageregex = /(?=[@>]?)(\w{3,20})/g;
const nickregex = /^\w{3,20}$/;
const nsfwregex = /\bNSFW\b/i;
const nsflregex = /\bNSFL\b/i;
const spoilersregex = /\bSPOILERS\b/i;
const embedregex =
  /(^|\s)(#(kick|twitch|twitch-vod|twitch-clip|youtube|youtube-live|facebook|rumble|vimeo)\/([\w\d]{3,64}\/videos\/\d{10,20}|[\w-]{3,64}|\w{7}\/\?pub=\w{5})(?:\?t=(\d+)s?)?)\b/;

export {
  regexslashcmd,
  regextime,
  nickmessageregex,
  nickregex,
  nsfwregex,
  nsflregex,
  spoilersregex,
  embedregex,
};

export default function makeSafeForRegex(str) {
  return str.trim().replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
}
