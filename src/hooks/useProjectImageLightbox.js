import { useState, useCallback } from 'react';
import { getProjectLightboxImages, indexInLightboxImages, resolveSnapUrl } from '../utils/projectSnaps';

/**
 * @returns {{ openProjectImages, openImages, closeLightbox, lightboxProps }}
 */
export function useProjectImageLightbox() {
  const [lightbox, setLightbox] = useState({ isOpen: false, images: [], index: 0, project: null });

  const openImages = useCallback((images, startIndex = 0, project = null) => {
    const list = (Array.isArray(images) ? images : [])
      .map((u) => (typeof u === 'string' ? u.trim() : resolveSnapUrl(u)))
      .filter(Boolean);
    if (!list.length) return;
    const idx = Math.max(0, Math.min(startIndex, list.length - 1));
    setLightbox({ isOpen: true, images: list, index: idx, project });
  }, []);

  const openProjectImages = useCallback((project, startUrlOrIndex = 0) => {
    const images = getProjectLightboxImages(project);
    if (!images.length) return;

    if (typeof startUrlOrIndex === 'number') {
      openImages(images, startUrlOrIndex, project);
      return;
    }

    const clicked = resolveSnapUrl(startUrlOrIndex);
    if (clicked) {
      const exactIdx = images.findIndex(
        (u) => u === clicked || resolveSnapUrl(u) === clicked
      );
      if (exactIdx >= 0) {
        openImages(images, exactIdx, project);
        return;
      }
      openImages(
        [clicked, ...images.filter((u) => resolveSnapUrl(u) !== clicked && u !== clicked)],
        0,
        project
      );
      return;
    }

    openImages(images, indexInLightboxImages(images, startUrlOrIndex), project);
  }, [openImages]);

  const closeLightbox = useCallback(() => {
    setLightbox((s) => ({ ...s, isOpen: false }));
  }, []);

  return {
    openProjectImages,
    openImages,
    closeLightbox,
    lightboxProps: {
      isOpen: lightbox.isOpen,
      onClose: closeLightbox,
      images: lightbox.images,
      initialIndex: lightbox.index,
      project: lightbox.project,
    },
  };
}
