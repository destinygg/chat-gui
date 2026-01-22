// @ts-check

/**
 * @typedef {Object} XComOembedResponse
 * @property {string} author_name
 * @property {string} author_url
 * @property {string} html
 * @property {number} width
 * @property {number} height
 * @property {string} title
 * @property {string} url
 */

const BASE_URI = 'https://publish.twitter.com';

export default class XComOEmbedService {
  /**
   * @param {string} statusId
   * @return {Promise<XComOembedResponse>}
   * @throws {Error}
   */
  async getOEmbed(statusId) {
    const url = new URL('/oembed', BASE_URI);
    url.searchParams.set('url', `https://x.com/i/status/${statusId}`);
    url.searchParams.set('omit_script', 'true');
    url.searchParams.set('dnt', 'true');
    url.searchParams.set('maxwidth', '250');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    try {
      /** @type {XComOembedResponse} */
      return await response.json();
    } catch (error) {
      throw new Error('Invalid JSON');
    }
  }
}
