import React, { useState, useEffect } from 'react';
import { PageTemplate } from '../../components/student/PageTemplate';
import { PersonalInformationForm } from '../../components/student/forms/PersonalInformationForm';
import { ContactLinksForm } from '../../components/student/forms/ContactLinksForm';
import { EducationForm } from '../../components/student/forms/EducationForm';
import { AcademicPerformanceForm } from '../../components/student/forms/AcademicPerformanceForm';
import { ProjectsForm } from '../../components/student/forms/ProjectsForm';
import { InternshipsForm } from '../../components/student/forms/InternshipsForm';
import { TrainingWorkshopsForm } from '../../components/student/forms/TrainingWorkshopsForm';
import { CertificationsForm } from '../../components/student/forms/CertificationsForm';
import { PublicationsForm } from '../../components/student/forms/PublicationsForm';
import { ExtraCurricularForm } from '../../components/student/forms/ExtraCurricularForm';
import { OtherExperiencesForm } from '../../components/student/forms/OtherExperiencesForm';
import { CareerOverviewForm } from '../../components/student/forms/CareerOverviewForm';
import { ParentDetailsForm } from '../../components/student/forms/ParentDetailsForm';
import { SummerImmersionForm } from '../../components/student/forms/SummerImmersionForm';
import { SummerInternshipForm } from '../../components/student/forms/SummerInternshipForm';
import { ResumeModule } from '../../components/student/ResumeModule';

import { StudentProfileService } from '../../services/studentProfile.service';
import { useAuth } from '../../context/AuthContext';
import { Center, Spinner } from '@chakra-ui/react';

const ProfilePage = ({ title, description, FormComponent }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.usn) {
      StudentProfileService.getFullProfile(user.usn)
        .then(data => setProfile(data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [user]);

  return (
    <PageTemplate title={title} description={description}>
       {loading ? <Center><Spinner /></Center> : (FormComponent ? <FormComponent data={profile} isEditing={true} /> : null)}
    </PageTemplate>
  );
};

export const PersonalProfile = () => <ProfilePage title="Personal Information" description="Manage your personal details." FormComponent={PersonalInformationForm} />;
export const ContactDetails = () => <ProfilePage title="Contact Details" description="Update your contact information." FormComponent={ContactLinksForm} />;
export const FamilyDetails = () => <ProfilePage title="Parent / Guardian Details" description="Provide details about your parents or guardians." FormComponent={ParentDetailsForm} />;
export const EducationDetails = () => <ProfilePage title="Education" description="View and update your educational background." FormComponent={EducationForm} />;
export const AcademicPerformance = () => <ProfilePage title="Academic Performance" description="Track your semester-wise marks." FormComponent={AcademicPerformanceForm} />;

export const Projects = () => <ProfilePage title="Projects" description="Showcase your academic and personal projects." FormComponent={ProjectsForm} />;
export const Internships = () => <ProfilePage title="Internships" description="List your internship experiences." FormComponent={InternshipsForm} />;
export const Trainings = () => <ProfilePage title="Training & Workshops" description="Details of trainings and workshops." FormComponent={TrainingWorkshopsForm} />;
export const Certifications = () => <ProfilePage title="Certifications" description="Upload and manage your professional certifications." FormComponent={CertificationsForm} />;
export const Publications = () => <ProfilePage title="Publications" description="List your research papers and publications." FormComponent={PublicationsForm} />;
export const ExtraCurricular = () => <ProfilePage title="Extra-Curricular Activities" description="Highlight your participation in activities." FormComponent={ExtraCurricularForm} />;
export const OtherExperiences = () => <ProfilePage title="Other Experiences" description="Any other relevant experiences." FormComponent={OtherExperiencesForm} />;

export const CareerOverview = () => <ProfilePage title="Career Overview" description="Summary of your career goals." FormComponent={CareerOverviewForm} />;

export const Resume = () => {
  const { user } = useAuth();
  return (
    <PageTemplate title="Resume" description="Upload and manage different versions of your resume.">
      {user?.usn ? <ResumeModule usn={user.usn} /> : <Center><Spinner /></Center>}
    </PageTemplate>
  );
};

export const SummerImmersion = () => <ProfilePage title="Summer Immersion" description="Details about your summer immersion program." FormComponent={SummerImmersionForm} />;
export const SummerInternship = () => <ProfilePage title="Summer Internship" description="Track your summer internship progress." FormComponent={SummerInternshipForm} />;

export const Capstone = () => <PageTemplate title="Capstone Project" description="Manage your final year capstone project details." />;
export const PlacementTrack = () => <PageTemplate title="Placement" description="Track your placement drives, applications, and offers." />;
