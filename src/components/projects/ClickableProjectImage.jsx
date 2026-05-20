import React from 'react';
import { Image, Box } from '@chakra-ui/react';
import { getFileUrl } from '../../utils/fileUrl';

/**
 * Project image that opens lightbox on click (stops event propagation).
 */
export default function ClickableProjectImage({
  src,
  onImageClick,
  imageIndex = 0,
  alt = '',
  cursor = 'zoom-in',
  onClick,
  onError,
  ...imageProps
}) {
  const handleClick = (e) => {
    e.stopPropagation();
    if (onImageClick) onImageClick(e, imageIndex);
    else if (onClick) onClick(e);
  };

  if (!src) {
    return <Box {...imageProps} bg="gray.100" />;
  }

  return (
    <Image
      src={getFileUrl(src)}
      alt={alt}
      cursor={onImageClick || onClick ? cursor : undefined}
      onClick={onImageClick || onClick ? handleClick : undefined}
      onError={onError || ((e) => { e.target.style.display = 'none'; })}
      {...imageProps}
    />
  );
}
