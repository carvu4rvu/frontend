import { FormControl, FormLabel, FormHelperText, FormErrorMessage, Box } from "@chakra-ui/react"
import React from "react"

export const Field = React.forwardRef(function Field(props, ref) {
  const { label, children, helperText, errorText, optionalText, ...rest } = props
  return (
    <FormControl ref={ref} isInvalid={!!errorText} {...rest}>
      {label && (
        <FormLabel>
          {label}
          {optionalText && <Box as="span" fontWeight="normal" color="gray.600"> {optionalText}</Box>}
        </FormLabel>
      )}
      {children}
      {helperText && <FormHelperText>{helperText}</FormHelperText>}
      {errorText && <FormErrorMessage mt={1} display="block">{errorText}</FormErrorMessage>}
    </FormControl>
  )
})
