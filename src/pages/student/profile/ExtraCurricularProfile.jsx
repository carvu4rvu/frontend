import { ExtraCurricularForm } from "../../../components/student/forms/ExtraCurricularForm"
import { GenericProfileSection } from "./GenericProfileSection"

export const ExtraCurricularProfile = () => {
  return <GenericProfileSection sectionKey="extra-curricular" FormComponent={ExtraCurricularForm} />
}
