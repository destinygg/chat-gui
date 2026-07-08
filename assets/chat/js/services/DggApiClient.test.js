// @ts-check

import fetchMock from 'jest-fetch-mock';
import DggApiClient from './DggApiClient';

describe('DggApiClient', () => {
  let apiClient;

  beforeEach(() => {
    apiClient = new DggApiClient('https://www.destiny.gg');
    fetchMock.resetMocks();
  });

  describe('getUserInfo', () => {
    it('should request the userinfo endpoint and return the data payload', async () => {
      const userInfo = {
        id: 123,
        nick: 'Destiny',
        roles: ['subscriber'],
        features: ['flair1', 'admin'],
        createdDate: '2013-01-01T00:00:00+00:00',
        watching: { platform: 'twitch', id: 'xqc' },
      };

      fetchMock.mockResponseOnce(
        JSON.stringify({ success: true, message: null, data: userInfo }),
      );

      const result = await apiClient.getUserInfo('Destiny');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://www.destiny.gg/api/chat/userinfo?username=Destiny',
      );
      expect(result).toEqual(userInfo);
    });

    it('should encode the username query parameter', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({ success: true, data: { nick: 'a b' } }),
      );

      await apiClient.getUserInfo('a b');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://www.destiny.gg/api/chat/userinfo?username=a+b',
      );
    });

    it('should throw with the envelope message when success is false', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({ success: false, message: 'User not found' }),
      );

      await expect(apiClient.getUserInfo('nobody')).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw when the response is invalid JSON', async () => {
      fetchMock.mockResponseOnce('not json');

      await expect(apiClient.getUserInfo('Destiny')).rejects.toThrow(
        'Invalid JSON',
      );
    });
  });
});
