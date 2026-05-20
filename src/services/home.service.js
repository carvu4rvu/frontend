import { apiFetch } from './api';

/**
 * Public landing data — GET /placement/companies does not require auth.
 */
export async function fetchLandingCompanies() {
  try {
    const res = await apiFetch('/placement/companies', { skipRefresh: true });
    const data = res?.data ?? res ?? {};
    const companies = Array.isArray(data.companies) ? data.companies : [];
    const schoolsList = Array.isArray(data.schoolsList) ? data.schoolsList : [];
    const totalCompanies = data.totalCompanies ?? companies.length;
    return { companies, schoolsList, totalCompanies };
  } catch {
    return { companies: [], schoolsList: [], totalCompanies: 0 };
  }
}
