// @ts-check

/**
 * @typedef {Object} YouTubeOembedResponse
 * @property {string} title
 * @property {string} author_name
 * @property {string} thumbnail_url
 */

const BASE_URI = 'https://youtube.com';

export default class YouTubeOEmbedService {
  /**
   * @param {string} id
   * @return {Promise<YouTubeOembedResponse>}
   * @throws {Error}
   */
  async getOEmbed(id) {
    const url = new URL('/oembed', BASE_URI);
    url.searchParams.set('url', `https://youtu.be/${id}`);

    const response = await fetch(url.toString());

    try {
      /** @type {YouTubeOembedResponse} */
      return await response.json();
    } catch (error) {
      throw new Error('Invalid JSON', { cause: error });
    }
  }
}
