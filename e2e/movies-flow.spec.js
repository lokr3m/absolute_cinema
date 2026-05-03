const { test, expect } = require('@playwright/test');

test('visitor can open movie list and details', async ({ page }) => {
  const filmId = '64f3c8f3c8f3c8f3c8f3c8f3';
  const film = {
    _id: filmId,
    title: 'Test Film',
    originalTitle: 'Test Film',
    description: 'Test description',
    duration: 120,
    genre: ['Drama'],
    director: 'Test Director',
    cast: ['Actor One'],
    releaseDate: '2024-01-01',
    language: 'English',
    subtitles: ['Estonian'],
    ageRating: 'PG',
    rating: 7.5
  };

  await page.route('**/api/films/*', async route => {
    const url = route.request().url();
    if (url.endsWith(`/api/films/${filmId}`)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: film })
      });
      return;
    }
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, error: 'Not found' })
    });
  });

  await page.route('**/api/films', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, count: 1, data: [film] })
    });
  });

  await page.goto('/movies');
  await expect(page.getByRole('heading', { name: /All Movies/i })).toBeVisible();
  await expect(page.getByText('Test Film')).toBeVisible();

  await page.getByRole('link', { name: /View Details/i }).first().click();
  await expect(page).toHaveURL(new RegExp(`/movies/${filmId}$`));
  await expect(page.getByRole('heading', { name: 'Test Film' })).toBeVisible();
  await expect(page.getByText('Movie details')).toBeVisible();
});
