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
        bio: 'gaming',
        gender: 'nonbinary',
        age: '18-24',
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

    it('should resolve to null when the user does not exist (404)', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({ success: false, message: 'User not found' }),
        { status: 404 },
      );

      await expect(apiClient.getUserInfo('nobody')).resolves.toBeNull();
    });

    it('should throw on a non-404 failure envelope', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({ success: false, message: 'Server error' }),
        { status: 500 },
      );

      await expect(apiClient.getUserInfo('nobody')).rejects.toThrow(
        'Server error',
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
