const regexslashcmd = /^\/([a-z0-9]+)[\s]?/i;
const regextime =
  /(?<number>\d+)(?<unit>s(econds?)?$|m(inutes?)?$|h(ours?)?$|d(ays?)?$)?/i;
const nickmessageregex = /(?=[@>]?)(\w{3,20})/g;
const nickregex = /^\w{3,20}$/;
const nsfwregex = /\bNSFW\b/i;
const nsflregex = /\bNSFL\b/i;
const spoilersregex = /\bSPOILERS\b/i;
const youtubeidregex =
  /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/|#youtube\/)([A-Za-z0-9_-]{11})/;

export {
  regexslashcmd,
  regextime,
  nickmessageregex,
  nickregex,
  nsfwregex,
  nsflregex,
  spoilersregex,
  youtubeidregex,
};

export default function makeSafeForRegex(str) {
  return str.trim().replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
}
