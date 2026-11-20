// Wires the poster studio: photo uploads per panel, layout/size/grade pickers,
// per-panel crop controls (sliders, drag on the preview, scroll to zoom),
// caption editing, and PNG export at the chosen post size.
import { drawCover, layoutRects } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const filePicker = document.getElementById('filePicker');

const state = {
  images: [null, null, null],
  names: ['No photo yet', 'No photo yet', 'No photo yet'],
  transforms: [
    { zoom: 100, ox: 0, oy: 0 },
    { zoom: 100, ox: 0, oy: 0 },
    { zoom: 100, ox: 0, oy: 0 },
  ],
  layout: 'hero',
  grade: 'sunset',
  caption: 'Sunset Heist',
  subtitle: 'One last ride down the boulevard',
  captionStyle: 'banner',
  size: '1080x1080',
  selected: 0,
};

function redraw() {
  const [w, h] = state.size.split('x').map(Number);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas, state);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load image'));
    img.src = url;
  });
}

function setPanelPhoto(index, img, name) {
  state.images[index] = img;
  state.names[index] = name;
  state.transforms[index] = { zoom: 100, ox: 0, oy: 0 };
  renderPhotoRows();
  redraw();
}

function renderPhotoRows() {
  const host = document.getElementById('photoRows');
  host.innerHTML = '';
  state.images.forEach((img, i) => {
    const row = document.createElement('div');
    row.className = 'photo-row' + (state.selected === i ? ' active' : '');
    const thumb = document.createElement('img');
    thumb.className = 'thumb';
    thumb.alt = '';
    if (img) thumb.src = img.src;
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = `Panel ${i + 1} — ${state.names[i]}`;
    const pick = document.createElement('button');
    pick.type = 'button';
    pick.textContent = img ? 'Change' : 'Choose photo';
    pick.addEventListener('click', () => {
      state.selected = i;
      syncPanelControls();
      renderPhotoRows();
      filePicker.click();
    });
    const select = document.createElement('button');
    select.type = 'button';
    select.textContent = 'Crop';
    select.addEventListener('click', () => {
      state.selected = i;
      syncPanelControls();
      renderPhotoRows();
    });
    row.append(thumb, name, pick, select);
    host.append(row);
  });
}

function syncPanelControls() {
  const t = state.transforms[state.selected];
  document.getElementById('zoom').value = t.zoom;
  document.getElementById('zoomVal').textContent = `${t.zoom}%`;
  document.getElementById('panX').value = t.ox;
  document.getElementById('panY').value = t.oy;
  document.querySelectorAll('#panelSeg button').forEach((b) => {
    b.classList.toggle('on', Number(b.dataset.panel) === state.selected);
  });
}

function bindSegment(id, onPick) {
  document.querySelectorAll(`#${id} button`).forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll(`#${id} button`).forEach((x) => x.classList.remove('on'));
      b.classList.add('on');
      onPick(b);
    });
  });
}

bindSegment('layoutSeg', (b) => {
  state.layout = b.dataset.layout;
  redraw();
});
bindSegment('panelSeg', (b) => {
  state.selected = Number(b.dataset.panel);
  syncPanelControls();
  renderPhotoRows();
});

document.getElementById('sizeSel').addEventListener('change', (e) => {
  state.size = e.target.value;
  redraw();
});
document.getElementById('gradeSel').addEventListener('change', (e) => {
  state.grade = e.target.value;
  redraw();
});
document.getElementById('captionStyle').addEventListener('change', (e) => {
  state.captionStyle = e.target.value;
  redraw();
});
document.getElementById('caption').addEventListener('input', (e) => {
  state.caption = e.target.value;
  redraw();
});
document.getElementById('subtitle').addEventListener('input', (e) => {
  state.subtitle = e.target.value;
  redraw();
});

document.getElementById('zoom').addEventListener('input', (e) => {
  state.transforms[state.selected].zoom = Number(e.target.value);
  document.getElementById('zoomVal').textContent = `${e.target.value}%`;
  redraw();
});
document.getElementById('panX').addEventListener('input', (e) => {
  state.transforms[state.selected].ox = Number(e.target.value);
  redraw();
});
document.getElementById('panY').addEventListener('input', (e) => {
  state.transforms[state.selected].oy = Number(e.target.value);
  redraw();
});

filePicker.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  filePicker.value = '';
  if (!file) return;
  try {
    const img = await loadImage(URL.createObjectURL(file));
    setPanelPhoto(state.selected, img, file.name);
    status.textContent = `Loaded ${file.name} into panel ${state.selected + 1}.`;
  } catch {
    status.textContent = 'That file could not be read as a photo.';
  }
});

document.getElementById('fillAll').addEventListener('click', () => {
  const first = state.images[0];
  if (!first) {
    status.textContent = 'Load a photo into panel 1 first.';
    return;
  }
  for (let i = 1; i < 3; i += 1) setPanelPhoto(i, first, state.names[0]);
  status.textContent = 'One photo now fills all three panels.';
});

document.getElementById('useSamples').addEventListener('click', async () => {
  try {
    const pier = await loadImage('samples/pier.jpg');
    const blvd = await loadImage('samples/boulevard.jpg');
    setPanelPhoto(0, pier, 'pier.jpg (sample)');
    setPanelPhoto(1, blvd, 'boulevard.jpg (sample)');
    setPanelPhoto(2, pier, 'pier.jpg (sample)');
    status.textContent = 'Sample photos loaded — swap in your own any time.';
  } catch {
    status.textContent = 'The sample photos could not be loaded.';
  }
});

document.getElementById('export').addEventListener('click', () => {
  redraw();
  canvas.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-sunset-cover-${state.size}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status.textContent = `Saved neon-sunset-cover-${state.size}.png`;
  }, 'image/png');
});

// Click a panel in the preview to select it; drag to pan, scroll to zoom.
let dragging = false;
let lastX = 0;
let lastY = 0;

function panelAt(clientX, clientY) {
  const box = canvas.getBoundingClientRect();
  const x = ((clientX - box.left) / box.width) * canvas.width;
  const y = ((clientY - box.top) / box.height) * canvas.height;
  const rects = layoutRects(state.layout, canvas.width, canvas.height);
  return rects.findIndex((r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h);
}

canvas.addEventListener('pointerdown', (e) => {
  const hit = panelAt(e.clientX, e.clientY);
  if (hit < 0) return;
  state.selected = hit;
  syncPanelControls();
  renderPhotoRows();
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const box = canvas.getBoundingClientRect();
  const t = state.transforms[state.selected];
  t.ox = Math.max(-50, Math.min(50, t.ox + ((e.clientX - lastX) / box.width) * 100));
  t.oy = Math.max(-50, Math.min(50, t.oy + ((e.clientY - lastY) / box.height) * 100));
  lastX = e.clientX;
  lastY = e.clientY;
  syncPanelControls();
  redraw();
});
canvas.addEventListener('pointerup', () => { dragging = false; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const hit = panelAt(e.clientX, e.clientY);
  if (hit >= 0 && hit !== state.selected) {
    state.selected = hit;
    syncPanelControls();
    renderPhotoRows();
  }
  const t = state.transforms[state.selected];
  t.zoom = Math.max(100, Math.min(300, t.zoom - Math.sign(e.deltaY) * 10));
  syncPanelControls();
  redraw();
}, { passive: false });

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), async (sample, text, index) => {
    const img = await loadImage(sample);
    if (index === 0) {
      for (let i = 0; i < 3; i += 1) setPanelPhoto(i, img, sample.split('/').pop());
      state.caption = text;
      document.getElementById('caption').value = text;
    } else {
      setPanelPhoto(index, img, sample.split('/').pop());
    }
    redraw();
  }, state);
} else {
  renderPhotoRows();
  syncPanelControls();
  redraw();
}
