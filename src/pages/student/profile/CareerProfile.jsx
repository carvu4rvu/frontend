import { CareerOverviewForm } from "../../../components/student/forms/CareerOverviewForm"
import { GenericProfileSection } from "./GenericProfileSection"

export const CareerProfile = () => {
  return <GenericProfileSection sectionKey="career" FormComponent={CareerOverviewForm} />
}
