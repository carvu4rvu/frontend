import { Box, Center, Spinner, Text, Container, Heading } from "@chakra-ui/react"
import { useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import { StudentProfileService } from "../services/studentProfile.service"
import { ProjectShowcase } from "../components/student/projects/ProjectShowcase"

export const UniversalProjectShowcase = () => {
  const { usn } = useParams()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (usn) {
      fetchProjects()
    }
  }, [usn])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      // Fetch projects for the given USN
      const sectionData = await StudentProfileService.getSection(usn, "projects")
      // Handle both array and object wrapper formats
      const projectsList = Array.isArray(sectionData) ? sectionData : (sectionData?.projects || [])
      
      // Filter for PUBLIC visibility if needed, but for now we show what the backend returns
      // Ideally backend should filter based on request context, but we are in "universal" mode.
      // Assuming all projects returned are meant to be seen or we filter here.
      // The schema has 'visibility' field.
      const publicProjects = projectsList.filter(p => p.visibility === 'PUBLIC')
      
      setProjects(publicProjects)
    } catch (err) {
      console.error("Error fetching projects:", err)
      setError("Failed to load projects.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box minH="100vh" display="flex" flexDirection="column">
        <Center flex="1">
          <Spinner size="xl" color="#d4a960" />
        </Center>
      </Box>
    )
  }

  if (error) {
    return (
      <Box minH="100vh" display="flex" flexDirection="column">
        <Center flex="1">
          <Text color="red.500">{error}</Text>
        </Center>
      </Box>
    )
  }

  return (
    <Box minH="100vh" display="flex" flexDirection="column" bg="gray.50" py={10}>
        <Container maxW="7xl">
          <Heading mb={6} textAlign="center">Project Showcase</Heading>
          <Text mb={8} textAlign="center" color="gray.600">
            Check out the amazing projects built by {usn}
          </Text>
          
          <ProjectShowcase projects={projects} />
          
          {projects.length === 0 && (
             <Center p={10}>
                <Text color="gray.500">No public projects found for this student.</Text>
             </Center>
          )}
        </Container>
    </Box>
  )
}
