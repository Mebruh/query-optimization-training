export const MANIFEST = [
  // 'assets/images/table-scan.webp',
  // 'assets/images/index-scan.webp',
];

export function preloadImages(sources = MANIFEST) {
  return Promise.all(
    sources.map(
      (src) =>
        new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ src, ok: true });
          img.onerror = () => {
            console.warn('[preload] failed:', src);
            resolve({ src, ok: false });
          };
          img.src = src;
        })
    )
  );
}

export async function waitForFonts() {
  if (!document.fonts) return;
  try {
    await document.fonts.ready;
  } catch {
  }
}
