// @ts-check

import fetchMock from 'jest-fetch-mock';
import YouTubeOEmbedService from './YouTubeOEmbedService';

describe('YouTubeOEmbedService', () => {
  let youtubeOEmbedService;

  beforeEach(() => {
    youtubeOEmbedService = new YouTubeOEmbedService();
    fetchMock.resetMocks();
  });

  describe('getOEmbed', () => {
    it('Should successfully return oEmbed data', async () => {
      const mockResponse = {
        title: 'The Government Shutdown Is Unhinged',
        author_name: 'Destiny',
        thumbnail_url: 'https://i.ytimg.com/vi/jG6DCSZQydU/hqdefault.jpg',
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await youtubeOEmbedService.getOEmbed('jG6DCSZQydU');

      expect(fetchMock).toHaveBeenCalledWith(
        `https://youtube.com/oembed?url=${encodeURIComponent('https://youtu.be/jG6DCSZQydU')}`,
      );

      expect(result).toHaveProperty(
        'title',
        'The Government Shutdown Is Unhinged',
      );

      expect(result).toHaveProperty('author_name', 'Destiny');

      expect(result).toHaveProperty(
        'thumbnail_url',
        'https://i.ytimg.com/vi/jG6DCSZQydU/hqdefault.jpg',
      );
    });

    it('Should fail and throw error', async () => {
      await expect(youtubeOEmbedService.getOEmbed('123')).rejects.toThrow(
        'Invalid JSON',
      );

      expect(fetchMock).toHaveBeenCalledWith(
        `https://youtube.com/oembed?url=${encodeURIComponent('https://youtu.be/123')}`,
      );
    });
  });
});
