import { useEffect } from "react"
import { useStudentDataCache } from "../../../context/StudentDataCacheContext"
import CampusEventsView from "../../../components/campus/CampusEventsView"

export const StudentEvents = () => {
  const { cache, loading, clearCache, fetchEvents } = useStudentDataCache()

  const events = cache.events.list
  const isLoading = !cache.events.loaded && loading.events

  useEffect(() => {
    clearCache('events')
    fetchEvents()
  }, [clearCache, fetchEvents])

  return <CampusEventsView events={events} loading={isLoading} />
}

export default StudentEvents
