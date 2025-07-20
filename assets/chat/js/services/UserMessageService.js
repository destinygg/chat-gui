// @ts-check

import RustleSearchApiClient from './RustleSearchApiClient';

/**
 * @typedef {import('./RustleSearchApiClient').RustleSearchMessage} RustleSearchMessage
 */

/**
 * @typedef {Object} UserMessage
 * @property {string} username
 * @property {string} messageText
 * @property {number} timestamp
 */

export default class UserMessageService {
  /**
   * @param {RustleSearchApiClient} [apiClient]
   */
  constructor(apiClient) {
    this.apiClient = apiClient ?? new RustleSearchApiClient();
  }

  /**
   * @param {Array<RustleSearchMessage>} messages
   * @returns {Array<UserMessage>}
   */
  transformMessages(messages) {
    return messages.map((message) => ({
      username: message.username,
      messageText: message.text,
      timestamp: new Date(message.ts).getTime(),
    }));
  }

  /**
   * @param {string} username
   * @param {number} messageCount
   * @returns {Promise<Array<UserMessage>>}
   */
  async getUserMessages(username, messageCount = 50) {
    let messages;
    try {
      messages = await this.apiClient.getLogs(username, 'Destinygg');
    } catch (error) {
      return [];
    }

    const transformedMessages = this.transformMessages(messages);

    return transformedMessages.slice(0, messageCount);
  }
}
