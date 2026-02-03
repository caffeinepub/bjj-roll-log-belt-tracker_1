import { BeltLevel } from '../backend';

// Preload belt images for better caching
const BELT_IMAGES = new Map<string, HTMLImageElement>();

export function preloadBeltImage(belt: BeltLevel, stripes: number): void {
  const url = getBeltImageUrl(belt, stripes);
  
  if (!BELT_IMAGES.has(url)) {
    const img = new Image();
    img.src = url;
    BELT_IMAGES.set(url, img);
  }
}

export function preloadAllBeltImages(): void {
  const belts: BeltLevel[] = [
    BeltLevel.white,
    BeltLevel.blue,
    BeltLevel.purple,
    BeltLevel.brown,
    BeltLevel.black,
  ];

  belts.forEach((belt) => {
    for (let stripes = 0; stripes <= 4; stripes++) {
      preloadBeltImage(belt, stripes);
    }
  });
}

export function getBeltImageUrl(belt: BeltLevel, stripes: number): string {
  const beltName = belt.charAt(0).toUpperCase() + belt.slice(1);
  if (stripes === 0) {
    return `/assets/${beltName}-Belt.png`;
  }
  return `/assets/${beltName}-Belt-${stripes}.png`;
}

export function getBeltName(belt: BeltLevel): string {
  return belt.charAt(0).toUpperCase() + belt.slice(1) + ' Belt';
}
