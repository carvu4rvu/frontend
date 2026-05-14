import { SummerInternshipForm } from "../../../components/student/forms/SummerInternshipForm"
import { GenericProfileSection } from "./GenericProfileSection"

export const SummerInternshipProfile = () => {
  return <GenericProfileSection sectionKey="summer_internship" FormComponent={SummerInternshipForm} />
}
