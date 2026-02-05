// Simple in-memory image cache to prevent flashing during navigation
const imageCache = new Map<string, Promise<void>>();

export function preloadImage(url: string): Promise<void> {
  if (imageCache.has(url)) {
    return imageCache.get(url)!;
  }

  const promise = new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });

  imageCache.set(url, promise);
  return promise;
}

export function clearImageCache() {
  imageCache.clear();
}
