import "./ResumeProfile.css"
import { Box, Spinner, Center } from "@chakra-ui/react"
import { useState, useEffect } from "react"
import { StudentProfileService } from "../../../services/studentProfile.service"
import { useAuth } from "../../../context/AuthContext"
import { useProfileView } from "../../../context/ProfileViewContext"
import { AdminSectionLockControl } from "../../../components/student/AdminSectionLockControl"
import { ResumeModule } from "../../../components/student/ResumeModule"

export const ResumeProfile = () => {
  const { user } = useAuth()
  const profileView = useProfileView()
  const viewUsn = (profileView?.viewUsn || user?.usn || "").toString().trim().toUpperCase()
  const usn = viewUsn || user?.usn

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!viewUsn) return
    const fetchData = async () => {
      setLoading(true)
      try {
        const fullProfile = await StudentProfileService.getFullProfile(viewUsn)
        setData(fullProfile)
      } catch (error) {
        alert("Error loading data")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [viewUsn])

  if (loading || !data) {
    return (
      <Center h="50vh">
        <Spinner size="xl" color="#d4a960" />
      </Center>
    )
  }

  return (
    <Box maxW="5xl" mx="auto">
      <AdminSectionLockControl sectionKey="resume" label="Resume & career" />
      <ResumeModule fullProfile={data} usn={usn} readOnly={profileView?.isAdminView !== true && (profileView?.isReadOnly === true || profileView?.isSectionLocked?.("resume") === true)} />
    </Box>
  )
}
