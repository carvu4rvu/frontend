import { TrainingWorkshopsForm } from "../../../components/student/forms/TrainingWorkshopsForm"
import { GenericProfileSection } from "./GenericProfileSection"

export const TrainingsProfile = () => {
  return <GenericProfileSection sectionKey="trainings" FormComponent={TrainingWorkshopsForm} />
}
