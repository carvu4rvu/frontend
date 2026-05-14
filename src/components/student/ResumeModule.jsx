/**
 * Component: ResumeModule
 * 
 * Features:
 * - File Upload (PDF only, Max 5MB)
 * - Auto-Generation (Preview & Print)
 * 
 * API Contracts:
 * - GET /api/student/profile/resume
 * - POST /api/student/profile/resume (Upload)
 *   Body: Multipart Form Data (file)
 */

import { useState, useEffect, useRef } from "react"
import { Box, Button, Flex, Heading, Text, VStack, HStack, Input, Icon, Spinner, useToast, useDisclosure, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, Alert, AlertIcon, AlertTitle, AlertDescription } from "@chakra-ui/react"
import { FaCloudUploadAlt, FaFilePdf, FaEye, FaTrash, FaEdit } from "react-icons/fa"
import { StudentProfileService } from "../../services/studentProfile.service"
import { getFileUrl } from "../../utils/fileUrl"

const MAX_FILE_SIZE_MB = 5

export const ResumeModule = ({ usn, fullProfile: initialFullProfile, readOnly = false }) => {
  const [resumeFile, setResumeFile] = useState(null)
  const [uploadError, setUploadError] = useState(null)
  const [fullProfile, setFullProfile] = useState(initialFullProfile)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const cancelRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadData()
  }, [usn])

  useEffect(() => {
    if (initialFullProfile) {
        setFullProfile(initialFullProfile)
    }
  }, [initialFullProfile])

  const loadData = async () => {
    if (!usn) return
    setLoading(true)
    try {
        if (!initialFullProfile) {
            const profile = await StudentProfileService.getFullProfile(usn)
            setFullProfile(profile)
        }
        
        const resumeData = await StudentProfileService.getSection(usn, "resume")
        if (resumeData?.resume_file) {
            setResumeFile({ path: resumeData.resume_file })
        }
    } catch (error) {
    } finally {
        setLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadError(null)
    if (file.type !== "application/pdf") {
      setUploadError("Please upload a PDF file only.")
      return
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setUploadError(`File size must be less than ${MAX_FILE_SIZE_MB}MB.`)
      return
    }

    setLoading(true)
    try {
        const uploadResult = await StudentProfileService.uploadFile(usn, file, { folder: "resumes" })
        const fileUrl = uploadResult?.url || uploadResult?.path
        
        if (fileUrl) {
            await StudentProfileService.saveSection(usn, "resume", { resume_file: fileUrl })
            setResumeFile({ path: fileUrl, name: file.name })
            setUploadError(null)
            toast({
                title: "Success",
                description: "Resume uploaded successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            })
        }
    } catch (error) {
        const msg = error?.response?.data?.message || error?.message || "Could not upload resume. Please try again."
        setUploadError(msg)
    } finally {
        setLoading(false)
    }
  }

  const handleViewResume = () => {
    if (!resumeFile?.path) return
    const url = getFileUrl(resumeFile.path)
    if (url) window.open(url, "_blank", "noopener,noreferrer")
  }

  const handleDeleteResume = async () => {
    if (!usn) return
    setDeleting(true)
    try {
      await StudentProfileService.saveSection(usn, "resume", { resume_file: null })
      setResumeFile(null)
      onDeleteClose()
      toast({
        title: "Resume removed",
        description: "Your resume has been deleted.",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error?.message || "Could not delete resume. Please try again.",
        status: "error",
        duration: 4000,
        isClosable: true,
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleAutoGenerate = async () => {
    setGenerating(true)
    // Simulate generation delay
    await new Promise(r => setTimeout(r, 1000))
    setGenerating(false)
    
    // Open print window as a simple preview
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
        toast({
            title: "Popup Blocked",
            description: "Please allow popups to view the generated resume.",
            status: "warning",
            duration: 3000,
            isClosable: true,
        })
        return
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Resume - ${fullProfile?.personal?.fullName || usn}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #20343c; border-bottom: 2px solid #d4a960; padding-bottom: 10px; }
            h2 { color: #20343c; margin-top: 20px; border-bottom: 1px solid #eee; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 20px; }
            .item { margin-bottom: 10px; }
            .item-header { font-weight: bold; }
            .item-sub { color: #666; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${fullProfile?.personal?.fullName || "Student Name"}</h1>
            <p>${fullProfile?.personal?.email || ""} | ${fullProfile?.personal?.phone || ""}</p>
            <p>${fullProfile?.education?.[0]?.instituteName || "University Name"}</p>
          </div>

          <div class="section">
            <h2>Career Objective</h2>
            <p>${fullProfile?.career?.careerObjective || "To leverage my skills in a challenging environment..."}</p>
          </div>

          <div class="section">
            <h2>Education</h2>
            ${(Array.isArray(fullProfile?.education) ? fullProfile.education : []).map(edu => `
              <div class="item">
                <div class="item-header">${edu.degree || "Degree"} - ${edu.instituteName || "Institute"}</div>
                <div class="item-sub">${edu.year || "Year"} | ${edu.cgpa ? "CGPA: " + edu.cgpa : ""}</div>
              </div>
            `).join('')}
          </div>

          <div class="section">
            <h2>Projects</h2>
            ${(Array.isArray(fullProfile?.projects) ? fullProfile.projects : []).map(proj => `
              <div class="item">
                <div class="item-header">${proj.title}</div>
                <p>${proj.description}</p>
                <div class="item-sub">Skills: ${proj.skills || ""}</div>
              </div>
            `).join('')}
          </div>
          
           <div class="section">
            <h2>Skills</h2>
            <p>${(Array.isArray(fullProfile?.skills) ? fullProfile.skills : []).join(", ") || "Java, React, Python, SQL"}</p>
          </div>

          <script>
            window.print();
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  if (loading && !fullProfile && !resumeFile) return <Spinner />

  return (
    <Box>
      <Heading size="lg" color="#20343c" mb={6}>Resume</Heading>
      
      <VStack gap={8} align="stretch">
        {/* Upload Section */}
        <Box bg="white" p={6} borderRadius="xl" shadow="sm" className="resume-upload-section">
          <Heading size="md" color="#20343c" mb={4}>Upload Resume</Heading>

          {resumeFile && resumeFile.path ? (
            /* Single row: file label + View + Edit + Delete */
            <Flex
              className="resume-actions-row"
              align="center"
              gap={4}
              flexWrap="wrap"
              py={3}
              px={4}
              borderRadius="lg"
              bg="gray.50"
              borderWidth="1px"
              borderColor="gray.200"
            >
              <HStack flex={1} minW={0} gap={3}>
                <Icon as={FaFilePdf} boxSize={6} color="red.500" flexShrink={0} />
                <Text fontSize="sm" fontWeight="medium" color="gray.700" noOfLines={1}>
                  {resumeFile.name || "Resume.pdf"}
                </Text>
              </HStack>
              <HStack gap={2} flexShrink={0}>
                <Button
                  leftIcon={<FaEye />}
                  colorScheme="blue"
                  variant="outline"
                  size="sm"
                  onClick={handleViewResume}
                  className="resume-btn-view"
                >
                  View
                </Button>
                {!readOnly && (
                  <>
                    <Button
                      leftIcon={<FaEdit />}
                      colorScheme="gray"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="resume-btn-edit"
                    >
                      Edit
                    </Button>
                    <Button
                      leftIcon={<FaTrash />}
                      colorScheme="red"
                      variant="outline"
                      size="sm"
                      onClick={onDeleteOpen}
                      className="resume-btn-delete"
                    >
                      Delete
                    </Button>
                  </>
                )}
              </HStack>
              <Input
                ref={fileInputRef}
                type="file"
                display="none"
                accept="application/pdf"
                onChange={handleFileUpload}
              />
            </Flex>
          ) : readOnly ? (
            <Text color="gray.600" py={4}>No resume uploaded.</Text>
          ) : (
            <Box 
              border="2px dashed" 
              borderColor={uploadError ? "red.300" : "gray.300"} 
              borderRadius="xl" 
              p={10} 
              textAlign="center"
              bg="gray.50"
              _hover={{ borderColor: "#d4a960", bg: "gray.100" }}
              transition="all 0.2s"
              position="relative"
              cursor="pointer"
            >
              <Input 
                ref={fileInputRef}
                type="file" 
                height="100%" 
                width="100%" 
                position="absolute" 
                top={0} 
                left={0} 
                opacity={0} 
                cursor="pointer"
                onChange={handleFileUpload}
                accept="application/pdf"
              />
              <VStack gap={4}>
                <Icon as={FaCloudUploadAlt} boxSize={10} color="gray.500" />
                <Box>
                  <Heading size="sm" color="gray.600">
                    Click or Drag to Upload PDF
                  </Heading>
                  <Text fontSize="sm" color="gray.600" mt={1}>
                    Max file size: {MAX_FILE_SIZE_MB}MB
                  </Text>
                </Box>
                {uploadError && (
                  <Text fontSize="sm" color="red.500" mt={2}>
                    {uploadError}
                  </Text>
                )}
              </VStack>
            </Box>
          )}
        </Box>

        {/* Auto-Generate Section - hide when read-only (admin view) */}
        {!readOnly && (
        <Box bg="white" p={6} borderRadius="xl" shadow="sm">
          <Heading size="md" color="#20343c" mb={4}>Auto-Generate Resume</Heading>
          <Text color="gray.700" mb={6}>
            Create a professional resume instantly using the data from your profile sections (Education, Projects, Skills, etc.).
          </Text>
          <HStack gap={4}>
            <Button 
              onClick={handleAutoGenerate}
              isLoading={generating}
              loadingText="Generating..."
              colorScheme="blue"
              variant="outline"
            >
              <FaEye /> Preview & Download
            </Button>
          </HStack>
        </Box>
        )}
      </VStack>

      <AlertDialog isOpen={isDeleteOpen} onClose={onDeleteClose} leastDestructiveRef={cancelRef}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Resume
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to remove your uploaded resume? You can upload a new one anytime.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteResume} ml={3} isLoading={deleting} loadingText="Deleting...">
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  )
}
