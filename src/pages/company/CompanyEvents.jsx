import AlumniEvents from '../alumni/AlumniEvents';
import CompanyLayout from '../../components/CompanyLayout';
import { CompanyService } from '../../services/company.service';

const CompanyEvents = () => (
  <AlumniEvents
    LayoutComponent={CompanyLayout}
    fetchEvents={() => CompanyService.getEvents()}
  />
);

export default CompanyEvents;
