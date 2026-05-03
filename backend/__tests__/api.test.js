const request = require('supertest');
const { app } = require('../index');
const { Film } = require('../Models');

const createFilm = () => ({
  _id: '64f3c8f3c8f3c8f3c8f3c8f3',
  title: 'Test Film',
  originalTitle: 'Test Film',
  description: 'Test description',
  duration: 120,
  genre: ['Drama'],
  director: 'Test Director',
  cast: ['Actor One'],
  releaseDate: new Date('2024-01-01'),
  language: 'English',
  subtitles: ['Estonian'],
  ageRating: 'PG',
  rating: 7.5,
  isActive: true
});

const createQuery = result => ({
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  then: (resolve, reject) => Promise.resolve(result).then(resolve, reject)
});

let seededFilm;

beforeEach(() => {
  seededFilm = createFilm();
  jest.spyOn(Film, 'find').mockReturnValue(createQuery([seededFilm]));
  jest.spyOn(Film, 'findById').mockResolvedValue(seededFilm);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('public film API', () => {
  test('GET /api/films returns active films', async () => {
    const response = await request(app).get('/api/films');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.count).toBe(1);
    expect(response.body.data[0].title).toBe('Test Film');
  });

  test('GET /api/films/:id returns the requested film', async () => {
    const response = await request(app).get(`/api/films/${seededFilm._id}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data._id).toBe(String(seededFilm._id));
  });

  test('GET /api/films/:id validates ObjectId format', async () => {
    const response = await request(app).get('/api/films/not-an-id');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe('Invalid film ID');
  });
});
