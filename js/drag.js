
export function makeDraggable(el, { onStart, onMove, onEnd, bounds } = {}) {
  let active = false;
  let startX = 0, startY = 0;
  let baseX = 0, baseY = 0;
  let x = 0, y = 0;

  el.style.touchAction = 'none';
  el.style.userSelect = 'none';
  el.querySelectorAll('img').forEach((img) => {
    img.draggable = false;
    img.style.pointerEvents = 'none';
    img.style.webkitUserDrag = 'none';
  });

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function down(e) {
    active = true;
    el.setPointerCapture(e.pointerId);
    startX = e.clientX;
    startY = e.clientY;
    baseX = x;
    baseY = y;
    onStart?.({ el, x, y, event: e });
  }

  function move(e) {
    if (!active) return;
    x = baseX + (e.clientX - startX);
    y = baseY + (e.clientY - startY);

    if (bounds) {
      x = clamp(x, bounds.minX ?? -Infinity, bounds.maxX ?? Infinity);
      y = clamp(y, bounds.minY ?? -Infinity, bounds.maxY ?? Infinity);
    }

    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    onMove?.({ el, x, y, event: e });
  }

  function up(e) {
    if (!active) return;
    active = false;
    el.releasePointerCapture?.(e.pointerId);
    onEnd?.({ el, x, y, event: e });
  }

  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);

  return {
    reset() {
      x = 0; y = 0;
      el.style.transform = 'translate3d(0, 0, 0)';
    },
    destroy() {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
    },
  };
}

export function overlaps(a, b) {
  const r1 = a.getBoundingClientRect();
  const r2 = b.getBoundingClientRect();
  return !(r1.right < r2.left || r1.left > r2.right ||
           r1.bottom < r2.top || r1.top > r2.bottom);
}
