// @ts-check

/**
 * @typedef {Object} XPostMedia
 * @property {'photo'|'video'|'gif'} type
 * @property {string} url
 * @property {string} [thumbnail_url]
 */

/**
 * @typedef {Object} XPost
 * @property {string} text
 * @property {{ name: string, screen_name: string }} author
 * @property {{ all?: XPostMedia[] }} [media]
 */

// X's own oEmbed endpoint returns markup without media and needs widgets.js to
// render, so posts are looked up through the FxTwitter API, which serves JSON
// with CORS enabled.
const BASE_URI = 'https://api.fxtwitter.com';

export default class XPostService {
  /**
   * @param {string} id
   * @return {Promise<XPost>}
   * @throws {Error}
   */
  async getPost(id) {
    const response = await fetch(new URL(`/status/${id}`, BASE_URI).toString());

    let body;
    try {
      body = await response.json();
    } catch (error) {
      throw new Error('Invalid JSON', { cause: error });
    }

    if (!body?.tweet) {
      throw new Error(`Post not found: ${id}`);
    }

    return body.tweet;
  }
}
