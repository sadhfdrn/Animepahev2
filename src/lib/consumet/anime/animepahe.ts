
import { load } from 'cheerio';

import {
  AnimeParser,
  ISearch,
  IAnimeInfo,
  MediaStatus,
  IAnimeResult,
  ISource,
  IAnimeEpisode,
  IEpisodeServer,
  MediaFormat,
  IVideo,
} from '../models';
import { USER_AGENT } from '../utils';

class AnimePahe extends AnimeParser {
  override readonly name = 'AnimePahe';
  protected override baseUrl = 'https://cors-anywhere.herokuapp.com/https://animepahe.ru';
  protected override logo = 'https://animepahe.com/pikacon.ico';
  protected override classPath = 'ANIME.AnimePahe';

  /**
   * @param query Search query
   */
  override search = async (query: string): Promise<ISearch<IAnimeResult>> => {
    try {
      const { data } = await this.client.get(`/api?m=search&q=${encodeURIComponent(query)}`, {
        headers: this.Headers(false),
      });

      const res = {
        results: data.data.map((item: any) => ({
          id: item.session,
          title: item.title,
          image: item.poster,
          rating: item.score,
          releaseDate: item.year,
          type: item.type,
        })),
      };

      return res;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };

  /**
   * @param id id format id/session
   * @param episodePage Episode page number (optional) default: -1 to get all episodes. number of episode pages can be found in the anime info object
   */
  override fetchAnimeInfo = async (id: string, episodePage: number = -1): Promise<IAnimeInfo> => {
    const animeInfo: IAnimeInfo = {
      id: id,
      title: '',
    };

    try {
      const res = await this.client.get(`/anime/${id}`, { headers: this.Headers(id) });
      const $ = load(res.data);

      animeInfo.title = $('div.title-wrapper > h1 > span').first().text();
      animeInfo.image = $('div.anime-poster a').attr('href');
      animeInfo.cover = `https:${$('div.anime-cover').attr('data-src')}`;
      animeInfo.description = $('div.anime-summary').text().trim();
      animeInfo.genres = $('div.anime-genre ul li')
        .map((i, el) => $(el).find('a').attr('title'))
        .get();
      animeInfo.hasSub = true;

      switch ($('div.anime-info p:icontains("Status:") a').text().trim()) {
        case 'Currently Airing':
          animeInfo.status = MediaStatus.ONGOING;
          break;
        case 'Finished Airing':
          animeInfo.status = MediaStatus.COMPLETED;
          break;
        default:
          animeInfo.status = MediaStatus.UNKNOWN;
      }
      animeInfo.type = $('div.anime-info > p:contains("Type:") > a')
        .text()
        .trim()
        .toUpperCase() as MediaFormat;
      animeInfo.releaseDate = $('div.anime-info > p:contains("Aired:")')
        .text()
        .split('to')[0]
        .replace('Aired:', '')
        .trim();
      animeInfo.studios = $('div.anime-info > p:contains("Studio:")')
        .text()
        .replace('Studio:', '')
        .trim()
        .split('\n');

      animeInfo.totalEpisodes = parseInt(
        $('div.anime-info > p:contains("Episodes:")').text().replace('Episodes:', '')
      );
      
      animeInfo.episodes = [];
      if (episodePage < 0) {
        const {
          data: { last_page, data },
        } = await this.client.get(`/api?m=release&id=${id}&sort=episode_asc&page=1`, {
          headers: this.Headers(id),
        });

        animeInfo.episodePages = last_page;

        animeInfo.episodes.push(
          ...data.map(
            (item: any) =>
              ({
                id: `${id}/${item.session}`,
                number: item.episode,
                title: item.title,
                image: item.snapshot,
                duration: item.duration,
                url: `${this.baseUrl}/play/${id}/${item.session}`,
              } as IAnimeEpisode)
          )
        );

        for (let i = 1; i < last_page; i++) {
          animeInfo.episodes.push(...(await this.fetchEpisodes(id, i + 1)));
        }
      } else {
        animeInfo.episodes.push(...(await this.fetchEpisodes(id, episodePage)));
      }

      return animeInfo;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };

  /**
   *
   * @param episodeId episode id
   */
  override fetchEpisodeSources = async (episodeId: string): Promise<ISource> => {
    try {
      const animeId = episodeId.split('/')[0];
      const epId = episodeId.split('/')[1];

      const res = await this.client.get(`/play/${animeId}/${epId}`, {
        headers: this.Headers(animeId),
      });

      const $ = load(res.data);

      let m;
      const regex = /href="(?<link>https?:\/\/pahe[.]win\/[^"]+)"[^>]+>(?<name>[^<]+)/g;
      
      const paheWinLinksPromises: Promise<{ kwik: string; name: string }>[] = [];
      
      while ((m = regex.exec(res.data.replace(/\n/g, ''))) !== null) {
        if (m.index === regex.lastIndex) {
          regex.lastIndex++;
        }
        
        const groups = m.groups as { link: string; name: string };
        paheWinLinksPromises.push(
          this.Kwix(groups.link).then(kwikLink => ({
            kwik: kwikLink,
            name: groups.name.replace(/&middot;./g, ''),
          }))
        );
      }
      const paheLinks = await Promise.all(paheWinLinksPromises);


      const sources: IVideo[] = [];
      
      const directDownloadsPromises = paheLinks.map(async (paheLink) => {
        try {
          const authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.O0FKaqhJjEZgCAVfZoLz6Pjd7Gs9Kv6qi0P8RyATjaE';
          const response = await this.client.post(`https://access-kwik.apex-cloud.workers.dev/`, {
            "service": "kwik",
            "action": "fetch",
            "content": { kwik: paheLink.kwik },
             "auth": authToken,
          });

          if (response.data.status) {
            sources.push({ url: response.data.content.url, quality: `Direct - ${paheLink.name}` });
          }
          sources.push({ url: paheLink.kwik, quality: `Kwik Page - ${paheLink.name}` });
        } catch (error) {
           // If direct download fails, we can add the kwik page as a fallback.
           sources.push({ url: paheLink.kwik, quality: `Kwik Page - ${paheLink.name}` });
        }
      });
      
      await Promise.all(directDownloadsPromises);

      return {
        sources: sources,
        download: paheLinks.map((link) => ({
          url: link.kwik,
          quality: `Kwik Page - ${link.name}`,
        })),
      };
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };

  private Kwix = async (pahe: string): Promise<string> => {
    const res = /(?<kwik>https?:\/\/kwik.[a-z]+\/f\/.[^"]+)/.exec(
      await this.client.get(pahe).then(async (res: any) => await res.data)
    ) as RegExpExecArray
    return (res.groups as Record<string, string>)['kwik']
  }

  private fetchEpisodes = async (session: string, page: number): Promise<IAnimeEpisode[]> => {
    const res = await this.client.get(
      `/api?m=release&id=${session}&sort=episode_asc&page=${page}`,
      { headers: this.Headers(session) }
    );

    const epData = res.data.data;

    return [
      ...epData.map(
        (item: any): IAnimeEpisode => ({
          id: `${session}/${item.session}`,
          number: item.episode,
          title: item.title,
          image: item.snapshot,
          duration: item.duration,
          url: `${this.baseUrl}/play/${session}/${item.session}`,
        })
      ),
    ] as IAnimeEpisode[];
  };

  /**
   * @deprecated
   * @attention AnimePahe doesn't support this method
   */
  override fetchEpisodeServers = (episodeLink: string): Promise<IEpisodeServer[]> => {
    throw new Error('Method not implemented.');
  };

  private Headers(sessionId: string | false) {
    return {
      'authority': 'animepahe.ru',
      'accept': 'application/json, text/javascript, */*; q=0.01',
      'accept-language': 'en-US,en;q=0.9',
      'accept-encoding': 'gzip, deflate, br',
      'cache-control': 'no-cache',
      'pragma': 'no-cache',
      'cookie': '__ddg2_=;',
      'dnt': '1',
      'sec-ch-ua': '"Not A(Brand";v="99", "Microsoft Edge";v="121", "Chromium";v="121"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'upgrade-insecure-requests': '1',
      'x-requested-with': 'XMLHttpRequest',
      'referer': `https://animepahe.ru/`,
      'user-agent': 'consumet',
    };
  }
}

export default AnimePahe;
