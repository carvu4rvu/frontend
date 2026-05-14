import { Box, Heading, Flex, Spinner } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { useStudentDataCache } from "../../../context/StudentDataCacheContext"
import "../../EventsPage.css"

const TABS = [
  { id: "scheduled", label: "Upcoming", status: "scheduled" },
  { id: "ongoing", label: "Ongoing", status: "ongoing" },
  { id: "completed", label: "Done", status: "completed" },
  { id: "failed", label: "Failed", status: "failed" },
]

function formatDatetime(iso) {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function EventCard({ event }) {
  const imgUrl = Array.isArray(event.images) && event.images[0] ? event.images[0] : null

  return (
    <div className="events-card">
      <div className="events-card-image-wrap">
        {imgUrl ? (
          <img src={imgUrl} alt="" className="events-card-image" />
        ) : (
          <div
            className="events-card-image"
            style={{
              background: "#e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#9ca3af",
              fontSize: 14,
            }}
          >
            No image
          </div>
        )}
      </div>
      <div className="events-card-body">
        <div className="events-card-type">{event.type}</div>
        <div className="events-card-title">{event.title}</div>
        <div className="events-card-datetime">{formatDatetime(event.event_datetime)}</div>
        <span className={`status-badge status-${event.status || "scheduled"}`}>
          {event.status || "scheduled"}
        </span>
        {event.details && <div className="events-card-details">{event.details}</div>}
      </div>
    </div>
  )
}

export const StudentEvents = () => {
  const [activeTab, setActiveTab] = useState("scheduled")
  const { cache, loading, clearCache, fetchEvents } = useStudentDataCache()

  const events = cache.events.list
  const isLoading = !cache.events.loaded && loading.events

  useEffect(() => {
    clearCache('events')
    fetchEvents()
  }, [clearCache, fetchEvents])

  const byStatus = (status) =>
    status ? events.filter((e) => (e.status || "scheduled") === status) : []
  const currentList = byStatus(TABS.find((t) => t.id === activeTab)?.status)

  return (
    <Box bg="gray.50" minH="80vh" py={8}>
        <Box maxW="container.xl" mx="auto" px={4}>
          <Heading size="lg" color="#166534" mb={6}>
            Events
          </Heading>

          <div className="events-page">
            <ul className="events-tabs">
              {TABS.map((t) => {
                const count = t.status != null ? byStatus(t.status).length : null
                const isActive = activeTab === t.id
                return (
                  <li
                    key={t.id}
                    role="tab"
                    tabIndex={0}
                    className={`events-tab ${isActive ? "active" : ""}`}
                    onClick={() => setActiveTab(t.id)}
                    onKeyDown={(e) =>
                      (e.key === "Enter" || e.key === " ") && setActiveTab(t.id)
                    }
                  >
                    {t.label}
                    {count != null && <span className="tab-badge">{count}</span>}
                  </li>
                )
              })}
            </ul>

            <div className="events-tab-content">
              {isLoading ? (
                <Flex justify="center" py={12}>
                  <Spinner size="lg" color="#d4a960" />
                </Flex>
              ) : currentList.length === 0 ? (
                <div className="events-empty">No events in this category.</div>
              ) : (
                <div className="events-grid">
                  {currentList.map((ev) => (
                    <EventCard key={ev.id} event={ev} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </Box>
      </Box>
  )
}

export default StudentEvents
