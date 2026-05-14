import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Button,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Flex,
  Spacer,
  SimpleGrid,
  Card,
  CardBody,
  VStack,
  useToast,
  Container,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  useDisclosure,
  Textarea,
  Spinner,
  Checkbox,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { SearchIcon, AddIcon, ArrowBackIcon, DownloadIcon, EditIcon } from '@chakra-ui/icons';
import { BsLayoutThreeColumns } from 'react-icons/bs';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { IconButton } from '@chakra-ui/react';
import * as XLSX from 'xlsx';
import AdminLayout from '../../components/AdminLayout';
import { PlacementService } from '../../services/placement.service';

const JobOffers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get prefill data from location state (from DriveProcess page)
  const prefillData = location.state?.prefillData;
  const prefillStudents = location.state?.selectedStudents || [];

  // Column Visibility State - Organized by category (consolidated, no duplicates)
  const studentColumns = [
    { id: 'usn', label: 'USN' },
    { id: 'student', label: 'Student Name' },
    { id: 'batch', label: 'Batch' },
    { id: 'school', label: 'School' },
    { id: 'program', label: 'Program' },
  ];

  const offerColumns = [
    { id: 'company', label: 'Company' },
    { id: 'designation', label: 'Designation' },
    { id: 'job_type', label: 'Job Type' },
    { id: 'offer_status', label: 'Offer Status' },
    { id: 'academic_year', label: 'Academic Year' },
    { id: 'source', label: 'Source' },
    { id: 'remarks', label: 'Remarks' },
    { id: 'actions', label: 'Actions' },
  ];

  const placementColumns = [
    { id: 'ctc_min', label: 'CTC Min (LPA)' },
    { id: 'ctc_max', label: 'CTC Max (LPA)' },
    { id: 'ctc_variable', label: 'Variable Pay' },
    { id: 'ctc_stock', label: 'Stock (LPA)' },
    { id: 'type_of_hiring', label: 'Type of Hiring' },
    { id: 'job_description', label: 'Job Description' },
  ];

  const capstoneColumns = [
    { id: 'internship_duration', label: 'Internship Duration (Months)' },
    { id: 'stipend_min', label: 'Stipend Min' },
    { id: 'stipend_max', label: 'Stipend Max' },
    { id: 'capstone_description', label: 'Capstone Description' },
  ];

  const allColumns = [...studentColumns, ...offerColumns, ...placementColumns, ...capstoneColumns];

  const columnGroups = [
    {
      id: 'student_info',
      label: 'Student Information',
      columns: studentColumns,
    },
    {
      id: 'offer_details',
      label: 'Offer Details (Common)',
      columns: offerColumns,
    },
    {
      id: 'placement_details',
      label: 'Placement Specific',
      columns: placementColumns,
    },
    {
      id: 'capstone_details',
      label: 'Capstone Specific',
      columns: capstoneColumns,
    },
  ];

  // Default visible columns - show student info and key offer columns
  const defaultVisibleColumns = [
    'usn', 'student', 'batch', 'company', 'designation', 'job_type', 
    'ctc_min', 'ctc_max', 'offer_status', 'source', 'actions'
  ];

  const [visibleColumns, setVisibleColumns] = useState(defaultVisibleColumns);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [ctcSort, setCtcSort] = useState('none');

  // New Offer Form State
  const [newOffer, setNewOffer] = useState({
    company_name: '',
    company_id: '',
    designation: '',
    job_type: '',
    internship_duration: '',
    internship_stipend: '',
    ctc_min: '',
    ctc_max: '',
    variable_pay: '',
    offer_letter_status: '',
    final_interview_status: '',
    remarks: '',
    placement_drive_id: ''
  });

  const [formMetaLoading, setFormMetaLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [formDrives, setFormDrives] = useState([]);
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [driveRegistrations, setDriveRegistrations] = useState({});
  const [studentDriveMap, setStudentDriveMap] = useState({});
  const [studentProcessLoadingUsns, setStudentProcessLoadingUsns] = useState([]);
  const [saving, setSaving] = useState(false);

  const studentBoxRef = useRef(null);

  // Load prefill data when component mounts
  useEffect(() => {
    if (prefillData || prefillStudents.length > 0) {
      // Set prefill data
      if (prefillData) {
        const driveId = prefillData.placement_drive_id != null ? String(prefillData.placement_drive_id) : '';
        setNewOffer(prev => ({
          ...prev,
          company_name: prefillData.company_name || '',
          company_id: prefillData.company_id || '',
          placement_drive_id: driveId,
          job_type: prefillData.job_type || '',
          designation: prefillData.designation || '',
          ctc_min: prefillData.ctc_min || '',
          ctc_max: prefillData.ctc_max || '',
          variable_pay: prefillData.variable_pay || '',
          internship_duration: prefillData.internship_duration || '',
          internship_stipend: prefillData.internship_stipend || '',
        }));
      }
      // Set selected students
      if (prefillStudents.length > 0) {
        setSelectedStudents(prefillStudents);
      }
      // Open the modal
      onOpen();
      fetchFormMeta();
      // Pre-load drive registrations so placement drive is linked when saving
      if (prefillData?.placement_drive_id) {
        const id = String(prefillData.placement_drive_id);
        PlacementService.getDriveProcesses(id).then((regs) => {
          setDriveRegistrations((prev) => ({ ...prev, [id]: Array.isArray(regs) ? regs : [] }));
        }).catch(() => {});
      }
    }
  }, []);

  const loadDriveRegistrations = async (driveId) => {
    if (!driveId || driveRegistrations[driveId]) return;
    try {
      const regs = await PlacementService.getDriveProcesses(driveId);
      setDriveRegistrations(prev => ({
        ...prev,
        [driveId]: Array.isArray(regs) ? regs : []
      }));
    } catch (error) {
      console.error('Error loading drive registrations', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'placement_drive_id') {
      const drive = formDrives.find(d => String(d.id) === String(value));
      setNewOffer(prev => ({
        ...prev,
        placement_drive_id: value,
        company_name: drive && drive.company_name ? drive.company_name : prev.company_name,
        company_id: drive && drive.company_id ? drive.company_id : prev.company_id
      }));
      loadDriveRegistrations(value);
      return;
    }
    if (name === 'company_name') {
      const company = allCompanies.find(c => c.company_name === value);
      setNewOffer(prev => ({
        ...prev,
        company_name: value,
        company_id: company && company.id ? company.id : prev.company_id
      }));
      return;
    }
    setNewOffer(prev => ({ ...prev, [name]: value }));
  };

  const handleAddOffer = async () => {
    if (selectedStudents.length === 0) {
      toast({ title: "Select at least one student", status: "warning" });
      return;
    }

    if (!newOffer.job_type) {
      toast({ title: "Select a job type", status: "warning" });
      return;
    }

    if (!newOffer.company_name) {
      toast({ title: "Company is required", status: "warning" });
      return;
    }

    try {
      setSaving(true);
      const driveId = newOffer.placement_drive_id || null;

      const processMap = new Map();
      if (driveId) {
        let regs = driveRegistrations[driveId];
        if (!regs) {
          try {
            regs = await PlacementService.getDriveProcesses(driveId);
          } catch (error) {
            console.error('Error fetching drive registrations for offer creation', error);
            regs = [];
          }
        }
        if (Array.isArray(regs)) {
          regs.forEach(r => {
            if (r && r.usn && r.id) {
              processMap.set(r.usn, r.id);
            }
          });
        }
      }

      const basePayload = {
        ...newOffer,
        company_id: newOffer.company_id || undefined,
        ctc_min_lpa: newOffer.ctc_min,
        ctc_max_lpa: newOffer.ctc_max,
        ctc_variable_pay: newOffer.variable_pay
      };

      let successCount = 0;
      let failureCount = 0;

      for (const student of selectedStudents) {
        const processId = processMap.get(student.usn) || undefined;

        const offerPayload = {
          ...basePayload,
          usn: student.usn,
          ...(processId != null && { process_id: processId })
        };

        try {
          await PlacementService.addJobOffer(offerPayload);
          successCount += 1;
        } catch (error) {
          console.error('Error adding offer for', student.usn, error);
          failureCount += 1;
        }
      }

      if (successCount === 0) {
        toast({
          title: "Failed to add job offers",
          description: failureCount > 1 ? "All selected students failed" : "Please check the form details",
          status: "error"
        });
        return;
      }

      const title =
        successCount === 1
          ? "Job offer added for 1 student"
          : `Job offers added for ${successCount} students`;

      toast({ title, status: "success" });
      onClose();
      resetForm();
      fetchOffers();
    } catch (error) {
      toast({ title: error.message || "Error adding offer", status: "error" });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setNewOffer({
      company_name: '',
      company_id: '',
      designation: '',
      job_type: '',
      internship_duration: '',
      internship_stipend: '',
      ctc_min: '',
      ctc_max: '',
      variable_pay: '',
      offer_letter_status: '',
      final_interview_status: '',
      remarks: '',
      placement_drive_id: ''
    });
    setSelectedStudents([]);
    setStudentSearch('');
  };

  // Edit offer functions
  const handleEditOffer = (offer) => {
    setEditingOffer(offer);
    setEditForm({
      company_id: offer.company_id || '',
      company_name: offer.company_name || offer.capstone_company_name || '',
      designation: offer.placement_designation || offer.capstone_designation || offer.designation || '',
      job_type: offer.offer_job_type || offer.job_type || '',
      offer_letter_status: offer.placement_offer_letter_status || offer.capstone_offer_letter_status || offer.offer_letter_status || '',
      academic_year: offer.offer_academic_year || offer.placement_academic_year || offer.capstone_academic_year || offer.academic_year || '',
      remarks: offer.offer_remarks || offer.placement_remarks || offer.capstone_remarks || offer.remarks || '',
      job_description: offer.placement_job_description || offer.capstone_description || '',
      ctc_min_lpa: offer.placement_ctc_min_lpa || '',
      ctc_max_lpa: offer.placement_ctc_max_lpa || '',
      ctc_variable_pay: offer.placement_ctc_variable_pay || '',
      ctc_stock_in_lpa: offer.placement_ctc_stock_in_lpa || '',
      type_of_hiring: offer.placement_type_of_hiring || '',
      internship_duration_months: offer.capstone_internship_duration_months || offer.internship_duration || '',
      internship_stipend_min: offer.capstone_internship_stipend_min || offer.internship_stipend_min || '',
      internship_stipend_max: offer.capstone_internship_stipend_max || offer.internship_stipend_max || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'company_name') {
      const company = allCompanies.find(c => c.company_name === value);
      setEditForm(prev => ({
        ...prev,
        company_name: value,
        company_id: company?.id || prev.company_id
      }));
      return;
    }
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editingOffer?.id) return;

    try {
      setEditSaving(true);
      await PlacementService.updateJobOffer(editingOffer.id, editForm);
      toast({ title: "Job offer updated successfully", status: "success" });
      setIsEditModalOpen(false);
      setEditingOffer(null);
      fetchOffers();
    } catch (error) {
      toast({ title: error.message || "Error updating offer", status: "error" });
    } finally {
      setEditSaving(false);
    }
  };

  // Master list of schools
  const ALL_SCHOOLS = [
    'SoB',
    'SoCSE - BTech',
    'SoB - PG',
    'SoD - UG',
    'SoCSE - BSc',
    'SoB (Hons)',
    'SoLAS',
    'SoD - PG',
    'SoE',
    'SoFMA'
  ];

  // Stats for the School Filter Cards
  const schoolStats = useMemo(() => {
    const stats = ALL_SCHOOLS.reduce((acc, school) => {
      acc[school] = 0;
      return acc;
    }, {});

    offers.forEach(offer => {
      const school = offer.school ? offer.school.trim() : 'Other';
      stats[school] = (stats[school] || 0) + 1;
    });
    
    return Object.entries(stats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [offers]);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchFormMeta = async () => {
    setFormMetaLoading(true);
    try {
      const [studentsData, companiesData, drivesData] = await Promise.all([
        PlacementService.getAllStudents(),
        PlacementService.getAllCompanies(),
        PlacementService.getAllDrives()
      ]);
      setStudents(studentsData || []);
      setAllCompanies(companiesData || []);
      setFormDrives(drivesData || []);
    } catch (error) {
      console.error('Error loading form meta', error);
      toast({
        title: "Error loading form data",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setFormMetaLoading(false);
    }
  };

  const handleOpenAddOffer = () => {
    onOpen();
    if (!formMetaLoading && students.length === 0 && allCompanies.length === 0 && formDrives.length === 0) {
      fetchFormMeta();
    }
  };

  const filteredStudentsForModal = useMemo(() => {
    const driveId = newOffer.placement_drive_id;
    let list = Array.isArray(students) ? students : [];
    if (driveId && driveRegistrations[driveId]) {
      const allowedUsns = new Set(driveRegistrations[driveId].map(r => r.usn));
      list = list.filter(s => allowedUsns.has(s.usn));
    }
    if (!studentSearch) {
      return list.slice(0, 50);
    }
    const q = studentSearch.toLowerCase().trim();
    const filtered = list.filter(s => {
      const name = (s.name || s.student_name || '').toLowerCase();
      const usn = (s.usn || '').toLowerCase();
      const email = (s.email || s.college_email || '').toLowerCase();
      return name.includes(q) || usn.includes(q) || email.includes(q);
    });
    return filtered.slice(0, 50);
  }, [students, studentSearch, newOffer.placement_drive_id, driveRegistrations]);

  const filteredDrivesForModal = useMemo(() => {
    if (!Array.isArray(formDrives) || formDrives.length === 0) return [];
    if (selectedStudents.length === 0) return formDrives;
    const usns = selectedStudents.map(s => s.usn).filter(Boolean);
    const someMissing = usns.some(usn => !studentDriveMap[usn]);
    if (someMissing) return formDrives;
    const driveIdSets = usns.map(usn => new Set(studentDriveMap[usn] || []));
    const filtered = formDrives.filter(drive => {
      const id = drive.id;
      if (!id) return false;
      return driveIdSets.every(set => set.has(id));
    });
    // If filtered is empty but we have a pre-selected drive (e.g. from process page), show all so it displays
    const preSelectedId = newOffer.placement_drive_id ? String(newOffer.placement_drive_id) : null;
    if (filtered.length === 0 && preSelectedId && formDrives.some(d => String(d.id) === preSelectedId)) {
      return formDrives;
    }
    return filtered;
  }, [formDrives, selectedStudents, studentDriveMap, newOffer.placement_drive_id]);

  const isStudentSelected = (usn) => {
    return selectedStudents.some(s => s.usn === usn);
  };

  const toggleStudentSelection = (student) => {
    setSelectedStudents(prev => {
      const exists = prev.some(s => s.usn === student.usn);
      if (exists) {
        return prev.filter(s => s.usn !== student.usn);
      }
      return [...prev, student];
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isStudentDropdownOpen && studentBoxRef.current && !studentBoxRef.current.contains(event.target)) {
        setIsStudentDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStudentDropdownOpen]);

  useEffect(() => {
    const usns = selectedStudents.map(s => s.usn).filter(Boolean);
    const missing = usns.filter(usn => !studentDriveMap[usn] && !studentProcessLoadingUsns.includes(usn));
    if (!missing.length) return;
    setStudentProcessLoadingUsns(prev => [...prev, ...missing]);
    missing.forEach(async (usn) => {
      try {
        const processes = await PlacementService.getStudentProcess(usn);
        const driveIds = Array.isArray(processes)
          ? processes.map(p => p.placement_drive_id).filter(Boolean)
          : [];
        setStudentDriveMap(prev => ({
          ...prev,
          [usn]: Array.from(new Set(driveIds))
        }));
      } catch (error) {
        console.error('Error loading student process', error);
        setStudentDriveMap(prev => ({
          ...prev,
          [usn]: []
        }));
      } finally {
        setStudentProcessLoadingUsns(prev => prev.filter(x => x !== usn));
      }
    });
  }, [selectedStudents, studentDriveMap, studentProcessLoadingUsns]);

  const fetchOffers = async () => {
    setLoading(true);
    try {
      const data = await PlacementService.getAllJobOffers();
      setOffers(data);
    } catch (error) {
      toast({
        title: "Error fetching offers",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCompany('');
    setSelectedJobType('');
    setSelectedBatch('');
    setSelectedSchools([]);
  };

  const handleDownloadExcel = () => {
    if (filteredOffers.length === 0) {
      toast({ title: "No data to export", status: "warning" });
      return;
    }

    const exportData = filteredOffers.map(offer => {
      // Consolidated values
      const companyName = offer.company_name || offer.capstone_company_name || '';
      const designation = offer.placement_designation || offer.capstone_designation || offer.designation || '';
      const jobType = offer.offer_job_type || offer.job_type || '';
      const offerStatus = offer.placement_offer_letter_status || offer.capstone_offer_letter_status || offer.offer_letter_status || '';
      const academicYear = offer.offer_academic_year || offer.placement_academic_year || offer.capstone_academic_year || offer.academic_year || '';
      const remarks = offer.offer_remarks || offer.placement_remarks || offer.capstone_remarks || offer.remarks || '';

      return {
        // Student Info
        USN: offer.usn,
        "Student Name": offer.student_name,
        Batch: offer.batch,
        School: offer.school,
        Program: offer.program,
        
        // Common Offer Details (consolidated)
        Company: companyName,
        Designation: designation,
        "Job Type": jobType,
        "Offer Status": offerStatus,
        "Academic Year": academicYear,
        Source: offer.source,
        Remarks: remarks,
        
        // Placement Specific
        "CTC Min (LPA)": offer.placement_ctc_min_lpa,
        "CTC Max (LPA)": offer.placement_ctc_max_lpa,
        "Variable Pay": offer.placement_ctc_variable_pay,
        "Stock (LPA)": offer.placement_ctc_stock_in_lpa,
        "Type of Hiring": offer.placement_type_of_hiring,
        "Job Description": offer.placement_job_description,
        
        // Capstone Specific
        "Internship Duration (Months)": offer.capstone_internship_duration_months || offer.internship_duration,
        "Stipend Min": offer.capstone_internship_stipend_min || offer.internship_stipend_min,
        "Stipend Max": offer.capstone_internship_stipend_max || offer.internship_stipend_max,
        "Capstone Description": offer.capstone_description,
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Job Offers");
    
    XLSX.writeFile(wb, "Job_Offers.xlsx");
    
    toast({ title: "Download started", status: "success" });
  };

  // Unique companies for dropdown
  const companies = [...new Set(offers.map(o => o.company_name).filter(Boolean))];
  const jobTypes = [...new Set(offers.map(o => o.job_type).filter(Boolean))];
  const batches = [...new Set(offers.map(o => o.batch).filter(Boolean))].sort((a, b) => b - a);

  // Search Priority Logic
  const getMatchScore = (offer, query) => {
    if (!query) return 0;
    const q = query.toLowerCase();
    if ((offer.student_name?.toLowerCase() || '').includes(q)) return 4;
    if ((offer.company_name?.toLowerCase() || '').includes(q)) return 3;
    if ((offer.usn?.toLowerCase() || '').includes(q)) return 2;
    if ((offer.designation?.toLowerCase() || '').includes(q)) return 1;
    if ((offer.job_type?.toLowerCase() || '').includes(q)) return 1;
    return 0;
  };

  const ctcValue = (offer) => {
    const toNum = (v) => {
      if (v === null || v === undefined) return NaN;
      const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
      return Number.isNaN(n) ? NaN : n;
    };
    // Try placement CTC first, then fallback to legacy fields
    const min = toNum(offer.placement_ctc_min_lpa ?? offer.ctc_min_lpa ?? offer.ctc_min);
    const max = toNum(offer.placement_ctc_max_lpa ?? offer.ctc_max_lpa ?? offer.ctc_max);
    if (!Number.isNaN(max)) return max;
    if (!Number.isNaN(min)) return min;
    const fallback = toNum(offer.ctc);
    if (!Number.isNaN(fallback)) return fallback;
    return NaN;
  };

  const formatCTC = (offer) => {
    const toNum = (v) => {
      if (v === null || v === undefined) return NaN;
      const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
      return Number.isNaN(n) ? NaN : n;
    };
    const minStr = offer.placement_ctc_min_lpa ?? offer.ctc_min_lpa ?? offer.ctc_min;
    const maxStr = offer.placement_ctc_max_lpa ?? offer.ctc_max_lpa ?? offer.ctc_max;
    const min = toNum(minStr);
    const max = toNum(maxStr);
    if (!Number.isNaN(min) && !Number.isNaN(max)) {
      if (min === max) return `${min}`;
      return `${Math.min(min, max)}-${Math.max(min, max)}`;
    }
    if (!Number.isNaN(min)) return `${min}`;
    if (!Number.isNaN(max)) return `${max}`;
    if (offer.ctc) return String(offer.ctc);
    return '-';
  };

  const filteredOffersBase = useMemo(
    () =>
      offers.filter(offer => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          (offer.student_name?.toLowerCase() || '').includes(query) ||
          (offer.company_name?.toLowerCase() || '').includes(query) ||
          (offer.designation?.toLowerCase() || '').includes(query) ||
          (offer.usn?.toLowerCase() || '').includes(query) ||
          (offer.job_type?.toLowerCase() || '').includes(query);
        
        const matchesCompany = selectedCompany ? offer.company_name === selectedCompany : true;
        const matchesJobType = selectedJobType ? offer.job_type === selectedJobType : true;
        const matchesBatch = selectedBatch ? String(offer.batch) === String(selectedBatch) : true;
        const matchesSchool = selectedSchools.length > 0 ? selectedSchools.some(selected => {
          const offerSchool = offer.school ? offer.school.trim() : 'Other';
          return offerSchool === selected;
        }) : true;
        
        return matchesSearch && matchesCompany && matchesJobType && matchesBatch && matchesSchool;
      }),
    [offers, searchQuery, selectedCompany, selectedJobType, selectedBatch, selectedSchools]
  );

  const filteredOffers = useMemo(() => {
    const list = [...filteredOffersBase];
    const q = searchQuery.trim().toLowerCase();
    list.sort((a, b) => {
      if (ctcSort !== 'none') {
        const va = ctcValue(a);
        const vb = ctcValue(b);
        const aIsNaN = Number.isNaN(va);
        const bIsNaN = Number.isNaN(vb);
        if (aIsNaN !== bIsNaN) return aIsNaN ? 1 : -1;
        if (!aIsNaN && !bIsNaN && va !== vb) {
          return ctcSort === 'asc' ? va - vb : vb - va;
        }
      }
      if (!q) return 0;
      return getMatchScore(b, searchQuery) - getMatchScore(a, searchQuery);
    });
    return list;
  }, [filteredOffersBase, ctcSort, searchQuery]);

  return (
    <AdminLayout>
      <Box bg="#f0f0f0" minH="100vh" pb={10}>
        <Container maxW="7xl" px={{ base: 4, sm: 6, lg: 8 }} pt={8}>
          {/* Prefill Alert */}
          {prefillStudents.length > 0 && (
            <Alert status="info" mb={6} borderRadius="lg">
              <AlertIcon />
              <Box>
                <AlertTitle>Adding job offers for selected students</AlertTitle>
                <AlertDescription>
                  {prefillStudents.length} student(s) pre-selected from the placement drive. Complete the form to add offers.
                </AlertDescription>
              </Box>
            </Alert>
          )}

          {/* Header */}
          <Flex mb={6} justify="space-between" align="center" wrap="wrap" gap={4}>
            <Box>
              <Heading size="lg" color="gray.800">Job Offers</Heading>
              <Text color="gray.500" fontSize="sm">All job offers across students and companies</Text>
            </Box>
            <HStack spacing={3}>
              <Button 
                leftIcon={<BsLayoutThreeColumns />} 
                bg="white" 
                border="1px"
                borderColor="gray.200"
                color="gray.600"
                _hover={{ bg: "gray.50", borderColor: "gray.300" }} 
                onClick={() => setIsColumnModalOpen(true)}
                size="sm"
              >
                Columns
              </Button>
              <Button 
                bg="#22c35e" 
                color="white" 
                _hover={{ bg: "#1da851" }}
                leftIcon={<AddIcon boxSize={3} />}
                onClick={handleOpenAddOffer}
                size="sm"
              >
                Add Offer
              </Button>
              <Button 
                colorScheme="blue"
                variant="outline"
                leftIcon={<DownloadIcon />}
                onClick={handleDownloadExcel}
                size="sm"
              >
                Export Excel
              </Button>
              <Button 
                variant="outline" 
                borderColor="gray.300"
                onClick={() => navigate(-1)}
                size="sm"
                bg="white"
                leftIcon={<ArrowBackIcon />}
              >
                Back
              </Button>
            </HStack>
          </Flex>

          {/* Search & Filters Section */}
          <Box bg="white" p={6} borderRadius="xl" shadow="sm" mb={6} border="1px solid" borderColor="gray.100">
            <Flex gap={4} wrap="wrap" align="center">
              {/* Search Bar */}
              <InputGroup size="md" maxW="400px">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input 
                  placeholder="Search by Student Name, Company, USN..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                  _focus={{ bg: "white", borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                  _hover={{ borderColor: "gray.300" }}
                />
              </InputGroup>

              {/* Filters */}
              <Select 
                placeholder="All Companies" 
                maxW="200px" 
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                _focus={{ borderColor: "blue.500" }}
                size="md"
              >
                {companies.map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
              <Select 
                placeholder="All Job Types" 
                maxW="180px" 
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                value={selectedJobType}
                onChange={(e) => setSelectedJobType(e.target.value)}
                _focus={{ borderColor: "blue.500" }}
                size="md"
              >
                {jobTypes.map(j => <option key={j} value={j}>{j}</option>)}
              </Select>
              
              <Select 
                placeholder="All Batches" 
                maxW="150px" 
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                _focus={{ borderColor: "blue.500" }}
                size="md"
              >
                {batches.map(b => <option key={b} value={b}>{b}</option>)}
              </Select>
              
              <Spacer />
              
              {(searchQuery || selectedCompany || selectedJobType || selectedBatch || selectedSchools.length > 0) && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  colorScheme="red" 
                  onClick={handleClearFilters} 
                  leftIcon={<span style={{fontSize: '16px'}}>×</span>}
                >
                  Clear All Filters
                </Button>
              )}
            </Flex>
          </Box>

          {/* School Stats Filters */}
          <Box mb={8}>
            <Flex justify="space-between" align="center" mb={4}>
               <Text fontWeight="700" color="gray.700" fontSize="lg">Filter by School</Text>
               {selectedSchools.length > 0 && (
                 <Badge colorScheme="blue" variant="solid" borderRadius="full" px={3} py={1}>
                   Selected: {selectedSchools.join(', ')}
                 </Badge>
               )}
            </Flex>
            <Flex gap={4} wrap="wrap" pb={2}>
              {schoolStats.map((stat) => {
                const isSelected = selectedSchools.includes(stat.name);
                return (
                  <Card 
                    key={stat.name} 
                    bg={isSelected ? "blue.50" : "white"}
                    boxShadow={isSelected ? "md" : "sm"}
                    borderRadius="xl" 
                    cursor="pointer"
                    border="1px solid"
                    borderColor={isSelected ? "blue.400" : "gray.100"}
                    onClick={() => {
                        setSelectedSchools(prev => 
                            isSelected 
                            ? prev.filter(s => s !== stat.name)
                            : [...prev, stat.name]
                        );
                    }}
                    minW="110px"
                    _hover={{ transform: 'translateY(-2px)', boxShadow: "md", borderColor: "blue.200" }}
                    transition="all 0.2s"
                  >
                    <CardBody p={4} textAlign="center">
                      <Text fontSize="xs" fontWeight="bold" color={isSelected ? "blue.600" : "gray.500"} mb={1} textTransform="uppercase" letterSpacing="wide">
                        {stat.name}
                      </Text>
                      <Text fontSize="2xl" fontWeight="800" color={isSelected ? "blue.700" : "gray.700"}>
                        {stat.count}
                      </Text>
                    </CardBody>
                  </Card>
                );
              })}
            </Flex>
          </Box>

          {/* Offers Table */}
          <Box bg="white" borderRadius="xl" shadow="sm" overflowX="auto" border="1px solid" borderColor="gray.100">
            <Table variant="simple" size="sm">
              <Thead bg="gray.50" borderBottom="2px solid" borderColor="gray.100">
                <Tr>
                  {/* Student Info Columns */}
                  {visibleColumns.includes('usn') && <Th color="gray.600" fontSize="xs" textTransform="uppercase" py={4} letterSpacing="wider" whiteSpace="nowrap">USN</Th>}
                  {visibleColumns.includes('student') && <Th color="gray.600" fontSize="xs" textTransform="uppercase" py={4} letterSpacing="wider" whiteSpace="nowrap">Student</Th>}
                  {visibleColumns.includes('batch') && <Th color="gray.600" fontSize="xs" textTransform="uppercase" py={4} letterSpacing="wider" whiteSpace="nowrap">Batch</Th>}
                  {visibleColumns.includes('school') && <Th color="gray.600" fontSize="xs" textTransform="uppercase" py={4} letterSpacing="wider" whiteSpace="nowrap">School</Th>}
                  {visibleColumns.includes('program') && <Th color="gray.600" fontSize="xs" textTransform="uppercase" py={4} letterSpacing="wider" whiteSpace="nowrap">Program</Th>}
                  
                  {/* Common Offer Columns */}
                  {visibleColumns.includes('company') && <Th color="gray.600" fontSize="xs" textTransform="uppercase" py={4} letterSpacing="wider" whiteSpace="nowrap">Company</Th>}
                  {visibleColumns.includes('designation') && <Th color="gray.600" fontSize="xs" textTransform="uppercase" py={4} letterSpacing="wider" whiteSpace="nowrap">Designation</Th>}
                  {visibleColumns.includes('job_type') && <Th color="gray.600" fontSize="xs" textTransform="uppercase" py={4} letterSpacing="wider" whiteSpace="nowrap">Job Type</Th>}
                  {visibleColumns.includes('academic_year') && <Th color="gray.600" fontSize="xs" textTransform="uppercase" py={4} letterSpacing="wider" whiteSpace="nowrap">Academic Year</Th>}
                  {visibleColumns.includes('source') && <Th color="gray.600" fontSize="xs" textTransform="uppercase" py={4} letterSpacing="wider" whiteSpace="nowrap">Source</Th>}
                  {visibleColumns.includes('remarks') && <Th color="gray.600" fontSize="xs" textTransform="uppercase" py={4} letterSpacing="wider" whiteSpace="nowrap">Remarks</Th>}
                  
                  {/* Placement Specific Columns */}
                  {visibleColumns.includes('ctc_min') && (
                    <Th color="gray.600" fontSize="xs" textTransform="uppercase" py={4} letterSpacing="wider" whiteSpace="nowrap">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => setCtcSort(prev => prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none')}
                        p={0}
                      >
                        <HStack spacing={1} align="center">
                          <Text fontSize="xs">CTC Min</Text>
                          <HStack spacing={0} align="center">
                            <FiArrowUp size={10} color={ctcSort === 'asc' ? '#2b6cb0' : '#cbd5e0'} />
                            <FiArrowDown size={10} color={ctcSort === 'desc' ? '#2b6cb0' : '#cbd5e0'} />
                          </HStack>
                        </HStack>
                      </Button>
                    </Th>
                  )}
                  {visibleColumns.includes('ctc_max') && <Th color="gray.600" fontSize="xs" textTransform="uppercase" py={4} letterSpacing="wider" whiteSpace="nowrap">CTC Max</Th>}
                  {visibleColumns.includes('ctc_variable') && <Th color="gray.600" fontSize="xs" textTransform="uppercase" py={4} letterSpacing="wider" whiteSpace="nowrap">Variable Pay</Th>}
                  {visibleColumns.includes('ctc_stock') && <Th color="gray.600" fontSize="xs" textTransform="uppercase" py={4} letterSpacing="wider" whiteSpace="nowrap">Stock (LPA)</Th>}
                  {visibleColumns.includes('type_of_hiring') && <Th color="gray.600" fontSize="xs" textTransform="uppercase" py={4} letterSpacing="wider" whiteSpace="nowrap">Hiring Type</Th>}
                  {visibleColumns.includes('job_description') && <Th color="gray.600" fontSize="xs" textTransform="uppercase" py={4} letterSpacing="wider" whiteSpace="nowrap">Job Description</Th>}
                  
                  {/* Capstone Specific Columns */}
                  {visibleColumns.includes('internship_duration') && <Th color="gray.600" fontSize="xs" textTransform="uppercase" py={4} letterSpacing="wider" whiteSpace="nowrap">Duration (Months)</Th>}
                  {visibleColumns.includes('stipend_min') && <Th color="gray.600" fontSize="xs" textTransform="uppercase" py={4} letterSpacing="wider" whiteSpace="nowrap">Stipend Min</Th>}
                  {visibleColumns.includes('stipend_max') && <Th color="gray.600" fontSize="xs" textTransform="uppercase" py={4} letterSpacing="wider" whiteSpace="nowrap">Stipend Max</Th>}
                  
                  {/* Status and Actions - Always Last */}
                  {visibleColumns.includes('offer_status') && <Th color="gray.600" fontSize="xs" textTransform="uppercase" py={4} letterSpacing="wider" whiteSpace="nowrap">Status</Th>}
                  {visibleColumns.includes('actions') && <Th color="gray.600" fontSize="xs" textTransform="uppercase" py={4} letterSpacing="wider" whiteSpace="nowrap">Actions</Th>}
                </Tr>
              </Thead>
              <Tbody>
                {loading ? (
                  <Tr>
                    <Td colSpan={visibleColumns.length} textAlign="center" py={10}>
                      <Spinner size="xl" color="blue.500" />
                      <Text mt={4} color="gray.500">Loading offers...</Text>
                    </Td>
                  </Tr>
                ) : filteredOffers.length === 0 ? (
                  <Tr>
                    <Td colSpan={visibleColumns.length} textAlign="center" py={10}>
                      <Text color="gray.500">No offers found</Text>
                    </Td>
                  </Tr>
                ) : (
                  filteredOffers.map((offer) => {
                    // Consolidated values - pick from placement or capstone based on source
                    const companyName = offer.company_name || offer.capstone_company_name || '-';
                    const designation = offer.placement_designation || offer.capstone_designation || offer.designation || '-';
                    const jobType = offer.offer_job_type || offer.job_type || '-';
                    const offerStatus = offer.placement_offer_letter_status || offer.capstone_offer_letter_status || offer.offer_letter_status || 'Pending';
                    const academicYear = offer.offer_academic_year || offer.placement_academic_year || offer.capstone_academic_year || offer.academic_year || '-';
                    const remarks = offer.offer_remarks || offer.placement_remarks || offer.capstone_remarks || offer.remarks || '-';

                    return (
                      <Tr key={offer.id} _hover={{ bg: "gray.50" }} transition="all 0.2s">
                        {/* Student Info Cells */}
                        {visibleColumns.includes('usn') && (
                          <Td>
                            <Badge colorScheme="purple" fontSize="xs" variant="subtle">{offer.usn}</Badge>
                          </Td>
                        )}
                        {visibleColumns.includes('student') && (
                          <Td fontSize="sm" fontWeight="600" color="gray.700">
                            {offer.usn ? (
                              <Button
                                variant="link"
                                color="blue.600"
                                onClick={() => navigate(`/placement/students/${encodeURIComponent(offer.usn)}`)}
                                sx={{ textDecoration: 'underline' }}
                                size="sm"
                              >
                                {offer.student_name || offer.usn}
                              </Button>
                            ) : (
                              offer.student_name || '-'
                            )}
                          </Td>
                        )}
                        {visibleColumns.includes('batch') && (
                          <Td fontSize="sm" color="gray.600">{offer.batch || '-'}</Td>
                        )}
                        {visibleColumns.includes('school') && (
                          <Td fontSize="sm" color="gray.600">{offer.school || '-'}</Td>
                        )}
                        {visibleColumns.includes('program') && (
                          <Td fontSize="sm" color="gray.600">{offer.program || '-'}</Td>
                        )}
                        
                        {/* Common Offer Cells */}
                        {visibleColumns.includes('company') && (
                          <Td fontSize="sm" fontWeight="600" color="gray.700">
                            {offer.company_id ? (
                              <Text 
                                as="span" 
                                color="blue.600" 
                                cursor="pointer" 
                                _hover={{ textDecoration: 'underline' }}
                                onClick={() => navigate(`/placement/company/${offer.company_id}`)}
                              >
                                {companyName}
                              </Text>
                            ) : (
                              companyName
                            )}
                          </Td>
                        )}
                        {visibleColumns.includes('designation') && (
                          <Td fontSize="sm" color="gray.600">{designation}</Td>
                        )}
                        {visibleColumns.includes('job_type') && (
                          <Td fontSize="sm" color="gray.600">{jobType}</Td>
                        )}
                        {visibleColumns.includes('academic_year') && (
                          <Td fontSize="sm" color="gray.600">{academicYear}</Td>
                        )}
                        {visibleColumns.includes('source') && (
                          <Td>
                            <Badge 
                              colorScheme={offer.source === 'capstone' ? 'purple' : offer.source === 'placement' ? 'blue' : 'gray'}
                              fontSize="xs"
                              variant="subtle"
                            >
                              {offer.source || 'offer'}
                            </Badge>
                          </Td>
                        )}
                        {visibleColumns.includes('remarks') && (
                          <Td fontSize="sm" color="gray.600" maxW="200px" isTruncated title={remarks}>
                            {remarks}
                          </Td>
                        )}
                        
                        {/* Placement Specific Cells */}
                        {visibleColumns.includes('ctc_min') && (
                          <Td fontSize="sm" color="gray.600">{offer.placement_ctc_min_lpa || '-'}</Td>
                        )}
                        {visibleColumns.includes('ctc_max') && (
                          <Td fontSize="sm" color="gray.600">{offer.placement_ctc_max_lpa || '-'}</Td>
                        )}
                        {visibleColumns.includes('ctc_variable') && (
                          <Td fontSize="sm" color="gray.600">{offer.placement_ctc_variable_pay || '-'}</Td>
                        )}
                        {visibleColumns.includes('ctc_stock') && (
                          <Td fontSize="sm" color="gray.600">{offer.placement_ctc_stock_in_lpa || '-'}</Td>
                        )}
                        {visibleColumns.includes('type_of_hiring') && (
                          <Td fontSize="sm" color="gray.600">{offer.placement_type_of_hiring || '-'}</Td>
                        )}
                        {visibleColumns.includes('job_description') && (
                          <Td fontSize="sm" color="gray.600" maxW="200px" isTruncated title={offer.placement_job_description}>
                            {offer.placement_job_description || '-'}
                          </Td>
                        )}
                        
                        {/* Capstone Specific Cells */}
                        {visibleColumns.includes('internship_duration') && (
                          <Td fontSize="sm" color="gray.600">{offer.capstone_internship_duration_months || offer.internship_duration || '-'}</Td>
                        )}
                        {visibleColumns.includes('stipend_min') && (
                          <Td fontSize="sm" color="gray.600">{offer.capstone_internship_stipend_min || offer.internship_stipend_min || '-'}</Td>
                        )}
                        {visibleColumns.includes('stipend_max') && (
                          <Td fontSize="sm" color="gray.600">{offer.capstone_internship_stipend_max || offer.internship_stipend_max || '-'}</Td>
                        )}
                        
                        {/* Status and Actions - Always Last */}
                        {visibleColumns.includes('offer_status') && (
                          <Td>
                            <Badge 
                              colorScheme={
                                ['Issued', 'Accepted'].includes(offerStatus) ? 'green' :
                                ['Yet to Receive', 'Pending'].includes(offerStatus) ? 'orange' :
                                offerStatus === 'Rejected' ? 'red' : 'gray'
                              }
                              px={2}
                              py={0.5}
                              borderRadius="full"
                              fontSize="xs"
                              textTransform="capitalize"
                            >
                              {offerStatus}
                            </Badge>
                          </Td>
                        )}
                        {visibleColumns.includes('actions') && (
                          <Td>
                            <IconButton
                              icon={<EditIcon />}
                              size="sm"
                              variant="ghost"
                              colorScheme="blue"
                              aria-label="Edit offer"
                              onClick={() => handleEditOffer(offer)}
                            />
                          </Td>
                        )}
                      </Tr>
                    );
                  })
                )}
              </Tbody>
            </Table>
          </Box>
          
          {/* Column Selector Modal */}
          <Modal isOpen={isColumnModalOpen} onClose={() => setIsColumnModalOpen(false)} size="4xl" scrollBehavior="inside">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Select Columns</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <VStack align="stretch" spacing={6}>
                  {columnGroups.map(group => (
                    <Box key={group.id} borderWidth="1px" borderRadius="lg" p={4} bg="gray.50">
                      <Flex justify="space-between" align="center" mb={4}>
                        <Heading size="sm" color="gray.700">{group.label}</Heading>
                        <HStack spacing={2}>
                          <Button
                            size="xs"
                            colorScheme="blue"
                            variant="ghost"
                            onClick={() => {
                              const ids = group.columns.map(c => c.id);
                              setVisibleColumns(prev => Array.from(new Set([...prev, ...ids])));
                            }}
                          >
                            Select All
                          </Button>
                          <Button
                            size="xs"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => {
                              const ids = group.columns.map(c => c.id);
                              setVisibleColumns(prev => prev.filter(id => !ids.includes(id)));
                            }}
                          >
                            Clear
                          </Button>
                        </HStack>
                      </Flex>
                      <Divider mb={4} borderColor="gray.300" />
                      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
                        {group.columns.map(col => (
                          <Checkbox
                            key={col.id}
                            isChecked={visibleColumns.includes(col.id)}
                            onChange={() => {
                              setVisibleColumns(prev =>
                                prev.includes(col.id)
                                  ? prev.filter(id => id !== col.id)
                                  : [...prev, col.id]
                              );
                            }}
                          >
                            <Text fontSize="sm">{col.label}</Text>
                          </Checkbox>
                        ))}
                      </SimpleGrid>
                    </Box>
                  ))}
                </VStack>
              </ModalBody>
              <ModalFooter>
                <HStack spacing={4}>
                  <Button variant="ghost" onClick={() => setIsColumnModalOpen(false)}>Close</Button>
                </HStack>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* Add Job Offer Modal - matches frontend-Copy */}
          <Modal isOpen={isOpen} onClose={onClose} size="xl" closeOnOverlayClick={!saving}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Add Job Offer</ModalHeader>
              <ModalCloseButton isDisabled={saving} />
              <ModalBody>
                {formMetaLoading ? (
                  <Flex justify="center" align="center" minH="200px">
                    <Spinner />
                  </Flex>
                ) : (
                  <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                      <FormLabel>Students</FormLabel>
                      <Box position="relative" ref={studentBoxRef}>
                        <HStack spacing={2} flexWrap="wrap" mb={2}>
                          {selectedStudents.map(student => (
                            <HStack
                              key={student.usn}
                              spacing={1}
                              p={1}
                              borderRadius="md"
                              border="1px solid"
                              borderColor="gray.200"
                              bg="gray.50"
                            >
                              <Badge colorScheme="blue">
                                {student.usn}
                              </Badge>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => toggleStudentSelection(student)}
                              >
                                Remove
                              </Button>
                            </HStack>
                          ))}
                        </HStack>
                        <Input
                          placeholder="Type name or USN"
                          value={studentSearch}
                          onChange={(e) => {
                            setStudentSearch(e.target.value);
                            setIsStudentDropdownOpen(true);
                          }}
                          onFocus={() => setIsStudentDropdownOpen(true)}
                          bg="white"
                          border="1px solid"
                          borderColor="blue.300"
                          _focus={{ bg: "white", borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                          _hover={{ borderColor: "blue.400" }}
                        />
                        {isStudentDropdownOpen && (
                          <Box
                            position="absolute"
                            zIndex={10}
                            bg="white"
                            border="1px solid"
                            borderColor="gray.200"
                            borderRadius="md"
                            mt={1}
                            maxH="260px"
                            overflowY="auto"
                            w="100%"
                          >
                            {filteredStudentsForModal.length === 0 ? (
                              <Box p={3}>
                                <Text fontSize="sm" color="gray.500">No students found</Text>
                              </Box>
                            ) : (
                              filteredStudentsForModal.map((student) => (
                                <Box
                                  key={student.usn}
                                  px={3}
                                  py={3}
                                  _hover={{ bg: "gray.100" }}
                                  cursor="pointer"
                                  onMouseDown={() => {
                                    toggleStudentSelection(student);
                                  }}
                                >
                                  <HStack spacing={3}>
                                    <Text fontWeight="semibold">
                                      {student.name || student.student_name}
                                    </Text>
                                    <Badge colorScheme="blue">
                                      {student.usn}
                                    </Badge>
                                    <Text color="gray.600">
                                      {student.school || 'School N/A'}
                                    </Text>
                                  </HStack>
                                </Box>
                              ))
                            )}
                          </Box>
                        )}
                      </Box>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Placement Drive (optional)</FormLabel>
                      <Select
                        name="placement_drive_id"
                        placeholder="Select drive or leave unlinked"
                        value={newOffer.placement_drive_id != null ? String(newOffer.placement_drive_id) : ''}
                        onChange={handleInputChange}
                      >
                        {filteredDrivesForModal.map((drive) => (
                          <option key={drive.id} value={String(drive.id)}>
                            {drive.id} - {drive.company_name} - {drive.job_type}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl isRequired>
                      <FormLabel>Company</FormLabel>
                      <Select
                        name="company_name"
                        placeholder={allCompanies.length === 0 ? "No companies available" : "Select company"}
                        value={newOffer.company_name}
                        onChange={handleInputChange}
                      >
                        {allCompanies.map((company) => (
                          <option key={company.id} value={company.company_name}>
                            {company.company_name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Designation</FormLabel>
                      <Input name="designation" value={newOffer.designation} onChange={handleInputChange} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Job Type</FormLabel>
                      <Select name="job_type" placeholder="Select Job Type" value={newOffer.job_type} onChange={handleInputChange}>
                        <option value="internship">Internship</option>
                        <option value="full time">Full Time</option>
                        <option value="internship_cum_full_time">Internship cum Full Time</option>
                      </Select>
                    </FormControl>
                    
                    {(newOffer.job_type === 'internship' || newOffer.job_type === 'internship_cum_full_time') && (
                      <HStack width="100%" spacing={4}>
                        <FormControl>
                          <FormLabel>Internship Duration (months)</FormLabel>
                          <Input name="internship_duration" value={newOffer.internship_duration} onChange={handleInputChange} />
                        </FormControl>
                        <FormControl>
                          <FormLabel>Internship Stipend</FormLabel>
                          <Input name="internship_stipend" value={newOffer.internship_stipend} onChange={handleInputChange} />
                        </FormControl>
                      </HStack>
                    )}

                    {(newOffer.job_type === 'full time' || newOffer.job_type === 'internship_cum_full_time') && (
                      <>
                        <HStack width="100%" spacing={4}>
                          <FormControl>
                            <FormLabel>CTC Min (LPA)</FormLabel>
                            <Input name="ctc_min" value={newOffer.ctc_min} onChange={handleInputChange} />
                          </FormControl>
                          <FormControl>
                            <FormLabel>CTC Max (LPA)</FormLabel>
                            <Input name="ctc_max" value={newOffer.ctc_max} onChange={handleInputChange} />
                          </FormControl>
                        </HStack>

                        <FormControl>
                          <FormLabel>CTC Variable Pay</FormLabel>
                          <Input name="variable_pay" value={newOffer.variable_pay} onChange={handleInputChange} />
                        </FormControl>
                      </>
                    )}
                    <FormControl>
                      <FormLabel>Offer Letter Status</FormLabel>
                      <Input name="offer_letter_status" value={newOffer.offer_letter_status} onChange={handleInputChange} placeholder="e.g. Pending, Issued, Accepted" />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Final Interview Status</FormLabel>
                      <Input name="final_interview_status" value={newOffer.final_interview_status} onChange={handleInputChange} />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Remarks</FormLabel>
                      <Textarea name="remarks" value={newOffer.remarks} onChange={handleInputChange} />
                    </FormControl>
                  </VStack>
                )}
              </ModalBody>

              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={onClose} isDisabled={saving}>
                  Cancel
                </Button>
                <Button
                  colorScheme="green"
                  bg="#22c35e"
                  onClick={handleAddOffer}
                  isLoading={saving}
                  loadingText="Saving..."
                >
                  Save
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          {/* Edit Job Offer Modal */}
          <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingOffer(null); }} size="xl" closeOnOverlayClick={!editSaving}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Edit Job Offer</ModalHeader>
              <ModalCloseButton isDisabled={editSaving} />
              <ModalBody>
                {editingOffer && (
                  <VStack spacing={4} align="stretch">
                    {/* Student Info (read-only) */}
                    <Box bg="gray.50" p={3} borderRadius="md">
                      <HStack spacing={4}>
                        <Text fontSize="sm"><strong>Student:</strong> {editingOffer.student_name}</Text>
                        <Badge colorScheme="purple">{editingOffer.usn}</Badge>
                        <Text fontSize="sm" color="gray.600">{editingOffer.school}</Text>
                      </HStack>
                    </Box>

                    <FormControl>
                      <FormLabel>Company</FormLabel>
                      <Select
                        name="company_name"
                        placeholder="Select company"
                        value={editForm.company_name}
                        onChange={handleEditInputChange}
                      >
                        {allCompanies.map((company) => (
                          <option key={company.id} value={company.company_name}>
                            {company.company_name}
                          </option>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Designation</FormLabel>
                      <Input name="designation" value={editForm.designation} onChange={handleEditInputChange} />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Job Type</FormLabel>
                      <Select name="job_type" placeholder="Select Job Type" value={editForm.job_type} onChange={handleEditInputChange}>
                        <option value="internship">Internship</option>
                        <option value="full time">Full Time</option>
                        <option value="internship_cum_full_time">Internship cum Full Time</option>
                        <option value="capstone">Capstone</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Offer Letter Status</FormLabel>
                      <Select name="offer_letter_status" placeholder="Select status" value={editForm.offer_letter_status} onChange={handleEditInputChange}>
                        <option value="Pending">Pending</option>
                        <option value="Yet to Receive">Yet to Receive</option>
                        <option value="Issued">Issued</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Rejected</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel>Academic Year</FormLabel>
                      <Input name="academic_year" value={editForm.academic_year} onChange={handleEditInputChange} placeholder="e.g. 2024-25" />
                    </FormControl>

                    {/* Placement-specific fields */}
                    {editingOffer.source === 'placement' && (
                      <>
                        <Divider />
                        <Text fontWeight="bold" color="gray.600">Placement Details</Text>
                        <HStack width="100%" spacing={4}>
                          <FormControl>
                            <FormLabel>CTC Min (LPA)</FormLabel>
                            <Input name="ctc_min_lpa" type="number" value={editForm.ctc_min_lpa} onChange={handleEditInputChange} />
                          </FormControl>
                          <FormControl>
                            <FormLabel>CTC Max (LPA)</FormLabel>
                            <Input name="ctc_max_lpa" type="number" value={editForm.ctc_max_lpa} onChange={handleEditInputChange} />
                          </FormControl>
                        </HStack>
                        <HStack width="100%" spacing={4}>
                          <FormControl>
                            <FormLabel>Variable Pay</FormLabel>
                            <Input name="ctc_variable_pay" type="number" value={editForm.ctc_variable_pay} onChange={handleEditInputChange} />
                          </FormControl>
                          <FormControl>
                            <FormLabel>Stock (LPA)</FormLabel>
                            <Input name="ctc_stock_in_lpa" type="number" value={editForm.ctc_stock_in_lpa} onChange={handleEditInputChange} />
                          </FormControl>
                        </HStack>
                        <FormControl>
                          <FormLabel>Type of Hiring</FormLabel>
                          <Select name="type_of_hiring" placeholder="Select type" value={editForm.type_of_hiring} onChange={handleEditInputChange}>
                            <option value="local">Local</option>
                            <option value="global">Global</option>
                          </Select>
                        </FormControl>
                        <FormControl>
                          <FormLabel>Job Description</FormLabel>
                          <Textarea name="job_description" value={editForm.job_description} onChange={handleEditInputChange} />
                        </FormControl>
                      </>
                    )}

                    {/* Capstone-specific fields */}
                    {editingOffer.source === 'capstone' && (
                      <>
                        <Divider />
                        <Text fontWeight="bold" color="gray.600">Capstone Details</Text>
                        <FormControl>
                          <FormLabel>Internship Duration (Months)</FormLabel>
                          <Input name="internship_duration_months" type="number" value={editForm.internship_duration_months} onChange={handleEditInputChange} />
                        </FormControl>
                        <HStack width="100%" spacing={4}>
                          <FormControl>
                            <FormLabel>Stipend Min</FormLabel>
                            <Input name="internship_stipend_min" type="number" value={editForm.internship_stipend_min} onChange={handleEditInputChange} />
                          </FormControl>
                          <FormControl>
                            <FormLabel>Stipend Max</FormLabel>
                            <Input name="internship_stipend_max" type="number" value={editForm.internship_stipend_max} onChange={handleEditInputChange} />
                          </FormControl>
                        </HStack>
                        <FormControl>
                          <FormLabel>Description</FormLabel>
                          <Textarea name="description" value={editForm.job_description} onChange={(e) => setEditForm(prev => ({ ...prev, job_description: e.target.value }))} />
                        </FormControl>
                      </>
                    )}

                    <FormControl>
                      <FormLabel>Remarks</FormLabel>
                      <Textarea name="remarks" value={editForm.remarks} onChange={handleEditInputChange} />
                    </FormControl>
                  </VStack>
                )}
              </ModalBody>

              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={() => { setIsEditModalOpen(false); setEditingOffer(null); }} isDisabled={editSaving}>
                  Cancel
                </Button>
                <Button
                  colorScheme="blue"
                  onClick={handleSaveEdit}
                  isLoading={editSaving}
                  loadingText="Saving..."
                >
                  Save Changes
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

        </Container>
      </Box>
    </AdminLayout>
  );
};

export default JobOffers;
