import { Box, Button, HStack, Spinner, Center, Text, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, useToast, Badge, Flex, Heading, Icon, Alert, AlertIcon, AlertTitle, AlertDescription } from "@chakra-ui/react"
import { FaAddressBook } from "react-icons/fa"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useNavigate, useBlocker, useBeforeUnload } from "react-router-dom"
import { StudentProfileService } from "../../../services/studentProfile.service"
import { useAuth } from "../../../context/AuthContext"
import { useProfileView } from "../../../context/ProfileViewContext"
import { useStudentDataCache } from "../../../context/StudentDataCacheContext"
import { ContactLinksForm } from "../../../components/student/forms/ContactLinksForm"
import { AdminSectionLockControl } from "../../../components/student/AdminSectionLockControl"
import { getProfileErrorMessage, parseApiError } from "../../../utils/profileErrorHelper"

export const ContactProfile = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const profileView = useProfileView()
  const viewUsn = (profileView?.viewUsn || user?.usn || "").toString().trim().toUpperCase()
  const isReadOnly = profileView?.isReadOnly === true
  const isLocked = profileView?.isSectionLocked?.("contact") === true
  const canEdit = profileView?.isAdminView === true || (!isReadOnly && !isLocked)
  const isOwnProfile = viewUsn && user?.usn && viewUsn === (user.usn || "").toString().trim().toUpperCase()
  const { cache, fetchProfileSection, invalidateProfile } = useStudentDataCache()
  const usn = viewUsn || user?.usn
  const toast = useToast()

  const normalizeLinks = (finalData) => {
    let links = finalData?.links
    if (!links) links = []
    else if (!Array.isArray(links) && typeof links === 'object') {
      links = Object.entries(links).map(([k, v]) => ({ name: k, url: v }))
    } else if (!Array.isArray(links)) links = []
    return { ...(finalData || {}), links }
  }

  const [data, setData] = useState(() => null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const initialDataRef = useRef(null)
  const loadInProgressRef = useRef(false)

  const hasUnsavedChanges = useMemo(() => {
    if (!initialDataRef.current || !data) return false
    return JSON.stringify(initialDataRef.current) !== JSON.stringify(data)
  }, [data])

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges && 
      currentLocation.pathname !== nextLocation.pathname && 
      isEditing
  );

  useBeforeUnload(
    useCallback(
      (event) => {
        if (hasUnsavedChanges) {
          event.preventDefault();
          event.returnValue = "";
        }
      },
      [hasUnsavedChanges]
    )
  );

  const loadContact = useCallback(async () => {
    if (!viewUsn) return
    if (loadInProgressRef.current) return
    loadInProgressRef.current = true
    setLoadError(null)
    setLoading(true)
    const startedAt = Date.now()
    const MIN_LOADING_MS = 200
    try {
      let sectionData
      if (isOwnProfile) {
        invalidateProfile('contact')
        sectionData = await fetchProfileSection(viewUsn, 'contact', true)
      } else {
        sectionData = await StudentProfileService.getSection(viewUsn, 'contact')
      }
      const finalData = normalizeLinks(sectionData || {})
      setData(finalData)
      initialDataRef.current = finalData
    } catch (error) {
      const msg = getProfileErrorMessage(error)
      setLoadError(msg)
      toast({
        title: "Error loading data",
        description: msg,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      const elapsed = Date.now() - startedAt
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed)
      setTimeout(() => {
        setLoading(false)
        loadInProgressRef.current = false
      }, remaining)
    }
  }, [viewUsn, isOwnProfile, invalidateProfile, fetchProfileSection, toast])

  useEffect(() => {
    if (!viewUsn) return
    loadContact()
  }, [viewUsn, loadContact])

  const handleUpdate = (newData) => setData(newData)

  const handleSave = async () => {
      if (!canEdit || saving) return
      if (!hasUnsavedChanges) return
      setFieldErrors({})
      const personalEmail = (data?.personalEmail ?? data?.personal_email ?? "").toString().trim()
      const phoneNumber = (data?.phoneNumber ?? data?.phone_number ?? "").toString().replace(/\D/g, "")
      const collegeEmail = (data?.collegeEmail ?? data?.college_email ?? "").toString().trim()

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const errors = {}

      // Email and phone are ALWAYS mandatory (never allow null/empty)
      if (!personalEmail || !emailRegex.test(personalEmail)) {
        errors.personalEmail = "Enter a valid personal email (cannot be cleared).";
      }
      if (!phoneNumber || phoneNumber.length !== 10) {
        errors.phoneNumber = "Enter a valid 10-digit phone number (cannot be cleared).";
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors)
        toast({ title: "Validation error", description: "Please fix contact details before saving.", status: "warning", duration: 5000, isClosable: true })
        return
      }
      setSaving(true)
      try {
          const payload = JSON.parse(JSON.stringify(data))
          if (!Array.isArray(payload.links)) payload.links = []

          await StudentProfileService.saveSection(viewUsn, 'contact', payload)
          initialDataRef.current = structuredClone(data)
          const fresh = isOwnProfile ? await fetchProfileSection(viewUsn, 'contact', true) : await StudentProfileService.getSection(viewUsn, 'contact')
          if (fresh) {
            const normalized = normalizeLinks(fresh)
            setData(normalized)
            initialDataRef.current = normalized
          }
          
          toast({
              title: "Changes saved successfully",
              status: "success",
              duration: 3000,
              isClosable: true,
          })
          setFieldErrors({})
          setIsEditing(false)
          return true
      } catch (error) {
          const parsed = parseApiError(error)
          const msg = parsed.message || getProfileErrorMessage(error)
          // Set field errors if returned by API
          if (parsed.fieldErrors && Object.keys(parsed.fieldErrors).length > 0) {
              setFieldErrors(parsed.fieldErrors)
          } else {
              setFieldErrors({})
          }
          toast({
              title: "Error saving data",
              description: msg,
              status: "error",
              duration: 5000,
              isClosable: true,
          })
          return false
      } finally {
          setSaving(false)
      }
  }

  // Auto-exit edit mode if no changes
  useEffect(() => {
    if (isEditing && !hasUnsavedChanges && initialDataRef.current) {
        // Optional: setIsEditing(false)
    }
  }, [isEditing, hasUnsavedChanges])

  const hasDataToShow = data !== null && data !== undefined
  if (loadError && !hasDataToShow) {
    return (
      <Box p={8}>
        <Alert status="error" borderRadius="md" flexDirection={{ base: "column", md: "row" }} alignItems="stretch">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Could not load contact details</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Box>
          <Button size="sm" colorScheme="red" variant="outline" alignSelf="center" onClick={loadContact}>
            Retry
          </Button>
        </Alert>
      </Box>
    )
  }
  if ((loading && !hasDataToShow) || !hasDataToShow) {
    return (
      <Center h="50vh">
        <Spinner size="xl" color="#d4a960" />
      </Center>
    )
  }

    return (
      <Box maxW="5xl" mx="auto" position="relative" pt={8}>
          <HStack spacing={2} mb={6}>
            <Icon as={FaAddressBook} color="#d4a960" boxSize={6} />
            <Heading size="md">Contact Details</Heading>
          </HStack>
          {isLocked && (
            <Alert status="info" mb={4} borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle>View only</AlertTitle>
                <AlertDescription>This section is locked by the administrator. You cannot edit it.</AlertDescription>
              </Box>
            </Alert>
          )}
          <ContactLinksForm
            data={data}
            onUpdate={handleUpdate}
            isEditing={canEdit && isEditing}
            mode="student"
            fieldErrors={fieldErrors}
        />
        
        <HStack justifyContent="flex-end" mt={8} pb={10} spacing={3}>
            <AdminSectionLockControl sectionKey="contact" label="Contact details" />
            {canEdit && (
            <>
            {!isEditing ? (
                    <Button 
                        bg="#d4a960" 
                        color="#20343c" 
                        _hover={{ bg: "#c39850" }} 
                        size="lg"
                        onClick={() => setIsEditing(true)}
                        isDisabled={loading}
                    >
                        Add/Edit
                    </Button>
                ) : (
                    <>
                        <Button 
                            bg="#d4a960" 
                            color="#20343c" 
                            _hover={{ bg: "#c39850" }} 
                            size="lg"
                            isLoading={saving}
                            loadingText="Saving..."
                            onClick={handleSave}
                            isDisabled={loading || saving || !hasUnsavedChanges}
                            title={!hasUnsavedChanges ? "No changes to save." : undefined}
                        >
                            Save Changes
                        </Button>
                        <Button 
                            ml={4}
                            variant="outline"
                            colorScheme="red"
                            size="lg"
                            onClick={() => {
                                setData(structuredClone(initialDataRef.current || {}));
                                setIsEditing(false);
                            }}
                            isDisabled={saving}
                        >
                            Cancel
                        </Button>
                    </>
                )
            }
            </>
            )}
        </HStack>

        {/* Navigation Block Modal */}
        {blocker.state === "blocked" && (
            <Modal isOpen={true} onClose={() => blocker.reset()} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Unsaved Changes</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Text>
                            You have unsaved changes. Do you want to save them before leaving?
                        </Text>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={() => blocker.reset()}>
                            Stay on this page
                        </Button>
                        <Button 
                            colorScheme="red" 
                            variant="outline" 
                            mr={3} 
                            onClick={() => blocker.proceed()}
                        >
                            Discard Changes
                        </Button>
                        <Button 
                            bg="#d4a960" 
                            color="#20343c"
                            _hover={{ bg: "#c39850" }}
                            onClick={async () => {
                                if (saving) return
                                const success = await handleSave()
                                if (success) {
                                    blocker.proceed()
                                }
                            }}
                            isLoading={saving}
                        >
                            Save & Leave
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        )}
      </Box>
  )
}
