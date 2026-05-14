import { ParentDetailsForm } from "../../../components/student/forms/ParentDetailsForm"
import GenericProfileSection from "./GenericProfileSection"

export const FamilyProfile = () => {
  return <GenericProfileSection sectionKey="family" FormComponent={ParentDetailsForm} />
}
