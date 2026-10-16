/**
 * The user's profile photo as an `<img>`, or `null` when there is none to
 * show: a name that isn't an account, like an anonymous donor's, or a chat
 * that wasn't given the photos' URLs (`config.profilePhotos`).
 *
 * @param {*} chat
 * @param {?import('./user').default} user
 * @returns {?HTMLImageElement}
 */
export default function profilePhotoElement(chat, user) {
  const src = user?.photo ? chat?.config?.profilePhotos?.[user.photo] : null;
  if (!src) {
    return null;
  }

  const img = document.createElement('img');
  img.className = 'profile-photo';
  img.src = src;
  img.alt = '';

  return img;
}
