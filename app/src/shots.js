// Fixed scenes for screenshots: ?shot=editor shows the studio with a sample
// photo loaded in every panel; ?shot=cover shows the finished cover alone.
// `photo` picks the sample (samples/<photo>.jpg), `caption` the big words,
// `layout`, `grade` and `size` pick the poster's shape and mood, and
// `photo2` / `photo3` give the second and third panels their own samples.
// window.__shotReady is set once the scene has painted.
export async function runShot(shot, query, load, state) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (state) {
    const layout = query.get('layout');
    if (layout) {
      state.layout = layout;
      document.querySelectorAll('#layoutSeg button').forEach((b) => {
        b.classList.toggle('on', b.dataset.layout === layout);
      });
    }
    const grade = query.get('grade');
    if (grade) {
      state.grade = grade;
      const sel = document.getElementById('gradeSel');
      if (sel) sel.value = grade;
    }
    const size = query.get('size');
    if (size) {
      state.size = size;
      const sel = document.getElementById('sizeSel');
      if (sel) sel.value = size;
    }
    const sub = query.get('subtitle');
    if (sub) {
      state.subtitle = sub;
      const input = document.getElementById('subtitle');
      if (input) input.value = sub;
    }
  }
  await load(
    `samples/${query.get('photo') ?? 'pier'}.jpg`,
    query.get('caption') ?? 'Sunset Heist',
    0,
  );
  // Extra panels may each show a different sample: photo2 and photo3.
  for (const [index, key] of [[1, 'photo2'], [2, 'photo3']]) {
    const extra = query.get(key);
    if (extra) await load(`samples/${extra}.jpg`, query.get('caption') ?? 'Sunset Heist', index);
  }
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
