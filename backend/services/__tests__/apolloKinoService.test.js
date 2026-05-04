const ApolloKinoService = require('../apolloKinoService');
const axios = require('axios');

jest.mock('axios');

describe('ApolloKinoService', () => {
  let service;

  beforeEach(() => {
    service = new ApolloKinoService('https://example.com');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('fetchJSON', () => {
    it('parses XML responses into JSON', async () => {
      axios.get.mockResolvedValue({
        data: '<root><item>value</item></root>',
      });

      const result = await service.fetchJSON('/test');

      expect(result.root.item).toBe('value');
      expect(axios.get).toHaveBeenCalledWith(
        'https://example.com/test',
        expect.objectContaining({
          timeout: 10000,
          headers: expect.any(Object),
        })
      );
    });

    it('returns JSON responses as-is', async () => {
      axios.get.mockResolvedValue({ data: { ok: true } });

      const result = await service.fetchJSON('/json');

      expect(result).toEqual({ ok: true });
    });

    it('throws a helpful error when request fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      axios.get.mockRejectedValue(new Error('boom'));

      await expect(service.fetchJSON('/fail')).rejects.toThrow(
        'Failed to fetch Apollo Kino data: boom'
      );
    });
  });

  describe('transformMovieToFilm', () => {
    it('maps Apollo Kino movie data to film format', () => {
      const movie = {
        Title: 'Movie Title',
        OriginalTitle: 'Original Title',
        Synopsis: 'A story.',
        LengthInMinutes: '120',
        Genres: { Genre: 'Action' },
        Director: 'Director Name',
        Cast: 'Actor One, Actor Two',
        ReleaseDate: '2025-01-15',
        SpokenLanguage: { Name: 'English' },
        SubtitleLanguage1: { Name: 'Estonian' },
        Rating: 'MS-12',
        Images: { EventMediumImagePortrait: 'poster.jpg' },
        TrailerUrl: 'trailer-url'
      };

      const film = service.transformMovieToFilm(movie);

      expect(film.title).toBe('Movie Title');
      expect(film.originalTitle).toBe('Original Title');
      expect(film.duration).toBe(120);
      expect(film.genre).toEqual(['Action']);
      expect(film.cast).toEqual(['Actor One', 'Actor Two']);
      expect(film.language).toBe('English');
      expect(film.subtitles).toEqual(['Estonian']);
      expect(film.ageRating).toBe('MS-12');
      expect(film.posterUrl).toBe('poster.jpg');
      expect(film.trailerUrl).toBe('trailer-url');
      expect(film.isActive).toBe(true);
    });
  });

  describe('transformShowToSession', () => {
    it('maps show data to session format', () => {
      jest.useFakeTimers().setSystemTime(new Date('2025-01-01T10:00:00Z'));

      const show = {
        dttmShowStart: '2025-01-01T12:00:00Z',
        dttmShowEnd: '2025-01-01T14:00:00Z',
        ShowSalesEndTime: '2025-01-01T11:00:00Z',
        PresentationMethod: '2D/3D',
        SpokenLanguage: { Name: 'English' },
        SubtitleLanguage1: { NameInLanguage: 'Estonian' },
        ID: 'show-id',
        ShowURL: 'show-url',
        EventURL: 'event-url',
        TheatreAuditoriumID: 'hall-1'
      };

      const session = service.transformShowToSession(show, 'film-id', 'hall-id');

      expect(session.film).toBe('film-id');
      expect(session.hall).toBe('hall-id');
      expect(session.startTime.toISOString()).toBe('2025-01-01T12:00:00.000Z');
      expect(session.endTime.toISOString()).toBe('2025-01-01T14:00:00.000Z');
      expect(session.is3D).toBe(true);
      expect(session.language).toBe('English');
      expect(session.subtitles).toBe('Estonian');
      expect(session.status).toBe('scheduled');
      expect(session.theatreAuditoriumId).toBe('hall-1');
    });
  });

  describe('transformEventToFilm', () => {
    it('maps event data to film format', () => {
      const event = {
        Title: 'Event Title',
        OriginalTitle: 'Event Original',
        Synopsis: 'Event synopsis',
        LengthInMinutes: '95',
        Genres: 'Drama, Adventure',
        Directors: {
          Director: {
            FirstName: 'Jane',
            LastName: 'Doe'
          }
        },
        Cast: 'Actor One, Actor Two',
        dtLocalRelease: '2024-12-31',
        SubtitleLanguage1: { Name: 'Estonian' },
        RatingLabel: 'MS-6',
        Images: { EventMediumImagePortrait: 'event-poster.jpg' },
        Videos: {
          EventVideo: [
            {
              MediaResourceFormat: 'YouTubeVideo',
              Location: 'abc123'
            }
          ]
        },
        ID: 'event-id',
        ProductionYear: '2024',
        EventURL: 'event-url',
        RatingImageUrl: 'rating-image'
      };

      const film = service.transformEventToFilm(event);

      expect(film.title).toBe('Event Title');
      expect(film.genre).toEqual(['Drama', 'Adventure']);
      expect(film.director).toBe('Jane Doe');
      expect(film.trailerUrl).toBe('https://www.youtube.com/watch?v=abc123');
      expect(film.ageRating).toBe('MS-6');
      expect(film.apolloKinoId).toBe('event-id');
      expect(film.isActive).toBe(true);
    });
  });

  describe('fetchTheatreAreas', () => {
    it('normalizes theatre areas from API response', async () => {
      jest
        .spyOn(service, 'fetchJSON')
        .mockResolvedValue({ TheatreAreas: { TheatreArea: { ID: '1' } } });

      const result = await service.fetchTheatreAreas();

      expect(result).toEqual([{ ID: '1' }]);
    });
  });

  describe('fetchEvents', () => {
    it('normalizes events from API response', async () => {
      jest
        .spyOn(service, 'fetchJSON')
        .mockResolvedValue({ Events: { Event: [{ ID: 'event-1' }] } });

      const result = await service.fetchEvents();

      expect(result).toEqual([{ ID: 'event-1' }]);
    });
  });

  describe('fetchSchedule', () => {
    it('collects shows and movies from schedule data', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2025-01-01T12:00:00Z'));

      const schedule = {
        Schedule: {
          Shows: {
            Show: { ID: 'show-1' }
          }
        }
      };
      const events = {
        Events: {
          Event: [{ ID: 'event-1' }]
        }
      };

      const fetchJSONSpy = jest.spyOn(service, 'fetchJSON');
      fetchJSONSpy.mockResolvedValueOnce(schedule).mockResolvedValueOnce(events);

      const result = await service.fetchSchedule(7);

      expect(fetchJSONSpy).toHaveBeenNthCalledWith(
        1,
        '/Schedule?dt=01.01.2025&nrOfDays=7'
      );
      expect(fetchJSONSpy).toHaveBeenNthCalledWith(2, '/Events');
      expect(result.shows).toEqual([{ ID: 'show-1' }]);
      expect(result.movies).toEqual([{ ID: 'event-1' }]);
    });

    it('returns a safe fallback on errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      jest.spyOn(service, 'fetchJSON').mockRejectedValue(new Error('network down'));

      const result = await service.fetchSchedule();

      expect(result).toEqual({
        movies: [],
        shows: [],
        schedule: null,
        events: null,
        error: 'network down'
      });
      consoleSpy.mockRestore();
    });
  });

  describe('fetchNews', () => {
    it('normalizes news articles from API response', async () => {
      jest
        .spyOn(service, 'fetchJSON')
        .mockResolvedValue({ News: { NewsArticle: { ID: 'news-1' } } });

      const result = await service.fetchNews();

      expect(result).toEqual([{ ID: 'news-1' }]);
    });
  });
});
