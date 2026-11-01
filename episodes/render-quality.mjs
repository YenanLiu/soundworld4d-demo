export const RENDER_QUALITY = Object.freeze({
  balanced: {label: 'Standard', ratio: 1.5, shadow: 1024, ao: false},
  high: {label: 'High', ratio: 2, shadow: 2048, ao: true},
  ultra: {label: 'Ultra', ratio: 3, shadow: 4096, ao: true},
});

export function renderRatio(quality, width, height, deviceRatio = 1) {
  const profile = RENDER_QUALITY[quality] || RENDER_QUALITY.high;
  const preferred = quality === 'balanced' ? Math.min(deviceRatio, profile.ratio) : profile.ratio;
  return Math.min(preferred, Math.sqrt(8294400 / Math.max(1, width * height)));
}

export function captureDimensions(aspect, longEdge = 3840) {
  if (!Number.isFinite(aspect) || aspect <= 0) throw new Error('Invalid capture aspect ratio');
  if (!Number.isInteger(longEdge) || longEdge < 1 || longEdge > 3840) throw new Error('Invalid capture size');
  return aspect >= 1
    ? {width: longEdge, height: Math.max(1, Math.round(longEdge / aspect))}
    : {width: Math.max(1, Math.round(longEdge * aspect)), height: longEdge};
}
