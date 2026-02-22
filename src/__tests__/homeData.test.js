/**
 * Home screen data normalization (same logic as HomeScreen load())
 */
function normalizeHomeResponse(res) {
  const raw = res?.data ?? res;
  return {
    mon_this: Array.isArray(raw?.mon_this) ? raw.mon_this : [],
    study_materials_summary: Array.isArray(raw?.study_materials_summary) ? raw.study_materials_summary : [],
    leaderboard: Array.isArray(raw?.leaderboard) ? raw.leaderboard : [],
  };
}

describe('Home data normalization', () => {
  it('returns arrays when response has mon_this, study_materials_summary, leaderboard', () => {
    const res = {
      mon_this: [{ id: 1, tenmonthi: 'Toán' }],
      study_materials_summary: [],
      leaderboard: [{ rank: 1, name: 'A' }],
    };
    const out = normalizeHomeResponse(res);
    expect(out.mon_this).toHaveLength(1);
    expect(out.mon_this[0].tenmonthi).toBe('Toán');
    expect(out.study_materials_summary).toEqual([]);
    expect(out.leaderboard).toHaveLength(1);
  });

  it('handles wrapped response (data.mon_this)', () => {
    const res = { data: { mon_this: [{ id: 2 }], study_materials_summary: [], leaderboard: [] } };
    const out = normalizeHomeResponse(res);
    expect(out.mon_this).toHaveLength(1);
    expect(out.mon_this[0].id).toBe(2);
  });

  it('returns empty arrays for null or undefined response', () => {
    expect(normalizeHomeResponse(null).mon_this).toEqual([]);
    expect(normalizeHomeResponse(undefined).mon_this).toEqual([]);
    expect(normalizeHomeResponse({}).mon_this).toEqual([]);
  });

  it('ignores non-array mon_this', () => {
    const out = normalizeHomeResponse({ mon_this: 'not-array' });
    expect(out.mon_this).toEqual([]);
  });

  describe('user_attempted and user_diem in exam items', () => {
    it('preserves user_attempted and user_diem from API in de_this items', () => {
      const res = {
        mon_this: [
          {
            id: 1,
            tenmonthi: 'Toán',
            de_this: [
              { id: 101, tendethi: 'Đề 1', user_attempted: true, user_diem: 8.5 },
              { id: 102, tendethi: 'Đề 2', user_attempted: false, user_diem: null },
            ],
          },
        ],
        study_materials_summary: [],
        leaderboard: [],
      };
      const out = normalizeHomeResponse(res);
      expect(out.mon_this).toHaveLength(1);
      expect(out.mon_this[0].de_this).toHaveLength(2);
      expect(out.mon_this[0].de_this[0].user_attempted).toBe(true);
      expect(out.mon_this[0].de_this[0].user_diem).toBe(8.5);
      expect(out.mon_this[0].de_this[1].user_attempted).toBe(false);
      expect(out.mon_this[0].de_this[1].user_diem).toBe(null);
    });

    it('attempted check: item.user_attempted === true means completed', () => {
      const attempted = (item) => item.user_attempted === true;
      expect(attempted({ user_attempted: true })).toBe(true);
      expect(attempted({ user_attempted: false })).toBe(false);
      expect(attempted({ user_attempted: null })).toBe(false);
      expect(attempted({})).toBe(false);
    });
  });
});
