// @ts-check

import fetchMock from 'jest-fetch-mock';
import XPostService from './XPostService';

describe('XPostService', () => {
  let xPostService;

  beforeEach(() => {
    xPostService = new XPostService();
    fetchMock.resetMocks();
  });

  describe('getPost', () => {
    it('Should successfully return the post', async () => {
      const tweet = {
        text: 'just setting up my twttr',
        author: { name: 'jack', screen_name: 'jack' },
      };

      fetchMock.mockResponseOnce(
        JSON.stringify({ code: 200, message: 'OK', tweet }),
      );

      const result = await xPostService.getPost('20');

      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.fxtwitter.com/status/20',
      );
      expect(result).toEqual(tweet);
    });

    it('Should throw when the post does not exist', async () => {
      fetchMock.mockResponseOnce(
        JSON.stringify({ code: 404, message: 'NOT_FOUND', tweet: null }),
      );

      await expect(xPostService.getPost('1')).rejects.toThrow(
        'Post not found: 1',
      );
    });

    it('Should throw on invalid JSON', async () => {
      fetchMock.mockResponseOnce('<html></html>');

      await expect(xPostService.getPost('1')).rejects.toThrow('Invalid JSON');
    });
  });
});
