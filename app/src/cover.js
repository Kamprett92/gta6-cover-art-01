// Draws a multi-panel GTA-style poster onto a canvas: three photo panels in a
// white-guttered layout, a Vice City colour grade over each photo, and bold
// caption lettering. Nothing here copies any game's artwork, logo or font —
// the lettering is the browser's own bold system sans, skewed for punch.

const GRADES = {
  sunset: {
    washTop: 'rgba(255, 122, 61, 0.18)',
    washBottom: 'rgba(255, 46, 136, 0.38)',
    band: '#ff2e88',
    band2: '#ff7a3d',
    sun: 'rgba(255, 214, 120, 0.9)',
    accent: '#ffd678',
  },
  neon: {
    washTop: 'rgba(23, 195, 178, 0.16)',
    washBottom: 'rgba(255, 46, 136, 0.45)',
    band: '#c400ff',
    band2: '#ff2e88',
    sun: 'rgba(120, 240, 255, 0.85)',
    accent: '#7df3ff',
  },
  dusk: {
    washTop: 'rgba(40, 90, 200, 0.20)',
    washBottom: 'rgba(255, 150, 60, 0.30)',
    band: '#123a8f',
    band2: '#ff9a3d',
    sun: 'rgba(255, 190, 90, 0.9)',
    accent: '#ffbe5a',
  },
};

/** The three panel rectangles for a layout, inside a canvas of w by h. */
export function layoutRects(layout, w, h) {
  const g = Math.round(Math.min(w, h) * 0.022);
  const full = { x: 0, y: 0, w, h };
  if (layout === 'split') {
    const leftW = Math.round(w * 0.58) - g;
    const rightX = leftW + g;
    const rightW = w - rightX;
    const halfH = Math.round(h / 2) - g;
    return [
      { x: 0, y: 0, w: leftW, h },
      { x: rightX, y: 0, w: rightW, h: halfH },
      { x: rightX, y: halfH + g, w: rightW, h: h - halfH - g },
    ];
  }
  if (layout === 'triptych') {
    const colW = Math.round(w / 3) - g;
    return [
      { x: 0, y: 0, w: colW, h },
      { x: colW + g, y: 0, w: colW, h },
      { x: 2 * (colW + g), y: 0, w: w - 2 * (colW + g), h },
    ];
  }
  // hero: one big panel on top, two small ones underneath.
  const heroH = Math.round(h * 0.60) - g;
  const smallW = Math.round(w / 2) - g;
  return [
    { x: 0, y: 0, w, h: heroH },
    { x: 0, y: heroH + g, w: smallW, h: h - heroH - g },
    { x: smallW + g, y: heroH + g, w: w - smallW - g, h: h - heroH - g },
  ];
}

/** Fits `fit` text into `maxWidth` by shrinking the font, returns the size. */
function fitFont(ctx, text, startSize, maxWidth, weight) {
  let size = startSize;
  ctx.font = `${weight} ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  }
  return size;
}

function drawPhotoPanel(ctx, rect, img, transform, grade) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();

  if (img) {
    const zoom = (transform?.zoom ?? 100) / 100;
    const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
    const pw = img.naturalWidth * base;
    const ph = img.naturalHeight * base;
    const ox = ((transform?.ox ?? 0) / 100) * rect.w;
    const oy = ((transform?.oy ?? 0) / 100) * rect.h;
    ctx.drawImage(img, rect.x + (rect.w - pw) / 2 + ox, rect.y + (rect.h - ph) / 2 + oy, pw, ph);
  } else {
    // Empty panel: a painted sunset placeholder so the poster still reads.
    const sky = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    sky.addColorStop(0, '#ff9a3d');
    sky.addColorStop(0.55, '#ff2e88');
    sky.addColorStop(1, '#3b115f');
    ctx.fillStyle = sky;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = grade.sun;
    ctx.beginPath();
    ctx.arc(rect.x + rect.w / 2, rect.y + rect.h * 0.42, Math.min(rect.w, rect.h) * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = `bold ${Math.max(12, rect.w * 0.045)}px "Arial Black", Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h * 0.72);
  }

  // Warm grade wash + a soft vignette, the sunset/neon look.
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  wash.addColorStop(0, grade.washTop);
  wash.addColorStop(1, grade.washBottom);
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const vig = ctx.createRadialGradient(
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.min(rect.w, rect.h) * 0.35,
    rect.x + rect.w / 2, rect.y + rect.h / 2, Math.max(rect.w, rect.h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(20,0,40,0.35)');
  ctx.fillStyle = vig;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function drawCaption(ctx, w, h, state, grade) {
  const text = (state.caption || '').trim().toUpperCase();
  const sub = (state.subtitle || '').trim();
  const style = state.captionStyle || 'banner';
  if (!text && !sub) return;

  if (style === 'outline') {
    const size = fitFont(ctx, text, Math.round(h * 0.16), w * 0.92, '900 italic');
    ctx.save();
    ctx.translate(w / 2, h - h * 0.10);
    ctx.transform(1, 0, -0.08, 1, 0, 0);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(3, size * 0.09);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText(text, 0, 0);
    ctx.fillStyle = grade.band;
    ctx.fillText(text, 0, 0);
    ctx.restore();
    if (sub) {
      ctx.font = `bold ${Math.round(h * 0.028)}px "Arial Black", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 6;
      ctx.fillText(sub.toUpperCase(), w / 2, h - h * 0.02);
      ctx.shadowBlur = 0;
    }
    return;
  }

  if (style === 'corner') {
    const size = fitFont(ctx, text, Math.round(h * 0.075), w * 0.6, '900 italic');
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.lineWidth = Math.max(3, size * 0.12);
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.fillStyle = '#ffffff';
    const y = h - h * 0.05;
    ctx.strokeText(text, w * 0.04, y);
    ctx.fillText(text, w * 0.04, y);
    ctx.restore();
    if (sub) {
      ctx.font = `${Math.round(h * 0.024)}px Arial, sans-serif`;
      ctx.fillStyle = grade.accent;
      ctx.textAlign = 'left';
      ctx.fillText(sub, w * 0.04, h - h * 0.018);
    }
    return;
  }

  // banner: a hot band across the foot of the poster with the caption on it.
  const bandH = Math.round(h * 0.155);
  const bandY = h - bandH;
  const band = ctx.createLinearGradient(0, bandY, w, bandY);
  band.addColorStop(0, grade.band2);
  band.addColorStop(0.55, grade.band);
  band.addColorStop(1, '#7b2ff7');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, w, bandH);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(0, bandY, w, 3);
  const size = fitFont(ctx, text, Math.round(bandH * 0.52), w * 0.92, '900 italic');
  ctx.save();
  ctx.translate(w / 2, bandY + bandH * 0.42);
  ctx.transform(1, 0, -0.06, 1, 0, 0);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = size * 0.12;
  ctx.fillText(text, 0, 0);
  ctx.restore();
  if (sub) {
    const subSize = fitFont(ctx, sub, Math.round(bandH * 0.20), w * 0.9, 'bold');
    ctx.font = `bold ${subSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fillText(sub, w / 2, bandY + bandH * 0.82);
  }
  // A thin accent stripe under the band, the poster's underline.
  ctx.fillStyle = grade.accent;
  ctx.fillRect(0, h - 4, w, 4);
}

/** Paints the whole poster for `state` onto `canvas` at its own pixel size. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const { width: w, height: h } = canvas;
  const grade = GRADES[state.grade] || GRADES.sunset;
  // White gutters between panels, poster-print style.
  ctx.fillStyle = '#fdf6ee';
  ctx.fillRect(0, 0, w, h);
  const rects = layoutRects(state.layout || 'hero', w, h);
  rects.forEach((rect, i) => {
    drawPhotoPanel(ctx, rect, state.images?.[i] ?? null, state.transforms?.[i], grade);
  });
  drawCaption(ctx, w, h, state, grade);
}
