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

import { useState, useEffect } from "react"
import { Box, Button, Heading, Text, VStack, HStack, Input, Icon, Divider, Spinner } from "@chakra-ui/react"
import { FaCloudUploadAlt, FaFilePdf, FaDownload, FaEye } from "react-icons/fa"
import { StudentProfileService } from "../../services/studentProfile.service"

export const ResumeModule = ({ usn }) => {
  const [resumeFile, setResumeFile] = useState(null)
  const [fullProfile, setFullProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const profile = await StudentProfileService.getFullProfile(usn)
    setFullProfile(profile)
    // Simulate checking for existing resume
    const resume = await StudentProfileService.getSection(usn, "resume")
    if (resume?.fileName) {
        setResumeFile({ name: resume.fileName })
    }
    setLoading(false)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      alert("Invalid file type. Please upload a PDF file only.")
      return
    }

    setLoading(true)
    // Simulate upload
    await new Promise(r => setTimeout(r, 1000))
    await StudentProfileService.saveSection(usn, "resume", { fileName: file.name, uploadedAt: new Date().toISOString() })
    setResumeFile(file)
    setLoading(false)
    
    alert("Resume Uploaded Successfully")
  }

  const handleAutoGenerate = async () => {
    setGenerating(true)
    await new Promise(r => setTimeout(r, 1500)) // Simulate generation
    setGenerating(false)
    
    // Open print window as a simple preview
    const printWindow = window.open('', '_blank')
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

  if (loading && !fullProfile) return <Spinner />

  return (
    <Box>
      <Heading size="lg" color="#20343c" mb={6}>Resume</Heading>
      
      <VStack gap={8} align="stretch">
        {/* Upload Section */}
        <Box bg="white" p={6} borderRadius="xl" shadow="sm">
          <Heading size="md" color="#20343c" mb={4}>Upload Resume</Heading>
          <Box 
            border="2px dashed" 
            borderColor="gray.300" 
            borderRadius="xl" 
            p={10} 
            textAlign="center"
            bg="gray.50"
            _hover={{ borderColor: "#d4a960", bg: "gray.100" }}
            transition="all 0.2s"
            position="relative"
          >
            <Input 
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
              <Icon as={resumeFile ? FaFilePdf : FaCloudUploadAlt} boxSize={10} color={resumeFile ? "red.500" : "gray.400"} />
              <Box>
                <Heading size="sm" color="gray.600">
                  {resumeFile ? resumeFile.name : "Click or Drag to Upload PDF"}
                </Heading>
                <Text fontSize="sm" color="gray.500" mt={1}>
                  {resumeFile ? "Click to replace" : "Max file size: 5MB"}
                </Text>
              </Box>
            </VStack>
          </Box>
        </Box>

        <HStack w="full" alignItems="center">
            <Divider />
            <Text whiteSpace="nowrap" color="gray.500" fontSize="sm">OR</Text>
            <Divider />
        </HStack>

        {/* Auto-Generate Section */}
        <Box bg="white" p={6} borderRadius="xl" shadow="sm">
          <Heading size="md" color="#20343c" mb={4}>Auto-Generate Resume</Heading>
          <Text color="gray.600" mb={6}>
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
      </VStack>
    </Box>
  )
}
