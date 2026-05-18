/**
 * Reusable styled file input - replaces default "Choose file" / "No file chosen" with a consistent UI.
 * Used across student forms, admin pages, etc.
 */

import { Box, Input, Text } from "@chakra-ui/react"
import { FaCloudUploadAlt } from "react-icons/fa"
import React from "react"

const DEFAULT_ACCEPT_LABEL = "PDF, JPG, PNG"

/** Derive a human-readable label from accept string */
function getAcceptLabel(accept) {
  if (!accept) return DEFAULT_ACCEPT_LABEL
  if (accept.includes("image/*")) return "Images"
  if (accept.includes("application/pdf")) return "PDF"
  if (accept.includes(".csv") || accept.includes(".xlsx")) return "CSV, XLSX"
  if (accept.includes("image/*,.pdf")) return "Image, PDF"
  return DEFAULT_ACCEPT_LABEL
}

export const StyledFileInput = React.forwardRef(function StyledFileInput(
  { accept, onChange, acceptLabel, disabled, multiple, ...rest },
  ref
) {
  const label = acceptLabel ?? getAcceptLabel(accept)

  return (
    <Box
      as="label"
      cursor={disabled ? "not-allowed" : "pointer"}
      display="inline-flex"
      alignItems="center"
      gap={3}
      px={4}
      py={3}
      borderRadius="lg"
      border="2px dashed"
      borderColor="gray.300"
      bg="gray.50"
      opacity={disabled ? 0.6 : 1}
      pointerEvents={disabled ? "none" : "auto"}
      _hover={
        disabled
          ? {}
          : { borderColor: "#d4a960", bg: "orange.50" }
      }
      _dark={{
        borderColor: "gray.600",
        bg: "gray.800",
        _hover: disabled ? {} : { borderColor: "#d4a960", bg: "whiteAlpha.100" },
      }}
      transition="all 0.2s"
      {...rest}
    >
      <Input
        ref={ref}
        type="file"
        accept={accept}
        onChange={onChange}
        display="none"
        disabled={disabled}
        multiple={multiple}
      />
      <Box as="span" color="#d4a960" fontSize="xl" flexShrink={0} display="inline-flex">
        <FaCloudUploadAlt />
      </Box>
      <Box>
        <Text fontWeight="semibold" color="gray.700" _dark={{ color: "gray.200" }}>
          Choose file
        </Text>
        <Text fontSize="sm" color="gray.500" _dark={{ color: "gray.400" }}>
          {label}
        </Text>
      </Box>
    </Box>
  )
})
