export default function makeSafeForRegex(str) {
  return str.trim().replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
}
