const regexslashcmd = /^\/([a-z0-9]+)[\s]?/i;
const regextime = /(\d+(?:\.\d*)?)([a-z]+)?/gi;
const nickmessageregex = /(?=@?)(\w{3,20})/g;
const nickregex = /^[a-zA-Z0-9_]{3,20}$/;
const nsfwnsflregex = /\b(?:NSFL|NSFW)\b/i;
const nsfwregex = /\b(?:NSFW)\b/i;
const nsflregex = /\b(?:NSFL)\b/i;

export default function makeSafeForRegex(str) {
  return str.trim().replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
};

export {
  regexslashcmd,
  regextime,
  nickmessageregex,
  nickregex,
  nsfwnsflregex,
  nsfwregex,
  nsflregex,
};
