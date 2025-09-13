import YoutubeOembedClient from './YouTubeOembedClient';

export default class YouTubeTooltipService {
  static async populateTooltips(id) {
    const parents = [...document.querySelectorAll(`div#ytt-${id}`)].filter(
      (parent) => parent.children[0].dataset.fetched === 'false',
    );

    if (parents.length === 0) {
      return;
    }

    const response = await YoutubeOembedClient.getData(id);
    if (response.type === 'Error') {
      return;
    }

    for (const parent of parents) {
      const tooltip = parent.children[0];
      tooltip.dataset.fetched = 'true';
      const thumbnail = tooltip.querySelector('.yt-tooltip-thumbnail');
      const title = tooltip.querySelector('.yt-tooltip-title');
      const channel = tooltip.querySelector('.yt-tooltip-channel');

      thumbnail.src = `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
      title.innerHTML = response.data.title;
      channel.innerHTML = response.data.author_name;
    }
  }
}
