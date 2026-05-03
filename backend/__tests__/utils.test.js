const {
  normalizeApolloId,
  extractShowsFromSchedule,
  extractScheduleEvents,
  parseSeatRowConfig,
  timingSafeStringEqual
} = require('../index');

describe('backend helper utilities', () => {
  test('normalizeApolloId trims values and rejects invalid input', () => {
    expect(normalizeApolloId(' 123 ')).toBe('123');
    expect(normalizeApolloId('')).toBeNull();
    expect(normalizeApolloId(null)).toBeNull();
    expect(normalizeApolloId({})).toBeNull();
  });

  test('extractShowsFromSchedule handles nested and array payloads', () => {
    const nested = { Schedule: { Shows: { Show: [{ EventID: 1 }] } } };
    const direct = { Shows: { Show: { EventID: 2 } } };
    const array = [{ EventID: 3 }];

    expect(extractShowsFromSchedule(nested)).toHaveLength(1);
    expect(extractShowsFromSchedule(direct)).toHaveLength(1);
    expect(extractShowsFromSchedule(array)).toEqual(array);
  });

  test('extractScheduleEvents normalizes event lists', () => {
    const payload = { Events: { Event: [{ ID: 1 }, { ID: 2 }] } };
    expect(extractScheduleEvents(payload)).toHaveLength(2);
  });

  test('parseSeatRowConfig normalizes comma-separated rows', () => {
    expect(parseSeatRowConfig('1, 2,2, -1, abc')).toEqual([1, 2]);
    expect(parseSeatRowConfig([3, '4', 4, 0])).toEqual([3, 4]);
  });

  test('timingSafeStringEqual compares safely', () => {
    expect(timingSafeStringEqual('secret', 'secret')).toBe(true);
    expect(timingSafeStringEqual('secret', 'secrEt')).toBe(false);
    expect(timingSafeStringEqual('short', 'longer')).toBe(false);
  });
});
