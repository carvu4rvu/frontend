import React, { useEffect, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  IconButton,
  Box,
  Text,
  Flex,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from '@chakra-ui/icons';
import ProgressiveImage from './ProgressiveImage';

/**
 * Full-screen image viewer with prev/next navigation.
 * @param {string[]} images - resolved URL strings
 * @param {object} [project] - for snap_variants in progressive upgrades
 */
export default function ProjectImageLightbox({
  isOpen,
  onClose,
  images = [],
  initialIndex = 0,
  project = null,
}) {
  const [index, setIndex] = React.useState(0);
  const count = images.length;
  const current = count > 0 ? images[Math.min(index, count - 1)] : null;

  useEffect(() => {
    if (isOpen) {
      setIndex(Math.max(0, Math.min(initialIndex, Math.max(0, count - 1))));
    }
  }, [isOpen, initialIndex, count]);

  const goPrev = useCallback(() => {
    if (count <= 1) return;
    setIndex((i) => (i - 1 + count) % count);
  }, [count]);

  const goNext = useCallback(() => {
    if (count <= 1) return;
    setIndex((i) => (i + 1) % count);
  }, [count]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, goPrev, goNext, onClose]);

  if (!isOpen || !current) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" motionPreset="none" isCentered>
      <ModalOverlay bg="blackAlpha.900" />
      <ModalContent bg="transparent" boxShadow="none" maxW="100vw" maxH="100vh" m={0}>
        <ModalBody p={0} display="flex" alignItems="center" justifyContent="center" minH="100vh" position="relative">
          <IconButton
            icon={<CloseIcon />}
            aria-label="Close"
            position="absolute"
            top={4}
            right={4}
            zIndex={2}
            variant="ghost"
            color="white"
            size="lg"
            _hover={{ bg: 'whiteAlpha.200' }}
            onClick={onClose}
          />

          {count > 1 && (
            <>
              <IconButton
                icon={<ChevronLeftIcon boxSize={8} />}
                aria-label="Previous image"
                position="absolute"
                left={{ base: 2, md: 6 }}
                top="50%"
                transform="translateY(-50%)"
                zIndex={2}
                variant="ghost"
                color="white"
                size="lg"
                _hover={{ bg: 'whiteAlpha.200' }}
                onClick={goPrev}
              />
              <IconButton
                icon={<ChevronRightIcon boxSize={8} />}
                aria-label="Next image"
                position="absolute"
                right={{ base: 2, md: 6 }}
                top="50%"
                transform="translateY(-50%)"
                zIndex={2}
                variant="ghost"
                color="white"
                size="lg"
                _hover={{ bg: 'whiteAlpha.200' }}
                onClick={goNext}
              />
            </>
          )}

          <Box maxW="min(96vw, 1400px)" maxH="88vh" w="100%" px={{ base: 12, md: 20 }} py={12}>
            <ProgressiveImage
              key={current}
              src={current}
              project={project}
              profile="lightbox"
              priority={1}
              w="100%"
              maxW="100%"
              maxH="88vh"
              mx="auto"
              objectFit="contain"
            />
          </Box>

          {count > 1 && (
            <Flex
              position="absolute"
              bottom={6}
              left="50%"
              transform="translateX(-50%)"
              gap={2}
              align="center"
              bg="blackAlpha.600"
              px={4}
              py={2}
              borderRadius="full"
            >
              <Text color="white" fontSize="sm" fontWeight="medium">
                {index + 1} / {count}
              </Text>
            </Flex>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
