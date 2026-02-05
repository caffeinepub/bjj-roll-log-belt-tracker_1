import { useEffect, useState } from 'react';
import { preloadImage } from '../lib/imageCache';

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
}

export default function CachedImage({ src, alt, fallback, ...props }: CachedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    
    preloadImage(src)
      .then(() => {
        setImageSrc(src);
        setIsLoading(false);
      })
      .catch(() => {
        setHasError(true);
        setIsLoading(false);
        if (fallback) {
          setImageSrc(fallback);
        }
      });
  }, [src, fallback]);

  return (
    <img
      {...props}
      src={imageSrc}
      alt={alt}
      style={{
        ...props.style,
        opacity: isLoading ? 0.5 : 1,
        transition: 'opacity 0.2s ease-in-out',
      }}
      onError={() => {
        if (fallback && !hasError) {
          setImageSrc(fallback);
          setHasError(true);
        }
      }}
    />
  );
}
