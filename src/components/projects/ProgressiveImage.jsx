import React from 'react';
import { Image, Box } from '@chakra-ui/react';
import { useProgressiveImage } from '../../hooks/useProgressiveImage';
import { getFileUrl } from '../../utils/fileUrl';
import './ProgressiveImage.css';

const LAYER_FADE = 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)';

/**
 * Progressive image: loads a small variant first, crossfades through upgrades until HD.
 */
export default function ProgressiveImage({
  src: originalUrl,
  project = null,
  profile = 'feedCard',
  priority = 2,
  paused = false,
  as = 'chakra',
  alt = '',
  onError,
  onClick,
  objectFit = 'cover',
  w,
  h,
  width,
  height,
  maxW,
  maxH,
  borderRadius,
  filter,
  cursor,
  flexShrink,
  className,
  style,
  ...rest
}) {
  const {
    containerRef,
    baseSrc,
    overlaySrc,
    overlayVisible,
    onOverlayTransitionEnd,
    onMouseEnter,
  } = useProgressiveImage({
    originalUrl,
    project,
    profile,
    priority,
    paused,
    enabled: !!originalUrl,
  });

  const handleError = (e) => {
    const target = e?.target;
    const fallback = originalUrl ? getFileUrl(originalUrl) : null;
    if (target && fallback && target.src !== fallback) {
      target.src = fallback;
      return;
    }
    if (onError) onError(e);
    else if (target) target.style.display = 'none';
  };

  const containerStyle = {
    width: w ?? width ?? '100%',
    height: h ?? height ?? '100%',
    maxWidth: maxW,
    maxHeight: maxH,
    borderRadius,
    filter,
    cursor,
    flexShrink,
    ...style,
  };

  const layerClass = (role) =>
    `progressive-image__layer progressive-image__layer--${role}${
      role === 'overlay' && overlayVisible ? ' is-visible' : ''
    }`;

  if (!originalUrl) return null;

  if (as === 'native') {
    return (
      <span
        ref={containerRef}
        className={`progressive-image ${className || ''}`.trim()}
        style={{ ...containerStyle, display: 'block', lineHeight: 0 }}
        onMouseEnter={onMouseEnter}
        onClick={onClick}
      >
        {baseSrc && (
          <img
            src={baseSrc}
            alt={alt}
            className={layerClass('base')}
            style={{ objectFit, width: '100%', height: '100%' }}
            onError={handleError}
            decoding="async"
          />
        )}
        {overlaySrc && (
          <img
            src={overlaySrc}
            alt=""
            aria-hidden
            className={layerClass('overlay')}
            style={{ objectFit, transition: LAYER_FADE }}
            onTransitionEnd={onOverlayTransitionEnd}
            onError={handleError}
            decoding="async"
          />
        )}
      </span>
    );
  }

  return (
    <Box
      ref={containerRef}
      className={`progressive-image ${className || ''}`.trim()}
      w={w}
      h={h}
      maxW={maxW}
      maxH={maxH}
      flexShrink={flexShrink}
      style={containerStyle}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      lineHeight={0}
      {...rest}
    >
      {baseSrc && (
        <Image
          src={baseSrc}
          alt={alt}
          className={layerClass('base')}
          w="100%"
          h="100%"
          objectFit={objectFit}
          loading="lazy"
          decoding="async"
          onError={handleError}
        />
      )}
      {overlaySrc && (
        <Image
          src={overlaySrc}
          alt=""
          aria-hidden
          className={layerClass('overlay')}
          position="absolute"
          inset={0}
          w="100%"
          h="100%"
          objectFit={objectFit}
          decoding="async"
          transition={LAYER_FADE}
          onTransitionEnd={onOverlayTransitionEnd}
          onError={handleError}
        />
      )}
    </Box>
  );
}
