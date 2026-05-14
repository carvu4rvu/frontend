import { PublicationsForm } from "../../../components/student/forms/PublicationsForm"
import { GenericProfileSection } from "./GenericProfileSection"

export const PublicationsProfile = () => {
  return <GenericProfileSection sectionKey="publications" FormComponent={PublicationsForm} />
}
