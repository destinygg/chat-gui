// @ts-check

/**
 * @typedef {Object} YouTubeOembedData
 * @property {string} type - The resource type - video.
 * @property {string} version - The oEmbed version number. (1.0)
 * @property {string} title - The video title.
 * @property {string} author_name - The channel name.
 * @property {string} author_url - Link to the channel.
 * @property {string} provider_name - YouTube
 * @property {string} provider_url - https://www.youtube.com/
 * @property {string} thumbnail_url - Link to the video's thumbnail with quality hqdefault
 */

/**
 * @typedef {Object} YouTubeOembedSuccessResponse
 * @property {'Success'} type
 * @property {YouTubeOembedData} data
 */

/**
 * @typedef {Object} YouTubeOembedErrorResponse
 * @property {'Error'} type
 */

/**
 * @typedef {YouTubeOembedSuccessResponse|YouTubeOembedErrorResponse} YouTubeOembedResponse
 */

const BASE_URI = 'https://youtube.com/';

export default class YouTubeOembedClient {
  /**
   * @param {string} id
   * @returns {Promise<YouTubeOembedResponse>}
   * @throws {Error}
   */
  static async getData(id) {
    const apiUrl = new URL('/oembed', BASE_URI);
    apiUrl.searchParams.set('url', `https://youtu.be/${id}`);

    const response = await fetch(apiUrl.toString());

    /** @type {YouTubeOembedResponse} */
    let data;
    try {
      data = {
        type: 'Success',
        data: await response.json(),
      };
    } catch (error) {
      data = {
        type: 'Error',
      };
    }

    return data;
  }
}
