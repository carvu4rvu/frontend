import { InternshipsForm } from "../../../components/student/forms/InternshipsForm"
import { GenericProfileSection } from "./GenericProfileSection"

export const InternshipsProfile = () => {
  return <GenericProfileSection sectionKey="internships" FormComponent={InternshipsForm} />
}
