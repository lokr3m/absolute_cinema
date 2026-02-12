const axios = require('axios');
const xml2js = require('xml2js');

/**
 * Service for fetching and parsing Apollo Kino API data
 */
class ApolloKinoService {
  constructor(apiUrl) {
    this.apiUrl = apiUrl || process.env.APOLLO_KINO_API_URL || 'https://www.apollokino.ee/xml';
  }

  /**
   * Fetch and parse XML/JSON data from Apollo Kino API
   * @returns {Promise<Object>} Parsed data
   */
  async fetchJSON(path) {
    try {
      const response = await axios.get(this.apiUrl + path, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CinemaBookingBot/1.0)',
        }
      });

      // Check if response is XML and parse it
      const data = response.data;
      if (typeof data === 'string' && data.trim().startsWith('<')) {
        // It's XML, parse it to JSON
        const parser = new xml2js.Parser({ explicitArray: false });
        return await parser.parseStringPromise(data);
      }

      // Already JSON
      return data;
    } catch (error) {
      console.error('Error fetching Apollo Kino data:', error.message);
      throw new Error(`Failed to fetch Apollo Kino data: ${error.message}`);
    }
  }

  /**
   * Transform Apollo Kino movie data to our Film model format
   * @param {Object} movie - Apollo Kino movie object
   * @returns {Object} Film data in our model format
   */
  transformMovieToFilm(movie) {
    // Map Apollo Kino age ratings to our system
    const ageRatingMap = {
      'MS-6': 'MS-6',
      'MS-12': 'MS-12',
      'K-12': 'K-12',
      'K-16': 'K-16',
      'PERE': 'G',
      'L': 'G',
      '': 'G'
    };

    const genres = movie.Genres ?
      (Array.isArray(movie.Genres.Genre) ? movie.Genres.Genre : [movie.Genres.Genre]) :
      ['General'];

    return {
      title: movie.Title || movie.OriginalTitle || 'Unknown',
      originalTitle: movie.OriginalTitle || movie.Title || 'Unknown',
      description: movie.Synopsis || 'No description available',
      duration: parseInt(movie.LengthInMinutes) || 90,
      genre: genres,
      director: movie.Director || 'Unknown',
      cast: movie.Cast ?
        (typeof movie.Cast === 'string' ? movie.Cast.split(',').map(c => c.trim()) : []) :
        [],
      releaseDate: movie.ReleaseDate ? new Date(movie.ReleaseDate) : new Date(),
      language: movie.SpokenLanguage?.Name || 'Unknown',
      subtitles: movie.SubtitleLanguage1?.Name ? [movie.SubtitleLanguage1.Name] : [],
      ageRating: ageRatingMap[movie.Rating] || 'G',
      posterUrl: movie.Images?.EventMediumImagePortrait || movie.PosterUrl || '',
      trailerUrl: movie.TrailerUrl || '',
      rating: movie.Rating ? parseFloat(movie.Rating) : 0,
      isActive: true
    };
  }

  /**
   * Transform Apollo Kino show to our Session model format
   * @param {Object} show - Apollo Kino show object
   * @param {string} filmId - MongoDB Film ID
   * @param {string} hallId - MongoDB Hall ID
   * @returns {Object} Session data in our model format
   */
  transformShowToSession(show, filmId, hallId) {
    const startTime = new Date(show.dttmShowStart);
    const endTime = new Date(show.dttmShowEnd);

    return {
      film: filmId,
      hall: hallId,
      startTime: startTime,
      endTime: endTime,
      price: {
        standard: parseFloat(show.Price) || 8.5,
        student: parseFloat(show.Price) * 0.7 || 6.0,
        child: parseFloat(show.Price) * 0.6 || 5.0
      },
      is3D: show.PresentationMethod?.toLowerCase().includes('3d') || false,
      subtitles: show.SubtitleLanguage || '',
      availableSeats: parseInt(show.SeatsAvailable) || 100,
      status: 'scheduled'
    };
  }

  /**
   * Fetch Theatre Areas data from Apollo Kino API
   * @returns {Promise<Array>} Array of theatre areas
   */
  async fetchTheatreAreas() {
    try {
      const theatreAreasData = await this.fetchJSON("/TheatreAreas");

      // Parse TheatreAreas structure
      let theatreAreas = [];

      if (theatreAreasData) {
        if (theatreAreasData.TheatreAreas && theatreAreasData.TheatreAreas.TheatreArea) {
          // Structure: { TheatreAreas: { TheatreArea: [...] } }
          theatreAreas = Array.isArray(theatreAreasData.TheatreAreas.TheatreArea)
            ? theatreAreasData.TheatreAreas.TheatreArea
            : [theatreAreasData.TheatreAreas.TheatreArea];
        } else if (Array.isArray(theatreAreasData.TheatreAreas)) {
          // Structure: { TheatreAreas: [...] }
          theatreAreas = theatreAreasData.TheatreAreas;
        } else if (Array.isArray(theatreAreasData)) {
          // Structure: [...]
          theatreAreas = theatreAreasData;
        } else if (theatreAreasData.TheatreArea) {
          // Structure: { TheatreArea: [...] }
          theatreAreas = Array.isArray(theatreAreasData.TheatreArea)
            ? theatreAreasData.TheatreArea
            : [theatreAreasData.TheatreArea];
        }
      }

      return theatreAreas;
    } catch (error) {
      console.error('Error fetching Apollo Kino Theatre Areas:', error.message);
      throw error;
    }
  }

  /**
   * Fetch Events data from Apollo Kino API
   * @returns {Promise<Array>} Array of movie events
   */
  async fetchEvents() {
    try {
      const eventsData = await this.fetchJSON("/Events");

      // Parse Events structure - API returns JSON directly
      let events = [];

      if (eventsData) {
        if (eventsData.Events && eventsData.Events.Event) {
          events = Array.isArray(eventsData.Events.Event)
            ? eventsData.Events.Event
            : [eventsData.Events.Event];
        } else if (Array.isArray(eventsData.Events)) {
          events = eventsData.Events;
        } else if (Array.isArray(eventsData)) {
          events = eventsData;
        } else if (eventsData.Event) {
          events = Array.isArray(eventsData.Event)
            ? eventsData.Event
            : [eventsData.Event];
        }
      }

      return events;
    } catch (error) {
      console.error('Error fetching Apollo Kino Events:', error.message);
      throw error;
    }
  }

  /**
   * Transform Apollo Kino Event to our Film model format
   * @param {Object} event - Apollo Kino event object
   * @returns {Object} Film data in our model format
   */
  transformEventToFilm(event) {
    // Map Apollo Kino age ratings to our system
    const ageRatingMap = {
      'MS-6': 'MS-6',
      'MS-12': 'MS-12',
      'K-12': 'K-12',
      'K-16': 'K-16',
      'PERE': 'G',
      'L': 'G',
      '': 'G'
    };

    // Parse genres from comma-separated string
    const genres = event.Genres && typeof event.Genres === 'string'
      ? event.Genres.split(',').map(g => g.trim())
      : ['General'];

    // Extract director name
    let director = 'Unknown';
    if (event.Directors && event.Directors.Director) {
      const directorObj = Array.isArray(event.Directors.Director)
        ? event.Directors.Director[0]
        : event.Directors.Director;
      const firstName = directorObj.FirstName || '';
      const lastName = directorObj.LastName || '';
      const fullName = `${firstName} ${lastName}`.trim();
      director = (firstName || lastName) ? fullName : 'Unknown';
    }

    // Extract trailer URL from Videos
    let trailerUrl = '';
    if (event.Videos && event.Videos.EventVideo) {
      const videos = Array.isArray(event.Videos.EventVideo)
        ? event.Videos.EventVideo
        : [event.Videos.EventVideo];
      const trailer = videos.find(v => v.MediaResourceFormat === 'YouTubeVideo');
      if (trailer && trailer.Location) {
        trailerUrl = `https://www.youtube.com/watch?v=${trailer.Location}`;
      }
    }

    return {
      title: event.Title || event.OriginalTitle || 'Unknown',
      originalTitle: event.OriginalTitle || event.Title || 'Unknown',
      description: event.Synopsis || event.ShortSynopsis || 'No description available',
      duration: parseInt(event.LengthInMinutes) || 90,
      genre: genres,
      director: director,
      cast: event.Cast ?
        (typeof event.Cast === 'string' ? event.Cast.split(',').map(c => c.trim()) : []) :
        [],
      releaseDate: event.dtLocalRelease ? new Date(event.dtLocalRelease) : new Date(),
      language: event.SpokenLanguage?.Name || 'Unknown',
      subtitles: event.SubtitleLanguage1?.Name ? [event.SubtitleLanguage1.Name] : [],
      ageRating: ageRatingMap[event.RatingLabel] || event.RatingLabel || 'G',
      posterUrl: event.Images?.EventMediumImagePortrait || '',
      trailerUrl: trailerUrl,
      rating: 0, // API doesn't provide rating, set to 0
      isActive: true,
      apolloKinoId: event.ID,
      productionYear: event.ProductionYear,
      EventURL: event.EventURL
    };
  }

  /**
   * Fetch and parse all Apollo Kino data
   * @param {string} dateFrom - Start date in YYYY-MM-DD or DD.MM.YYYY format (optional)
   * @param {string} dateTo - End date in YYYY-MM-DD or DD.MM.YYYY format (optional)
   * @param {string} date - Apollo dt date in YYYY-MM-DD or DD.MM.YYYY format (optional)
   * @returns {Promise<Object>} Object containing movies and shows
   */
  async fetchSchedule(dateFrom = null, dateTo = null, date = null) {
    try {
      // Build query parameters for date range
      let schedulePath = "/Schedule";
      const params = [];
      
      const toApolloDate = value => {
        if (!value) return null;
        if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
          return value;
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          const [year, month, day] = value.split('-');
          return `${day}.${month}.${year}`;
        }
        return value;
      };

      const apolloDate = toApolloDate(date);
      const apolloDateFrom = toApolloDate(dateFrom);
      const apolloDateTo = toApolloDate(dateTo);

      if (apolloDate) {
        params.push(`dt=${encodeURIComponent(apolloDate)}`);
      }
      if (apolloDateFrom) {
        params.push(`dtFrom=${encodeURIComponent(apolloDateFrom)}`);
      }
      if (apolloDateTo) {
        params.push(`dtTo=${encodeURIComponent(apolloDateTo)}`);
      }
      
      if (params.length > 0) {
        schedulePath += `?${params.join('&')}`;
      }

      const schedule = await this.fetchJSON(schedulePath);
      const events = await this.fetchJSON("/Events");

      // The structure may vary, so we'll handle different possible structures
      let movies = [];
      let shows = [];

      return { movies, shows, schedule, events };
    } catch (error) {
      console.error('Error fetching Apollo Kino data:', error.message);
      // Return empty data instead of throwing to allow graceful degradation
      return { movies: [], shows: [], schedule: null, events: null, error: error.message };
    }
  }
  /**
   * Fetch NewsCategories data from Apollo Kino API
   * @returns {Promise<Array>} Array of news categories
   */
  async fetchNewsCategories() {
    try {
      const newsCategoriesData = await this.fetchJSON("/NewsCategories");

      // Parse NewsCategories structure
      let newsCategories = [];

      if (newsCategoriesData) {
        if (newsCategoriesData.NewsCategories && newsCategoriesData.NewsCategories.NewsArticleCategory) {
          // Structure: { NewsCategories: { NewsArticleCategory: [...] } }
          newsCategories = Array.isArray(newsCategoriesData.NewsCategories.NewsArticleCategory)
            ? newsCategoriesData.NewsCategories.NewsArticleCategory
            : [newsCategoriesData.NewsCategories.NewsArticleCategory];
        } else if (Array.isArray(newsCategoriesData.NewsCategories)) {
          // Structure: { NewsCategories: [...] }
          newsCategories = newsCategoriesData.NewsCategories;
        } else if (Array.isArray(newsCategoriesData)) {
          // Structure: [...]
          newsCategories = newsCategoriesData;
        } else if (newsCategoriesData.NewsArticleCategory) {
          // Structure: { NewsArticleCategory: [...] }
          newsCategories = Array.isArray(newsCategoriesData.NewsArticleCategory)
            ? newsCategoriesData.NewsArticleCategory
            : [newsCategoriesData.NewsArticleCategory];
        }
      }

      return newsCategories;
    } catch (error) {
      console.error('Error fetching Apollo Kino News Categories:', error.message);
      throw error;
    }
  }

  /**
   * Fetch News data from Apollo Kino API
   * @returns {Promise<Array>} Array of news articles
   */
  async fetchNews() {
    try {
      const newsData = await this.fetchJSON("/News");

      // Parse News structure
      let news = [];

      if (newsData) {
        if (newsData.News && newsData.News.NewsArticle) {
          // Structure: { News: { NewsArticle: [...] } }
          news = Array.isArray(newsData.News.NewsArticle)
            ? newsData.News.NewsArticle
            : [newsData.News.NewsArticle];
        } else if (Array.isArray(newsData.News)) {
          // Structure: { News: [...] }
          news = newsData.News;
        } else if (Array.isArray(newsData)) {
          // Structure: [...]
          news = newsData;
        } else if (newsData.NewsArticle) {
          // Structure: { NewsArticle: [...] }
          news = Array.isArray(newsData.NewsArticle)
            ? newsData.NewsArticle
            : [newsData.NewsArticle];
        }
      }

      return news;
    } catch (error) {
      console.error('Error fetching Apollo Kino News:', error.message);
      throw error;
    }
  }
}




module.exports = ApolloKinoService;
