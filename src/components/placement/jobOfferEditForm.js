/** Build edit form state from a job-offer API row. */
export function buildJobOfferEditForm(offer) {
  if (!offer) return {};
  return {
    company_id: offer.company_id || '',
    company_name: offer.company_name || offer.capstone_company_name || '',
    designation: offer.placement_designation || offer.capstone_designation || offer.designation || '',
    job_type: offer.offer_job_type || offer.job_type || '',
    offer_letter_status:
      offer.placement_offer_letter_status ||
      offer.capstone_offer_letter_status ||
      offer.offer_letter_status ||
      '',
    academic_year:
      offer.offer_academic_year ||
      offer.placement_academic_year ||
      offer.capstone_academic_year ||
      offer.academic_year ||
      '',
    remarks: offer.offer_remarks || offer.placement_remarks || offer.capstone_remarks || offer.remarks || '',
    job_description: offer.placement_job_description || offer.capstone_description || '',
    ctc_min_lpa: offer.placement_ctc_min_lpa ?? '',
    ctc_max_lpa: offer.placement_ctc_max_lpa ?? '',
    ctc_variable_pay: offer.placement_ctc_variable_pay ?? '',
    ctc_stock_in_lpa: offer.placement_ctc_stock_in_lpa ?? '',
    type_of_hiring: offer.placement_type_of_hiring || '',
    internship_duration_months:
      offer.capstone_internship_duration_months || offer.internship_duration || '',
    internship_stipend_min: offer.capstone_internship_stipend_min || offer.internship_stipend_min || '',
    internship_stipend_max: offer.capstone_internship_stipend_max || offer.internship_stipend_max || '',
  };
}

export function getJobOfferUpdateId(offer) {
  if (!offer) return null;
  const id = offer.offer_row_id ?? offer.id ?? offer.placement_id;
  return id != null && id !== '' ? id : null;
}
