import { CertificationsForm } from "../../../components/student/forms/CertificationsForm"
import { GenericProfileSection } from "./GenericProfileSection"

export const CertificationsProfile = () => {
  return <GenericProfileSection sectionKey="certifications" FormComponent={CertificationsForm} />
}
