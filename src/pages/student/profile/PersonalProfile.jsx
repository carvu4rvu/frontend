import { Box, Button, HStack, Spinner, Center, Text, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, useToast, Badge, Flex, Link, Checkbox, Heading, Icon, Alert, AlertIcon, AlertTitle, AlertDescription } from "@chakra-ui/react"
import { FaClipboardCheck } from "react-icons/fa"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useBlocker, useBeforeUnload, Link as RouterLink } from "react-router-dom"
import { StudentProfileService } from "../../../services/studentProfile.service"
import { PlacementService } from "../../../services/placement.service"
import { useAuth } from "../../../context/AuthContext"
import { useProfileView } from "../../../context/ProfileViewContext"
import { useStudentDataCache } from "../../../context/StudentDataCacheContext"
import { usePlacementTrackPolicy } from "../../../context/PlacementTrackPolicyContext"
import { PersonalInformationForm } from "../../../components/student/forms/PersonalInformationForm"
import { AdminSectionLockControl } from "../../../components/student/AdminSectionLockControl"
import { calculateProfileCompletion } from "../../../utils/profileHelper"
import { getProfileErrorMessage, parseApiError, mapFieldErrorsToForm } from "../../../utils/profileErrorHelper"

/** Eligibility for opt-in: 95% completion and student must be marked eligible for placement/capstone. */
const MIN_COMPLETION_TO_OPT_IN = 95

export const PersonalProfile = () => {
  const toast = useToast()
  const { user } = useAuth()
  const profileView = useProfileView()
  const viewUsn = (profileView?.viewUsn || user?.usn || "").toString().trim().toUpperCase()
  const isReadOnly = profileView?.isReadOnly === true
  const isLocked = profileView?.isSectionLocked?.("personal") === true
  const canEdit = profileView?.isAdminView === true || (!isReadOnly && !isLocked)
  const { cache, fetchProfileDropdowns, fetchProfileSection, updateCache, invalidateProfile } = useStudentDataCache()
  const { policy: batchPolicy, refetch: refetchPlacementPolicy } = usePlacementTrackPolicy()
  const usn = viewUsn || user?.usn

  /** Show opt-in section only when student is individually marked as eligible for placement or capstone.
   *  This is set when admin saves the batch policy from the eligibility track page. */
  const canOptInToPlacement = Boolean(batchPolicy && (batchPolicy.is_placement_eligible === true || batchPolicy.is_capstone_eligible === true))

  const [data, setData] = useState(() => null)
  const [pageLoading, setPageLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [optInModalOpen, setOptInModalOpen] = useState(false)
  const [optInModalCompletion, setOptInModalCompletion] = useState(null)
  const [policyAgreed, setPolicyAgreed] = useState(false)
  const [optInSaving, setOptInSaving] = useState(false)
  const [pendingProfileImageFile, setPendingProfileImageFile] = useState(null)
  const [pendingProfileImagePreview, setPendingProfileImagePreview] = useState(null)
  const [fieldErrors, setFieldErrors] = useState(null)

  const initialDataRef = useRef(null)
  const loadInProgressRef = useRef(false)

  const dropdowns = cache.profile?.dropdowns || {}
  const majorOptions = dropdowns.majors || []
  const minorOptions = dropdowns.minors || []
  const specializationOptions = dropdowns.specializations || []
  const schoolOptions = dropdowns.schools || []
  const programOptions = dropdowns.programs || []
  const hasUnsavedChanges = useMemo(() => {
    if (!initialDataRef.current || !data) return false
    return JSON.stringify(initialDataRef.current) !== JSON.stringify(data)
  }, [data])

  // Block navigation when editing
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsavedChanges &&
      currentLocation.pathname !== nextLocation.pathname &&
      isEditing
  );

  // Handle browser refresh/close
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

  const isOwnProfile = viewUsn && user?.usn && viewUsn === (user.usn || "").toString().trim().toUpperCase()

  const loadPersonal = useCallback(async () => {
    if (!viewUsn) return
    if (loadInProgressRef.current) return
    loadInProgressRef.current = true
    setLoadError(null)
    setPageLoading(true)
    try {
      if (!cache.profile?.dropdowns) await fetchProfileDropdowns(true)
      let sectionData
      if (isOwnProfile) {
        invalidateProfile('personal')
        sectionData = await fetchProfileSection(viewUsn, 'personal', true)
      } else {
        sectionData = await StudentProfileService.getSection(viewUsn, 'personal')
      }
      const d = sectionData || {}
      setData(d)
      initialDataRef.current = d
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
      setPageLoading(false)
      loadInProgressRef.current = false
    }
  }, [viewUsn, isOwnProfile, invalidateProfile, cache.profile?.dropdowns, fetchProfileDropdowns, fetchProfileSection, toast])

  useEffect(() => {
    if (!viewUsn) return
    loadPersonal()
  }, [viewUsn, loadPersonal])

  const handleUpdate = (newData) => setData(newData)

  const handleProfileImageSelect = (file) => {
    if (!file) return
    if (pendingProfileImagePreview) {
      URL.revokeObjectURL(pendingProfileImagePreview)
    }
    const previewUrl = URL.createObjectURL(file)
    setPendingProfileImageFile(file)
    setPendingProfileImagePreview(previewUrl)
  }

  const handleSave = async () => {
    if (!canEdit || saving) return
    if (!hasUnsavedChanges) return
    // Front-end validation: gender must be present
    const genderVal = (data?.gender || "").toString().trim()
    if (!genderVal) {
      setFieldErrors({ gender: "Gender is required." })
      toast({ title: "Validation error", description: "Gender is required.", status: "warning", duration: 4000, isClosable: true })
      return false
    }

    // Front-end validation: blood group must be present
    const bloodGroupVal = (data?.bloodGroup ?? data?.blood_group ?? "").toString().trim()
    if (!bloodGroupVal) {
      setFieldErrors({ blood_group: "Blood group is required." })
      toast({ title: "Validation error", description: "Blood group is required.", status: "warning", duration: 4000, isClosable: true })
      return false
    }
    setSaving(true)
    try {
      let payload = { ...data }
      if (pendingProfileImageFile && viewUsn) {
        const uploadResult = await StudentProfileService.uploadFile(viewUsn, pendingProfileImageFile, { folder: "profile-image" })
        const url = uploadResult?.url || uploadResult?.path
        if (url) {
          payload = { ...payload, profileImage: url, profile_image: url }
          setData(payload)
        }
      }

      // Ensure backend receives camelCase fields as snake_case (personal section)
      if (payload.bloodGroup !== undefined) payload.blood_group = payload.bloodGroup
      if (payload.speciallyAbled !== undefined) payload.specially_abled = payload.speciallyAbled
      if (payload.dateOfBirth !== undefined) payload.date_of_birth = payload.dateOfBirth
      if (payload.majorId !== undefined) payload.major_id = payload.majorId
      if (payload.minorId !== undefined) payload.minor_id = payload.minorId
      if (payload.specializationId !== undefined) payload.specialization_id = payload.specializationId

      await StudentProfileService.saveSection(viewUsn, "personal", payload)
      initialDataRef.current = payload
      const fresh = isOwnProfile ? await fetchProfileSection(viewUsn, 'personal', true) : await StudentProfileService.getSection(viewUsn, 'personal')
      if (fresh) {
        setData(fresh)
        initialDataRef.current = fresh
      }

      if (pendingProfileImagePreview) {
        URL.revokeObjectURL(pendingProfileImagePreview)
      }
      setPendingProfileImageFile(null)
      setPendingProfileImagePreview(null)

      toast({
        title: "Changes saved successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
      setIsEditing(false)
      setFieldErrors(null)
      return true
    } catch (error) {
      const parsed = parseApiError(error)
      const msg = parsed.message || "Error saving data"
      if (parsed.fieldErrors) {
        setFieldErrors(mapFieldErrorsToForm(parsed.fieldErrors, {
          fullName: "full_name",
          full_name: "full_name",
          phoneNumber: "phone_number",
          dateOfBirth: "date_of_birth",
          personalEmail: "personal_email",
          phoneCountryCode: "phone_country_code",
          bloodGroup: "blood_group",
          blood_group: "blood_group"
        }))
      } else {
        setFieldErrors(null)
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

  // Auto-exit edit mode if no changes (optional improvement)
  useEffect(() => {
    if (isEditing && !hasUnsavedChanges && initialDataRef.current) {
       // Optional: setIsEditing(false) - user might want to stay in edit mode though.
       // Keeping user choice for now as per "Optional" tag in review.
    }
  }, [isEditing, hasUnsavedChanges])

  const isOptedIn = data?.opt_in === true || data?.optIn === true

  /** Get overall profile completion (0–100). Used to enforce minimum completion before opt-in. */
  const getOverallCompletion = useCallback(async () => {
    if (!usn) return 0
    const profileData = await StudentProfileService.getFullProfile(usn)
    const raw = profileData?.data ?? profileData ?? {}
    const formatted = {
      ...raw,
      usn: raw?.usn ?? usn,
      personal: raw?.personal ?? {},
      contact: raw?.contact ?? {},
      communication: raw?.contact ?? raw?.communication ?? {},
    }
    const pct = calculateProfileCompletion(formatted)
    return Number.isFinite(pct) ? Math.min(100, Math.max(0, Math.round(pct))) : 0
  }, [usn])

  const handleOpenOptInModal = async () => {
    const completion = await getOverallCompletion()
    if (completion < MIN_COMPLETION_TO_OPT_IN) {
      toast({
        title: "Profile completion too low",
        description: `Your profile must be at least ${MIN_COMPLETION_TO_OPT_IN}% complete to opt in. Current: ${completion}%.`,
        status: "warning",
        duration: 5000,
        isClosable: true,
      })
      return
    }
    setOptInModalCompletion(completion)
    setPolicyAgreed(false)
    setOptInModalOpen(true)
  }

  const handleConfirmOptIn = async () => {
    if (!policyAgreed || !usn) return
    const completion = await getOverallCompletion()
    if (completion < MIN_COMPLETION_TO_OPT_IN) {
      toast({
        title: "Cannot opt in",
        description: `Profile completion is ${completion}%. Minimum ${MIN_COMPLETION_TO_OPT_IN}% required.`,
        status: "warning",
        duration: 5000,
        isClosable: true,
      })
      setOptInModalOpen(false)
      return
    }
    setOptInSaving(true)
    try {
      // Double-check required fields before sending opt-in request
      const latestPersonal = await fetchProfileSection(usn, 'personal', true)
      const latestContact = await fetchProfileSection(usn, 'contact', true)
      const fullName = (latestPersonal?.full_name || latestPersonal?.fullName || data?.full_name || data?.fullName || "").toString().trim()
      const personalEmail = (latestContact?.personal_email || latestContact?.personalEmail || "").toString().trim()
      const phoneNumber = (latestContact?.phone_number || latestContact?.phoneNumber || "").toString().replace(/\D/g, "")

      if (!fullName) {
        setFieldErrors({ full_name: "Full name is required before opting in." })
        toast({ title: "Cannot opt in", description: "Full name is required before opting in.", status: "warning", duration: 5000, isClosable: true })
        setOptInSaving(false)
        return
      }
      if (!personalEmail && !phoneNumber) {
        setFieldErrors({ contact: "Provide at least one contact (email or phone) before opting in." })
        toast({ title: "Cannot opt in", description: "Provide at least one contact (email or phone) before opting in.", status: "warning", duration: 5000, isClosable: true })
        setOptInSaving(false)
        return
      }

      await StudentProfileService.saveSection(usn, "personal", {
        ...data,
        opt_in: true,
        has_agreed_placement_policy: true,
        optIn: true,
        hasAgreedPlacementPolicy: true,
      })
      const updated = { ...data, opt_in: true, optIn: true, has_agreed_placement_policy: true, hasAgreedPlacementPolicy: true }
      setData(updated)
      initialDataRef.current = updated
      // Update profile cache so opt-in state is stored and persisted across nav
      updateCache('profile', { sections: { ...cache.profile?.sections, personal: updated } })
      await fetchProfileSection(usn, 'personal', true)
      // Refresh placement policy so nav bar (Placement Drives, Job Offers) updates without reload
      refetchPlacementPolicy()
      setOptInModalOpen(false)
      setPolicyAgreed(false)
      toast({
        title: "You have opted in to placement",
        description: "You have agreed to the placement policy.",
        status: "success",
        duration: 4000,
        isClosable: true,
      })
    } catch (err) {
      const parsed = parseApiError(err)
      const msg = parsed.message || getProfileErrorMessage(err)
      if (parsed.fieldErrors) {
        setFieldErrors(mapFieldErrorsToForm(parsed.fieldErrors, { fullName: "full_name", full_name: "full_name", personalEmail: "personal_email", phoneNumber: "phone_number" }))
      }
      toast({
        title: "Failed to opt in",
        description: msg,
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setOptInSaving(false)
    }
  }

  const hasDataToShow = data !== null && data !== undefined
  const isLoading = pageLoading && !hasDataToShow
  if (loadError && !hasDataToShow) {
    return (
      <Box p={8}>
        <Alert status="error" borderRadius="md" flexDirection={{ base: "column", md: "row" }} alignItems="stretch">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Could not load personal details</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Box>
          <Button size="sm" colorScheme="red" variant="outline" alignSelf="center" onClick={loadPersonal}>
            Retry
          </Button>
        </Alert>
      </Box>
    )
  }
  if (isLoading || !hasDataToShow) {
    return (
      <Center h="50vh">
        <Spinner size="xl" color="#d4a960" />
      </Center>
    )
  }

  return (
    <Box maxW="5xl" mx="auto" position="relative" pt={8}>
        <Heading size="md" mb={6}>Personal Information</Heading>
        {isLocked && (
          <Alert status="info" mb={4} borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>View only</AlertTitle>
              <AlertDescription>This section is locked by the administrator. You cannot edit it.</AlertDescription>
            </Box>
          </Alert>
        )}
        <PersonalInformationForm
          data={data}
          onUpdate={handleUpdate}
          isEditing={canEdit && isEditing}
          fieldErrors={fieldErrors}
          mode="student"
          majorOptions={majorOptions}
          minorOptions={minorOptions}
          specializationOptions={specializationOptions}
          schoolOptions={schoolOptions}
          programOptions={programOptions}
          pendingProfileImagePreview={pendingProfileImagePreview}
          onProfileImageSelect={handleProfileImageSelect}
        />

        {/* Placement opt-in section: only when batch policy allows placement or capstone (and own profile) */}
        {canOptInToPlacement && isOwnProfile && (
          <Box mt={8} p={6} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.200">
            <HStack spacing={2} mb={2}>
              <Icon as={FaClipboardCheck} color="#1a202c" boxSize={5} />
              <Text fontWeight="semibold" color="#20343c">Placement opt-in</Text>
            </HStack>
            {isOptedIn ? (
              <HStack>
                <Badge colorScheme="green" fontSize="sm">Opted in</Badge>
                <Text fontSize="sm" color="gray.700">You have agreed to the placement policy and are opted in to the placement track. Opt-in cannot be reverted.</Text>
              </HStack>
            ) : (
              <>
                <Text fontSize="sm" color="gray.600" mb={4}>
                  Opt in to participate in placement drives. You must read and agree to the placement policy before opting in. Once opted in, you cannot revert.
                </Text>
                <Button
                  bg="#d4a960"
                  color="#20343c"
                  _hover={{ bg: "#c39850" }}
                  size="md"
                  onClick={handleOpenOptInModal}
                >
                  Opt in to placement
                </Button>
              </>
            )}
          </Box>
        )}
        
        <HStack justifyContent="flex-end" mt={8} pb={10} minH="44px" spacing={3}>
            <AdminSectionLockControl sectionKey="personal" label="Personal information" />
            {canEdit && (
            <>
            {!isEditing ? (
                    <Button 
                        bg="#d4a960" 
                        color="#20343c" 
                        _hover={{ bg: "#c39850" }} 
                        size="lg"
                        onClick={() => setIsEditing(true)}
                        flexShrink={0}
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
                            isDisabled={pageLoading || saving || !hasUnsavedChanges}
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

        {/* Opt-in confirmation modal */}
        <Modal isOpen={optInModalOpen} onClose={() => !optInSaving && setOptInModalOpen(false)} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Opt in to placement</ModalHeader>
            <ModalCloseButton isDisabled={optInSaving} />
            <ModalBody>
              {optInModalCompletion != null && (
                <Text mb={3} fontSize="sm" color="gray.700">
                  Your profile completion: <strong>{optInModalCompletion}%</strong> (minimum {MIN_COMPLETION_TO_OPT_IN}% required).
                </Text>
              )}
              <Text mb={4}>
                To opt in to the placement track, you must read and agree to the Placement Policy.
              </Text>
              <Link
                as={RouterLink}
                to="/student/placements/policy"
                color="#d4a960"
                fontWeight="medium"
                onClick={() => setOptInModalOpen(false)}
              >
                View Placement Policy →
              </Link>
              <Box mt={4}>
                <Checkbox
                  isChecked={policyAgreed}
                  onChange={(e) => setPolicyAgreed(e.target.checked)}
                  colorScheme="yellow"
                  size="lg"
                >
                  I have read and agree to the Placement Policy
                </Checkbox>
              </Box>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setOptInModalOpen(false)} isDisabled={optInSaving}>
                Cancel
              </Button>
              <Button
                bg="#d4a960"
                color="#20343c"
                _hover={{ bg: "#c39850" }}
                onClick={handleConfirmOptIn}
                isDisabled={!policyAgreed}
                isLoading={optInSaving}
                loadingText="Opting in..."
              >
                Opt in
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

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
