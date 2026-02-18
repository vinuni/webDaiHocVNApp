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
});
