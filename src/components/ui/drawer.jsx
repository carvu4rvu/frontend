import { 
  Drawer as ChakraDrawer, 
  DrawerOverlay as ChakraDrawerOverlay, 
  DrawerContent as ChakraDrawerContent, 
  DrawerCloseButton as ChakraDrawerCloseButton, 
  DrawerHeader as ChakraDrawerHeader, 
  DrawerBody as ChakraDrawerBody, 
  DrawerFooter as ChakraDrawerFooter, 
  Box 
} from "@chakra-ui/react"
import React from "react"

export const DrawerRoot = ({ open, onOpenChange, children, ...props }) => {
  return (
    <ChakraDrawer 
      isOpen={open} 
      onClose={() => onOpenChange({ open: false })} 
      {...props}
    >
        {children}
    </ChakraDrawer>
  )
}

export const DrawerBackdrop = ChakraDrawerOverlay
export const DrawerContent = ChakraDrawerContent
export const DrawerCloseTrigger = ChakraDrawerCloseButton
export const DrawerHeader = ChakraDrawerHeader
export const DrawerBody = ChakraDrawerBody
export const DrawerFooter = ChakraDrawerFooter
export const DrawerTitle = (props) => <Box fontWeight="bold" fontSize="lg" {...props} />
