import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Spinner, Text } from "@chakra-ui/react";
import { StudentDashboard } from "./StudentDashboard";
import { PlacementService } from "../services/placement.service";
import { StudentProfileService } from "../services/studentProfile.service";
import { EventsService } from "../services/events.service";
import { calculateProfileCompletion, getMissingSections } from "../utils/profileHelper";

const ACCENT = "#20343c";

/**
 * Admin view: fetches dashboard data for a student by USN and renders StudentDashboard
 * in view-only mode. Shown at /placement/students/:usn/dashboard.
 */
export default function AdminStudentDashboardView() {
  const { usn } = useParams();
  const [viewData, setViewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentName, setStudentName] = useState(null);

  useEffect(() => {
    if (!usn) {
      setLoading(false);
      return;
    }
    const decodedUsn = decodeURIComponent(usn);
    setLoading(true);
    setError(null);

    const buildDashboard = async (profileData, processData) => {
      let completion = 0;
      let missingSections = [];
      let resumeUploaded = false;
      let optIn = false;
      let placementPolicyAgreed = false;
      let academicSnapshot = null;
      let portfolioCounts = null;

      if (profileData) {
        const raw = profileData?.data ?? profileData;
        const formatted = {
          ...raw,
          usn: raw?.usn ?? decodedUsn,
          personal: raw?.personal ?? {},
          contact: raw?.contact ?? {},
          communication: raw?.contact ?? raw?.communication ?? {},
        };
        completion = calculateProfileCompletion(formatted);
        completion = Number.isFinite(completion) ? Math.min(100, Math.max(0, Math.round(completion))) : 0;
        missingSections = getMissingSections(formatted) || [];

        const resumeVal = raw?.resume_file ?? raw?.career?.resume_file ?? "";
        resumeUploaded =
          typeof resumeVal === "string" &&
          resumeVal.trim().length >= 5 &&
          !/^(n\/a|na|none|pending|tbd|tba|-|\.)$/i.test(resumeVal.trim());

        const personal = raw?.personal ?? {};
        optIn = personal.opt_in === true;
        placementPolicyAgreed = personal.has_agreed_placement_policy === true;

        const academics = Array.isArray(raw?.academics) ? raw.academics : [];
        const sortedAcad = [...academics].sort(
          (a, b) => (parseInt(b?.semester, 10) || 0) - (parseInt(a?.semester, 10) || 0)
        );
        const latest = sortedAcad[0];
        const sgpaValues = academics
          .map((a) => a?.result_in_sgpa ?? a?.sgpa)
          .filter((v) => v != null && v !== "")
          .map((v) => parseFloat(v));
        const cgpa =
          sgpaValues.length > 0 ? sgpaValues.reduce((s, v) => s + v, 0) / sgpaValues.length : null;
        academicSnapshot = {
          currentYear: personal?.current_year ?? personal?.currentYear ?? null,
          currentSemester: personal?.current_semester ?? personal?.currentSemester ?? null,
          latestSgpa: latest != null ? latest.result_in_sgpa ?? latest.sgpa : null,
          cgpa: cgpa != null && !Number.isNaN(cgpa) ? Math.round(cgpa * 100) / 100 : null,
          liveBacklogs: latest?.live_backlogs ?? latest?.liveBacklogs ?? 0,
          closedBacklogs: latest?.closed_backlogs ?? latest?.closedBacklogs ?? 0,
        };

        portfolioCounts = {
          projects: (raw?.projects || []).length,
          internships: (raw?.internships || []).length,
          trainings: (raw?.trainings || []).length,
          certifications: (raw?.certifications || []).length,
          publications: (raw?.publications || []).length,
          extraCurricular: (raw?.extraCurricular || []).length,
        };

        const name =
          raw?.personal?.full_name ??
          raw?.personal?.fullName ??
          raw?.full_name ??
          raw?.fullName ??
          decodedUsn;
        setStudentName(name);
      }

      return {
        dashboard: {
          applications: processData || [],
          completionPercentage: completion,
          missingSections,
          resumeUploaded,
          optIn,
          placementPolicyAgreed,
          academicSnapshot,
          portfolioCounts,
          loaded: true,
        },
      };
    };

    Promise.all([
      PlacementService.getStudentProcess(decodedUsn),
      StudentProfileService.getFullProfile(decodedUsn),
      PlacementService.getAllDrives(),
      PlacementService.getStudentOffers(decodedUsn),
      EventsService.list(),
    ])
      .then(([processData, profileData, drivesData, jobOffersList, eventsList]) =>
        buildDashboard(profileData, processData).then((dashPart) => ({
          ...dashPart,
          placementFeed: {
            drives: drivesData || [],
            processRecords: processData || [],
            loaded: true,
          },
          events: { list: Array.isArray(eventsList) ? eventsList : [], loaded: true },
          jobOffers: { list: jobOffersList || [], loaded: true },
          notifications: { list: [], unreadCount: 0, loaded: true },
        }))
      )
      .then((data) => {
        setViewData(data);
      })
      .catch((err) => {
        console.error("AdminStudentDashboardView fetch error:", err);
        setError(err?.message || "Failed to load student dashboard");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [usn]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="80vh" w="100%">
        <Spinner size="xl" color={ACCENT} />
      </Box>
    );
  }

  if (error || !viewData) {
    return (
      <Box p={6}>
        <Text color="red.600">{error || "Student not found."}</Text>
      </Box>
    );
  }

  return (
    <StudentDashboard
      viewData={viewData}
      basePath={`/placement/students/${encodeURIComponent(usn)}`}
      studentName={studentName}
    />
  );
}
