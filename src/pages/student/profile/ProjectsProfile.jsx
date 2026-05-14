import { Box, Button, HStack, Spinner, Center, Text, useToast, Icon, Alert, AlertIcon, AlertTitle, AlertDescription } from "@chakra-ui/react"
import { FaStore, FaEdit } from "react-icons/fa"
import "./ProjectsProfile.css"
import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { StudentProfileService } from "../../../services/studentProfile.service"
import { useAuth } from "../../../context/AuthContext"
import { useProfileView } from "../../../context/ProfileViewContext"
import { ProjectsForm } from "../../../components/student/forms/ProjectsForm"
import { ProjectShowcase } from "../../../components/student/projects/ProjectShowcase"
import { toSnakeCase } from "../../../utils/stringUtils"
import { AdminSectionLockControl } from "../../../components/student/AdminSectionLockControl"
import { getProfileErrorMessage, parseApiError, mapIndexedFieldErrors } from "../../../utils/profileErrorHelper"

export const ProjectsProfile = () => {
  const { user } = useAuth()
  const profileView = useProfileView()
  const viewUsn = (profileView?.viewUsn || user?.usn || "").toString().trim().toUpperCase()
  const isReadOnly = profileView?.isReadOnly === true
  const isLocked = profileView?.isSectionLocked?.("projects") === true
  const canEdit = profileView?.isAdminView === true || (!isReadOnly && !isLocked)
  const usn = viewUsn || user?.usn
  const toast = useToast()
  
  const [tabIndex, setTabIndex] = useState(0)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [pendingFiles, setPendingFiles] = useState({}) // { projectIndex: { snapIndex: file } }
  const [lastFieldErrors, setLastFieldErrors] = useState(null) // API validation errors by row
  const [hasPriorityError, setHasPriorityError] = useState(false) // UX: duplicate or invalid priority

  // Ref for cancel functionality
  const initialDataRef = useRef([])
  // Ref for the content area below the tab bar (remaining area excluding top nav, side nav, tab bar)
  const contentAreaRef = useRef(null)

  const hasUnsavedChanges = useMemo(() => {
    const dataChanged = JSON.stringify(initialDataRef.current) !== JSON.stringify(data)
    const hasPendingFiles = Object.keys(pendingFiles || {}).length > 0
    return dataChanged || hasPendingFiles
  }, [data, pendingFiles])

  const fetchData = useCallback(async () => {
    if (!viewUsn) return
    setLoadError(null)
    setLoading(true)
    try {
      const sectionData = await StudentProfileService.getSection(viewUsn, "projects")
      const projects = Array.isArray(sectionData) ? sectionData : (sectionData?.projects || [])
      setData(projects)
      initialDataRef.current = projects
    } catch (error) {
      const msg = getProfileErrorMessage(error)
      setLoadError(msg)
      setData([])
      initialDataRef.current = []
      toast({
        title: "Error loading data",
        description: msg,
        status: "error",
        duration: 7000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }, [viewUsn, toast])

  useEffect(() => {
    if (!viewUsn) return
    fetchData()
  }, [viewUsn, fetchData])

  const fieldErrorsByRow = useMemo(() => {
    if (!lastFieldErrors) return null
    return mapIndexedFieldErrors(lastFieldErrors, "projects")
  }, [lastFieldErrors])

  const handleUpdate = (newData) => setData(newData)

  const handleFileSelect = (projectIndex, file) => {
    setPendingFiles((prev) => {
      const projectFiles = prev[projectIndex] || {}
      const snapIndex = Object.keys(projectFiles).length
      return {
        ...prev,
        [projectIndex]: {
          ...projectFiles,
          [snapIndex]: file
        }
      }
    })
  }

  const handleSave = async () => {
      if (!canEdit || !hasUnsavedChanges) return
      setSaving(true)
      try {
          let updatedData = [...data]
          
          // Upload pending project snaps
          const projectEntries = Object.entries(pendingFiles)
          for (const [projectIndexStr, snapFiles] of projectEntries) {
            const projectIndex = Number(projectIndexStr)
            const project = updatedData[projectIndex]
            if (!project) continue

            const snapEntries = Object.entries(snapFiles)
            const currentSnaps = Array.isArray(project.project_snaps) 
              ? project.project_snaps 
              : (project.project_snaps ? [project.project_snaps] : [])

            for (const [snapIndexStr, file] of snapEntries) {
              try {
                const result = await StudentProfileService.uploadFile(viewUsn, file, { folder: "projects" })
                const url = result?.url || result?.path
                if (url) {
                  currentSnaps.push(url)
                }
              } catch (e) {
                const msg = getProfileErrorMessage(e)
                toast({
                  title: "Upload failed",
                  description: msg || `Failed to upload image for project ${projectIndex + 1}`,
                  status: "error",
                  duration: 5000,
                  isClosable: true,
                })
              }
            }

            updatedData[projectIndex] = {
              ...project,
              project_snaps: currentSnaps
            }
          }

          // Convert to snake_case for DB saving
          const snakeCaseProjects = toSnakeCase(updatedData)

          await StudentProfileService.saveSection(viewUsn, "projects", { projects: snakeCaseProjects })
          setData(updatedData)
          initialDataRef.current = updatedData
          setPendingFiles({})
          setLastFieldErrors(null)
          toast({ title: "Changes saved successfully", status: "success" })
          setIsEditing(false)
      } catch (error) {
          const parsed = parseApiError(error)
          const msg = parsed.message || getProfileErrorMessage(error)
          if (parsed.fieldErrors && Object.keys(parsed.fieldErrors).length > 0) {
            setLastFieldErrors(parsed.fieldErrors)
          } else {
            setLastFieldErrors(null)
          }
          toast({
            title: parsed.fieldErrors ? "Validation errors" : "Error saving data",
            description: parsed.fieldErrors ? "Please fix the errors highlighted in the form below." : msg,
            status: "error",
            duration: 6000,
            isClosable: true,
          })
      } finally {
          setSaving(false)
      }
  }

  if (loadError && data.length === 0) {
    return (
      <Box p={8}>
        <Alert status="error" borderRadius="md" flexDirection={{ base: "column", md: "row" }} alignItems="stretch">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Could not load projects</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Box>
          <Button size="sm" colorScheme="red" variant="outline" alignSelf="center" onClick={fetchData}>
            Retry
          </Button>
        </Alert>
      </Box>
    )
  }

  if (loading) {
    return (
      <Center h="50vh">
        <Spinner size="xl" color="#03C03C" />
      </Center>
    )
  }

  return (
      <Box className="projects-profile-page" maxW="1600px" mx="auto" pt={{ base: 4, md: 8 }} pb={12} px={{ base: 4, md: 6 }}>
        <Box className="projects-profile-header">
          <Text as="h1">Projects</Text>
          <Text className="header-subtitle">Showcase your work and manage your project portfolio</Text>
        </Box>

        {isLocked && (
          <Alert status="info" mb={4} borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>View only</AlertTitle>
              <AlertDescription>This section is locked by the administrator. You cannot edit it.</AlertDescription>
            </Box>
          </Alert>
        )}

        {fieldErrorsByRow && Object.keys(fieldErrorsByRow).length > 0 && (
          <Alert status="error" borderRadius="md" mb={4}>
            <AlertIcon />
            <Box>
              <AlertTitle>Validation errors</AlertTitle>
              <AlertDescription>Please fix the errors highlighted in the form. Open each project to see field-level errors.</AlertDescription>
            </Box>
          </Alert>
        )}

        <div className="projects-profile-tabs">
          <button
            type="button"
            className={tabIndex === 0 ? "active" : ""}
            onClick={() => setTabIndex(0)}
          >
            <Icon as={FaStore} boxSize={4} />
            <span>Showcase</span>
          </button>
          <button
            type="button"
            className={tabIndex === 1 ? "active" : ""}
            onClick={() => setTabIndex(1)}
          >
            <Icon as={FaEdit} boxSize={4} />
            <span>Manage Projects</span>
          </button>
        </div>

        <Box ref={contentAreaRef} position="relative">
          {tabIndex === 0 && (
            <ProjectShowcase projects={data} contentAreaRef={contentAreaRef} studentName={user?.full_name || user?.name} />
          )}
          {tabIndex === 1 && (
            <Box className="projects-manage-wrap">
              <ProjectsForm
                data={data}
                onUpdate={handleUpdate}
                isEditing={canEdit && isEditing}
                onFileSelect={handleFileSelect}
                apiFieldErrors={fieldErrorsByRow}
                onPriorityValidationChange={setHasPriorityError}
              />
              <div className="projects-actions">
                <AdminSectionLockControl sectionKey="projects" label="Projects" />
                {canEdit && (
                <>
                {!isEditing ? (
                  <Button
                    bg="linear-gradient(135deg, #03C03C 0%, #A2D43D 100%)"
                    color="#1F1E26"
                    _hover={{ bg: "linear-gradient(135deg, #02a832 0%, #8fc234 100%)", boxShadow: "0 4px 12px rgba(3, 192, 60, 0.4)" }}
                    size="lg"
                    fontWeight="600"
                    onClick={() => setIsEditing(true)}
                    leftIcon={<FaEdit />}
                  >
                    Add/Edit Projects
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      colorScheme="red"
                      size="lg"
                      onClick={() => {
                        setData(initialDataRef.current || []);
                        setPendingFiles({});
                        setIsEditing(false);
                      }}
                      isDisabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      bg="linear-gradient(135deg, #03C03C 0%, #A2D43D 100%)"
                      color="#1F1E26"
                      _hover={{ bg: "linear-gradient(135deg, #02a832 0%, #8fc234 100%)", boxShadow: "0 4px 12px rgba(3, 192, 60, 0.4)" }}
                      size="lg"
                      fontWeight="600"
                      isLoading={saving}
                      loadingText="Saving..."
                      onClick={handleSave}
                      isDisabled={saving || !hasUnsavedChanges}
                      title={!hasUnsavedChanges ? "No changes to save." : undefined}
                    >
                      Save Changes
                    </Button>
                  </>
                )}
                </>
                )}
              </div>
            </Box>
          )}
        </Box>
      </Box>
  )
}
