/**
 * Reusable styled file input - replaces default "Choose file" / "No file chosen" with a consistent UI.
 * Used across student forms, admin pages, etc.
 */

import { Box, Input, Text, Spinner } from "@chakra-ui/react"
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
  { accept, onChange, acceptLabel, disabled, multiple, isLoading = false, loadingLabel, ...rest },
  ref
) {
  const label = acceptLabel ?? getAcceptLabel(accept)
  const busy = Boolean(isLoading)
  const inactive = disabled || busy

  return (
    <Box
      as="label"
      cursor={inactive ? "not-allowed" : "pointer"}
      display="inline-flex"
      alignItems="center"
      gap={3}
      px={4}
      py={3}
      borderRadius="lg"
      border="2px dashed"
      borderColor={busy ? "#03C03C" : "gray.300"}
      bg={busy ? "green.50" : "gray.50"}
      opacity={disabled && !busy ? 0.6 : 1}
      pointerEvents={inactive ? "none" : "auto"}
      _hover={
        inactive
          ? {}
          : { borderColor: "#d4a960", bg: "orange.50" }
      }
      _dark={{
        borderColor: busy ? "#03C03C" : "gray.600",
        bg: busy ? "green.900" : "gray.800",
        _hover: inactive ? {} : { borderColor: "#d4a960", bg: "whiteAlpha.100" },
      }}
      transition="all 0.2s"
      w={rest.w}
      {...rest}
    >
      <Input
        ref={ref}
        type="file"
        accept={accept}
        onChange={onChange}
        display="none"
        disabled={inactive}
        multiple={multiple}
      />
      <Box as="span" color="#d4a960" fontSize="xl" flexShrink={0} display="inline-flex">
        {busy ? <Spinner size="sm" color="#03C03C" thickness="3px" /> : <FaCloudUploadAlt />}
      </Box>
      <Box>
        <Text fontWeight="semibold" color="gray.700" _dark={{ color: "gray.200" }}>
          {busy ? (loadingLabel || "Uploading…") : "Choose file"}
        </Text>
        <Text fontSize="sm" color="gray.500" _dark={{ color: "gray.400" }}>
          {busy ? "Please wait" : label}
        </Text>
      </Box>
    </Box>
  )
})
