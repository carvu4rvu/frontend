import AlumniEvents from '../alumni/AlumniEvents';
import { CompanyService } from '../../services/company.service';

const CompanyEvents = () => (
  <AlumniEvents
    fetchEvents={() => CompanyService.getEvents()}
  />
);

export default CompanyEvents;
