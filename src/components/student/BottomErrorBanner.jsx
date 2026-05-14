import { useEffect, useRef } from "react"
import { Box, Flex, Text, IconButton, Icon } from "@chakra-ui/react"
import { FaExclamationCircle } from "react-icons/fa"
import { MdClose } from "react-icons/md"

/**
 * Fixed bottom error banner matching the design:
 * Red background, white icon, bold title, secondary description, close button.
 * Use instead of top alerts on education, academics, and parents profile pages.
 * If autoCloseSeconds > 0 and onClose is provided, the banner auto-dismisses after that many seconds.
 */
export function BottomErrorBanner({ title = "Error saving data", description = "Please correct the errors below.", onClose, autoCloseSeconds = 0, ...props }) {
  const timerRef = useRef(null)

  useEffect(() => {
    if (autoCloseSeconds > 0 && onClose && typeof onClose === "function") {
      timerRef.current = setTimeout(onClose, autoCloseSeconds * 1000)
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current)
      }
    }
  }, [autoCloseSeconds, onClose])

  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      zIndex={1400}
      px={{ base: 3, md: 4 }}
      py={3}
      {...props}
    >
      <Box
        maxW="2xl"
        mx="auto"
        bg="#d93025"
        color="white"
        px={{ base: 4, md: 5 }}
        py={3}
        borderRadius="lg"
        boxShadow="lg"
      >
        <Flex align="flex-start" justify="space-between" gap={4}>
        <Flex align="flex-start" gap={3} flex={1}>
          <Icon as={FaExclamationCircle} boxSize={6} mt={0.5} flexShrink={0} color="white" aria-hidden />
          <Box>
            <Text fontWeight="bold" fontSize="md">
              {title}
            </Text>
            <Text fontSize="sm" opacity={0.95} mt={0.5}>
              {description}
            </Text>
          </Box>
        </Flex>
        {onClose && (
          <IconButton
            aria-label="Close"
            icon={<MdClose />}
            variant="ghost"
            color="white"
            _hover={{ bg: "rgba(255,255,255,0.2)" }}
            size="sm"
            onClick={onClose}
            flexShrink={0}
          />
        )}
      </Flex>
      </Box>
    </Box>
  )
}
