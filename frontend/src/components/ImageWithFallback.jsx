import React, { useState, useEffect } from 'react';
import { resolveImageUrl } from '../services/apiClient';

const LOCAL_FALLBACK = '/assets/cream_classic_kurta.jpg';

const ImageWithFallback = ({
  src,
  alt = 'Clothing Item',
  className = '',
  fallbackSrc = LOCAL_FALLBACK,
  ...props
}) => {
  const getInitialSrc = () => {
    if (!src) return fallbackSrc;
    return resolveImageUrl(src);
  };

  const [imgSrc, setImgSrc] = useState(getInitialSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    setImgSrc(src ? resolveImageUrl(src) : fallbackSrc);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (!hasError && imgSrc !== fallbackSrc) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    } else {
      setHasError(true);
    }
  };

  if (hasError && imgSrc === fallbackSrc) {
    return (
      <div
        className={`${className} bg-[#EBE4DC] flex flex-col items-center justify-center p-4 text-[#595553] select-none`}
        role="img"
        aria-label={alt}
      >
        <span className="font-heading text-xs tracking-widest uppercase font-bold text-[#231F20] text-center">
          {alt || 'Rent Wise Outfit'}
        </span>
        <span className="text-[10px] tracking-wider uppercase mt-1 text-[#595553]">
          Octo Archive
        </span>
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={`${className} object-cover`}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
};

export default ImageWithFallback;

