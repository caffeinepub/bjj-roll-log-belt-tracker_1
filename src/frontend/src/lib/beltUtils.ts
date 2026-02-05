type BeltLevel = 'white' | 'blue' | 'purple' | 'brown' | 'black';

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

// Preload a single belt image
export function preloadBeltImage(belt: BeltLevel, stripes: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load belt image: ${belt}-${stripes}`));
    img.src = getBeltImageUrl(belt, stripes);
  });
}

// Preload all belt images for better caching
export async function preloadAllBeltImages(): Promise<void> {
  const belts: BeltLevel[] = ['white', 'blue', 'purple', 'brown', 'black'];
  const stripes = [0, 1, 2, 3, 4];
  
  const promises: Promise<void>[] = [];
  
  for (const belt of belts) {
    for (const stripe of stripes) {
      promises.push(preloadBeltImage(belt, stripe));
    }
  }
  
  try {
    await Promise.all(promises);
  } catch (error) {
    console.warn('Some belt images failed to preload:', error);
  }
}
