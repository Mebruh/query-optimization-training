export const DESIGN = {
  width: 1440,
  height: 580,
};

export function fitCanvas(canvas, design = DESIGN) {
  const frame = canvas.parentElement;
  if (!frame) return () => {};

  canvas.style.width = `${design.width}px`;
  canvas.style.height = `${design.height}px`;

  const apply = () => {

    if (!canvas.isConnected) {
      observer.disconnect();
      return;
    }
    const { width, height } = frame.getBoundingClientRect();
    if (!width || !height) return;

    const scale = Math.min(width / design.width, height / design.height);

    const x = (width - design.width * scale) / 2;
    const y = (height - design.height * scale) / 2;
    canvas.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  };

  const observer = new ResizeObserver(apply);
  observer.observe(frame);
  apply();

  return () => observer.disconnect();
}