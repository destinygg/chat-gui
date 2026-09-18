// @ts-check

import { youtubeidregex } from './regex';

const IMAGE_EXTENSION_REGEX = /\.(?:png|jpe?g|gif|webp|avif)$/i;
const IMGUR_HOSTS = new Set(['imgur.com', 'www.imgur.com', 'm.imgur.com']);
const IMGUR_ID_REGEX = /^\/(\w{5,8})(?:\.(?:gifv|mp4))?$/;
const X_HOSTS = new Set([
  'x.com',
  'www.x.com',
  'mobile.x.com',
  'twitter.com',
  'www.twitter.com',
  'mobile.twitter.com',
]);
const X_POST_PATH_REGEX = /^\/\w{1,15}\/status\/(\d{2,19})/;

// Links the poster flagged as NSFW, NSFL or spoilers don't get an image or
// post preview, since the preview would show the content on a mere hover.
const FLAGGED_LINK_SELECTOR = '.nsfw-link, .nsfl-link, .spoilers-link';

/**
 * @param {string} href
 * @return {URL|null}
 */
function parseUrl(href) {
  try {
    return new URL(href);
  } catch {
    return null;
  }
}

/**
 * The image to preview for a link: a direct image link on any host, or the
 * medium thumbnail of a single-image Imgur page. Only HTTPS images are
 * previewed so the chat never loads mixed content.
 *
 * @param {string} href
 * @return {string|null}
 */
export function getImagePreviewUrl(href) {
  const url = parseUrl(href);
  if (url?.protocol !== 'https:') {
    return null;
  }

  // Imgur pages and its `.gifv` links are HTML, so they point at the image's
  // thumbnail instead. Albums and galleries need the authenticated API.
  if (IMGUR_HOSTS.has(url.hostname) || url.hostname === 'i.imgur.com') {
    const match = url.pathname.match(IMGUR_ID_REGEX);
    if (match) {
      return `https://i.imgur.com/${match[1]}m.jpg`;
    }
  }

  return IMAGE_EXTENSION_REGEX.test(url.pathname) ? url.href : null;
}

/**
 * @param {string} href
 * @return {string|null}
 */
export function getXPostId(href) {
  const url = parseUrl(href);
  if (!url || !X_HOSTS.has(url.hostname)) {
    return null;
  }
  return url.pathname.match(X_POST_PATH_REGEX)?.[1] ?? null;
}

/**
 * Resolves once the image has loaded, so the tooltip is sized to it when it
 * opens rather than growing underneath the cursor.
 *
 * @param {string} src
 * @return {Promise<HTMLImageElement>}
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.className = 'link-preview__image';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

/**
 * @param {...(Node|string)} children
 * @return {HTMLDivElement}
 */
function container(...children) {
  const div = document.createElement('div');
  div.className = 'link-preview';
  div.append(...children);
  return div;
}

/**
 * @param {keyof HTMLElementTagNameMap} tagName
 * @param {string} className
 * @param {string} text
 * @return {HTMLElement}
 */
function textElement(tagName, className, text) {
  const el = document.createElement(tagName);
  el.className = className;
  el.textContent = text;
  return el;
}

/**
 * Builds the hover preview for a chat link, or resolves to null when the link
 * isn't one that gets a preview.
 *
 * @param {HTMLAnchorElement} link
 * @param {{
 *   youtubeOEmbedService: import('./services').YouTubeOEmbedService,
 *   xPostService: import('./services').XPostService,
 * }} services
 * @return {Promise<HTMLElement|null>}
 * @throws {Error} When the preview's data or image can't be loaded.
 */
export async function buildLinkPreview(link, services) {
  const { href } = link;

  const youtubeMatch = href.match(youtubeidregex);
  if (youtubeMatch) {
    const result = await services.youtubeOEmbedService.getOEmbed(
      youtubeMatch[1],
    );
    return container(
      await loadImage(result.thumbnail_url),
      textElement('strong', 'link-preview__title', result.title),
      textElement('span', '', result.author_name),
    );
  }

  if (link.matches(FLAGGED_LINK_SELECTOR)) {
    return null;
  }

  const xPostId = getXPostId(href);
  if (xPostId) {
    const post = await services.xPostService.getPost(xPostId);
    const media = post.media?.all?.[0];
    const mediaUrl = media?.type === 'photo' ? media.url : media?.thumbnail_url;

    const children = [
      textElement('strong', 'link-preview__title', post.author.name),
      textElement('span', '', `@${post.author.screen_name}`),
    ];
    if (post.text) {
      children.push(textElement('p', 'link-preview__text', post.text));
    }
    if (mediaUrl) {
      children.push(await loadImage(mediaUrl));
    }
    return container(...children);
  }

  const imageUrl = getImagePreviewUrl(href);
  if (imageUrl) {
    return container(await loadImage(imageUrl));
  }

  return null;
}
