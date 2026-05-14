import { EducationForm } from "../../../components/student/forms/EducationForm"
import { GenericProfileSection } from "./GenericProfileSection"

export const EducationProfile = () => {
  return <GenericProfileSection sectionKey="education" FormComponent={EducationForm} />
}
