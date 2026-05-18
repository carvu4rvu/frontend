import { SummerImmersionForm } from "../../../components/student/forms/SummerImmersionForm"
import { GenericProfileSection } from "./GenericProfileSection"

export const SummerImmersionProfile = () => {
  return <GenericProfileSection sectionKey="summer_immersion" FormComponent={SummerImmersionForm} />
}
