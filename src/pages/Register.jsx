
import { useState, useEffect } from "react"
import { 
  Box, Container, VStack, Heading, Input, Button, Text, 
  Flex, SimpleGrid, Textarea, Tabs, TabList, TabPanels, Tab, TabPanel, Badge, HStack,
  InputGroup, InputRightElement, IconButton, RadioGroup, Radio
} from "@chakra-ui/react"
import { Link as RouterLink, useNavigate } from "react-router-dom"
import { 
  FaArrowLeft, FaArrowRight, FaCheck, 
  FaUserGraduate, FaUserTie, FaEye, FaEyeSlash
} from "react-icons/fa"
import { Field } from "../components/ui/field"
import { RoleCard } from "../components/RoleCard"
import "./RegisterRoleSelect.css"
import "./RegisterForm.css"
import PixelCard from "../components/PixelCard"
import { useAuth } from "../context/AuthContext"
import { apiFetch } from "../services/api"

// Helper Icon component wrapper
const Icon = ({ as, ...props }) => <Box as={as} {...props} />

// Normalize phone input to digits only and limit to 10 characters
function normalizePhoneInput(v) {
  if (v === null || v === undefined) return ''
  const digits = String(v).replace(/\D/g, '')
  return digits.slice(0, 10)
}

// Allow only numeric keys, navigation, and common shortcuts during keydown
function isAllowedNumericKey(e) {
  const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End']
  if (allowed.includes(e.key)) return true
  if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase())) return true
  if (/^[0-9]$/.test(e.key)) return true
  return false
}

// Paste handler to extract digits and limit to 10; setter should accept the sanitized string
function handlePasteDigits(e, setter) {
  try {
    const text = (e.clipboardData || window.clipboardData).getData('text') || ''
    const digits = String(text).replace(/\D/g, '').slice(0, 10)
    if (typeof setter === 'function') setter(digits)
  } catch (err) {
    // ignore
  }
  e.preventDefault()
}

const StudentRegister = () => {
  const { user, setSession } = useAuth()
  const navigate = useNavigate()
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)
  
  useEffect(() => {
    if (user) {
      if (user.role === 'student' || user.role_name === 'student') navigate('/student-dashboard')
      else navigate('/admin/dashboard') // Fallback for other roles
    }
  }, [user, navigate])

  const initialSaved = (() => {
    try {
      const raw = sessionStorage.getItem('studentRegisterState');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();
  const [step, setStep] = useState(initialSaved?.step ?? 1)
  const [isCompleted, setIsCompleted] = useState(false)
  const [dbStudent, setDbStudent] = useState(initialSaved?.dbStudent ?? null)
  const [dbParents, setDbParents] = useState(initialSaved?.dbParents ?? [])
  const [formData, setFormData] = useState({
    // Step 1: USN & Name
    usn: "",
    name: "", // Auto-filled
    
    // Step 2: Academic Details
    school: "",
    program: "",
    major: "",
    minor: "",
    specialization: "",
    
    // Step 3: Personal Details
    dob: "",
    gender: "",
    email: "",
    rvuEmail: "",
    contact: "",
    
    // Step 4: Parent Details
    fatherName: "",
    fatherContact: "",
    fatherOccupation: "",
    motherName: "",
    motherContact: "",
    motherOccupation: "",
    guardianName: "",
    guardianContact: "",
    guardianOccupation: "",
    fatherEmail: "",
    motherEmail: "",
    guardianEmail: "",
    
    // Step 5: Password
    password: "",
    confirmPassword: ""
  })
  useEffect(() => {
    if (initialSaved?.formData) {
      setFormData(prev => ({ ...prev, ...initialSaved.formData }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  const [error, setError] = useState("")
  const [isUsnVerified, setIsUsnVerified] = useState(initialSaved?.isUsnVerified ?? false)
  const [otpSent, setOtpSent] = useState(initialSaved?.otpSent ?? false)
  const [otp, setOtp] = useState("")
  const [maskedEmail, setMaskedEmail] = useState(initialSaved?.maskedEmail ?? "")
  const [loading, setLoading] = useState(false)
  const [personalOtpSent, setPersonalOtpSent] = useState(initialSaved?.personalOtpSent ?? false)
  const [personalOtp, setPersonalOtp] = useState("")
  const [isPersonalVerified, setIsPersonalVerified] = useState(initialSaved?.isPersonalVerified ?? false)
  const [dobError, setDobError] = useState("")
  const [selectedParentRole, setSelectedParentRole] = useState(initialSaved?.selectedParentRole ?? "")
  const [savedParents, setSavedParents] = useState(initialSaved?.savedParents ?? [])
  const [personalEmailError, setPersonalEmailError] = useState("")
  const [parentName, setParentName] = useState("")
  const [parentContact, setParentContact] = useState("")
  const [parentOccupation, setParentOccupation] = useState("")
  const [parentEmail, setParentEmail] = useState("")
  const [parentTab, setParentTab] = useState(0)
  const [otpLoading, setOtpLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [personalResendTimer, setPersonalResendTimer] = useState(0)
  const isValidGmail = (e) => {
    if (typeof e !== 'string') return false
    const v = e.trim().toLowerCase()
    return /^[a-z0-9._%+-]+@gmail\.com$/.test(v)
  }
  useEffect(() => {
    const r = ['Father','Mother','Guardian'][parentTab]
    setSelectedParentRole(r)
    if (r === 'Father') {
      setParentName(formData.fatherName || "")
      setParentContact(formData.fatherContact || "")
      setParentOccupation(formData.fatherOccupation || "")
      setParentEmail(formData.fatherEmail || "")
    } else if (r === 'Mother') {
      setParentName(formData.motherName || "")
      setParentContact(formData.motherContact || "")
      setParentOccupation(formData.motherOccupation || "")
      setParentEmail(formData.motherEmail || "")
    } else {
      setParentName(formData.guardianName || "")
      setParentContact(formData.guardianContact || "")
      setParentOccupation(formData.guardianOccupation || "")
      setParentEmail(formData.guardianEmail || "")
    }
  }, [parentTab])

  const handleChange = (e) => {
    const { name, value } = e.target
    const isRvuEmail = typeof value === 'string' && value.toLowerCase().endsWith('@rvu.edu.in')
    const isGmail = typeof value === 'string' && value.toLowerCase().endsWith('@gmail.com')
    if (name === 'dob') {
      const d = new Date(value)
      if (isNaN(d.getTime())) {
        setDobError("Enter a valid date")
      } else {
        const now = new Date()
        let age = now.getFullYear() - d.getFullYear()
        const m = now.getMonth() - d.getMonth()
        if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
        if (age < 13) setDobError("Invalid DOB")
        else setDobError("")
      }
    }
    if (name === 'email') {
      setPersonalEmailError("")
      if (isRvuEmail) {
        setFormData({ ...formData, email: '', rvuEmail: value })
        setError("Entered email is RVU domain; moved to RVU Email")
        return
      }
      if (value && !isGmail) {
        setError("Only Gmail addresses are allowed")
      }
    }
    if (name === 'rvuEmail' && value && !isRvuEmail) {
      setFormData({ ...formData, rvuEmail: '', email: value })
      setError("Entered email is not RVU domain; moved to Personal Email")
      return
    }
    setFormData({ ...formData, [name]: value })
    setError("")
    if (name === "usn") {
        setIsUsnVerified(false)
        setOtpSent(false)
    }
  }

  // (normalizePhoneInput moved to module level)

  const handleVerifyUsn = async () => {
    if (!formData.usn) {
      setError("Please enter a USN");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const response = await apiFetch('/auth/verify-usn', {
        method: 'POST',
        body: JSON.stringify({ usn: formData.usn.toUpperCase() }),
        skipRefresh: true
      });

      const data = await response.json();

      if (response.ok) {
        if (data.isRegistered) {
           setError("Student already registered. Please login.");
           setIsUsnVerified(false);
        } else {
           const student = (data && typeof data.student === 'object' && data.student) ? data.student : null
           const collegeEmail = data.email || student?.college_email || ""
           const personalEmail = data.personalEmail || student?.personal_email || ""
           const phoneNumber = data.phone || student?.phone_number || ""
           const genderRaw = data.gender || student?.gender || ""
           const dobRaw = data.dob || student?.date_of_birth || ""
           const dobNormalized = typeof dobRaw === 'string' ? dobRaw.slice(0, 10) : ""

           const isRvu = collegeEmail && String(collegeEmail).toLowerCase().endsWith('@rvu.edu.in')

           const nextParents = Array.isArray(data.parents) ? data.parents : []
           const byType = (t) =>
             nextParents.find(p => String(p?.type || p?.parent_type || '').toLowerCase() === String(t).toLowerCase()) || null
           const father = byType('Father')
           const mother = byType('Mother')
           const guardian = byType('Guardian')
           const nextSavedParents = []
           if (father?.name || father?.phone || father?.phone_number) nextSavedParents.push('Father')
           if (mother?.name || mother?.phone || mother?.phone_number) nextSavedParents.push('Mother')
           if (guardian?.name || guardian?.phone || guardian?.phone_number) nextSavedParents.push('Guardian')

           setFormData((prev) => ({
             ...prev,
             name: student?.name || student?.full_name || prev.name || "",
             email: personalEmail || "",
             rvuEmail: collegeEmail || prev.rvuEmail || "",
             school: student?.school || student?.school_name || prev.school || "",
             program: student?.program || student?.program_name || prev.program || "",
             yearOfJoining: student?.year_of_joining || prev.yearOfJoining || "",
             currentYear: student?.current_year || prev.currentYear || "",
             currentSemester: student?.current_semester || prev.currentSemester || "",
            contact: phoneNumber ? String(phoneNumber).replace(/\D/g, '').slice(-10) : prev.contact || "",
             dob: dobNormalized || prev.dob || "",
             gender: genderRaw || prev.gender || "",
            fatherName: father?.name || prev.fatherName || "",
            fatherContact: normalizePhoneInput((father?.phone || father?.phone_number) || prev.fatherContact || ""),
            fatherOccupation: father?.occupation || prev.fatherOccupation || "",
            fatherEmail: father?.email || prev.fatherEmail || "",
            motherName: mother?.name || prev.motherName || "",
            motherContact: normalizePhoneInput((mother?.phone || mother?.phone_number) || prev.motherContact || ""),
            motherOccupation: mother?.occupation || prev.motherOccupation || "",
            motherEmail: mother?.email || prev.motherEmail || "",
            guardianName: guardian?.name || prev.guardianName || "",
            guardianContact: normalizePhoneInput((guardian?.phone || guardian?.phone_number) || prev.guardianContact || ""),
            guardianOccupation: guardian?.occupation || prev.guardianOccupation || "",
            guardianEmail: guardian?.email || prev.guardianEmail || ""
           }));
           setDbStudent(student)
           setDbParents(nextParents)

           if (nextSavedParents.length) {
             setSavedParents(nextSavedParents)
             const order = ['Father', 'Mother', 'Guardian']
             const nextIdx = order.findIndex(x => !nextSavedParents.includes(x))
             if (nextIdx !== -1) setParentTab(nextIdx)
           }
           
           // Mask email for display
           if (collegeEmail) {
               const [local, domain] = String(collegeEmail).split('@');
               const masked = `${local[0]}***${local[local.length-1]}@${domain}`;
               setMaskedEmail(masked);
           } else {
               setMaskedEmail("Email not found");
           }
           
           setIsUsnVerified(true);
        }
      } else {
        setError(data.error || "USN not found in database. Please contact administration.");
        setIsUsnVerified(false);
      }
    } catch (e) {
      setError("Connection error. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    try {
      const toSave = {
        step,
        dbStudent,
        dbParents,
        formData,
        isUsnVerified,
        otpSent,
        maskedEmail,
        personalOtpSent,
        isPersonalVerified,
        selectedParentRole,
        savedParents,
        parentTab
      };
      sessionStorage.setItem('studentRegisterState', JSON.stringify(toSave));
    } catch (e) {
      void e
    }
  }, [step, formData, isUsnVerified, otpSent, maskedEmail, personalOtpSent, isPersonalVerified, selectedParentRole, savedParents, parentTab]);

  const handleSendOtp = async () => {
    if (!formData.usn) { setError("USN required"); return; }
    setOtpLoading(true)
    try {
      const res = await apiFetch('/auth/register/send-otp', {
        method: 'POST',
        body: JSON.stringify({ usn: formData.usn }),
        skipRefresh: true
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      setError("")
      setOtpSent(true)
      setResendTimer(30)
    } catch (e) {
      setError(e.message)
    } finally {
      setOtpLoading(false)
    }
  }

  const verifyOtpAndContinue = async () => {
    if (!otp) { setError("Enter OTP"); return; }
    setLoading(true)
    try {
      const res = await apiFetch('/auth/register/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ usn: String(formData.usn).toUpperCase(), otp }),
        skipRefresh: true
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");
      
      setError("")
      setStep(2)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!otpSent || resendTimer <= 0) return
    const t = setInterval(() => {
      setResendTimer((s) => s > 0 ? s - 1 : 0)
    }, 1000)
    return () => clearInterval(t)
  }, [otpSent, resendTimer])

  // Handle Enter key for Send OTP
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && isUsnVerified && !otpSent && !otpLoading && step === 1) {
        e.preventDefault();
        handleSendOtp();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isUsnVerified, otpSent, otpLoading, step]);

  // Academic details confirmation step (new step 2)
  const [detailsConfirmed, setDetailsConfirmed] = useState(initialSaved?.detailsConfirmed ?? false)

  const renderStep2 = () => (
    <VStack gap={6} align="stretch">
      <Heading size="md" className="register-form__step-heading">Step 2: Confirm Academic Details</Heading>
      <Text className="register-form__step-lead">
        Please confirm that the following details fetched from the university records are correct. 
        If anything looks wrong, do not proceed and contact the administration.
      </Text>

      <Box className="register-form__record-box" p={4} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200">
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <Box>
            <Text fontSize="xs" color="gray.500">USN</Text>
            <Text fontWeight="medium" color="gray.700">{String(formData.usn || "").toUpperCase()}</Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.500">Name</Text>
            <Text fontWeight="medium" color="gray.700">{formData.name || "—"}</Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.500">School</Text>
            <Text fontWeight="medium" color="gray.700">{formData.school || "—"}</Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.500">Program</Text>
            <Text fontWeight="medium" color="gray.700">{formData.program || "—"}</Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.500">Year of Joining</Text>
            <Text fontWeight="medium" color="gray.700">{formData.yearOfJoining || "—"}</Text>
          </Box>
          <Box>
            <Text fontSize="xs" color="gray.500">Current Year / Semester</Text>
            <Text fontWeight="medium" color="gray.700">
              {formData.currentYear ? `Year ${formData.currentYear}` : "—"}{formData.currentSemester ? `, Sem ${formData.currentSemester}` : ""}
            </Text>
          </Box>
        </SimpleGrid>
      </Box>

      <VStack align="stretch" gap={2}>
        <HStack align="flex-start" spacing={3}>
          <Box
            as="input"
            type="checkbox"
            mt={1}
            checked={detailsConfirmed}
            onChange={(e) => setDetailsConfirmed(e.target.checked)}
          />
          <Text fontSize="sm" color="gray.700">
            I confirm that the above academic details are correct and belong to me.
          </Text>
        </HStack>
        {!detailsConfirmed && (
          <Text fontSize="sm" color="red.600" cursor="not-allowed">
            Contact admin if these details are incorrect.
          </Text>
        )}
      </VStack>

      <Flex gap={4} mt={4}>
        <Button
          variant="outline"
          onClick={handleBack}
          borderColor="#20343c"
          color="#20343c"
          _hover={{ bg: "gray.50" }}
        >
          Back
        </Button>
        <Button
          bg="#20343c"
          color="white"
          flex={1}
          _hover={{ bg: "#1a2b32" }}
          onClick={() => {
            if (!detailsConfirmed) return
            setStep(3)
          }}
          isDisabled={!detailsConfirmed}
        >
          Proceed <Icon as={FaArrowRight} ml={2} />
        </Button>
      </Flex>
    </VStack>
  )

  const handleNext = () => {
    if (step === 3) {
      if (!formData.email || !isPersonalVerified) {
        setError("Please verify your Personal Email to proceed")
        return
      }
      if (!formData.dob || dobError) {
        setError("Invalid DOB")
        return
      }
    }
    if (step === 4) {
      const hasFather = formData.fatherName && formData.fatherContact
      const hasMother = formData.motherName && formData.motherContact
      const hasGuardian = formData.guardianName && formData.guardianContact
      if (!(hasFather || hasMother || hasGuardian)) {
        setError("Add at least one parent/guardian")
        return
      }
    }
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(Math.max(1, step - 1))
  }

  const handleSendPersonalOtp = async () => {
    if (!formData.email || !isValidGmail(formData.email)) { setPersonalEmailError("Invalid Gmail address"); return; }
    if (formData.email === formData.rvuEmail) { setPersonalEmailError("Personal email cannot be the same as College email"); return; }
    if (personalOtpSent && personalResendTimer > 0) return
    setOtpLoading(true)
    try {
        const res = await apiFetch('/auth/register/send-personal-otp', {
            method: 'POST',
            body: JSON.stringify({ email: formData.email }),
            skipRefresh: true
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to send OTP");
        
        setPersonalOtpSent(true)
        setPersonalResendTimer(30)
        // alert(`OTP sent to ${formData.email}`) // Optional: remove alert or keep for UX
    } catch (e) {
        setPersonalEmailError(e.message)
    } finally {
        setOtpLoading(false)
    }
  }

  const handleVerifyPersonalOtp = async () => {
      if (!personalOtp) { setPersonalEmailError("Enter OTP"); return; }
      setOtpLoading(true)
      try {
          const res = await apiFetch('/auth/register/verify-personal-otp', {
              method: 'POST',
              body: JSON.stringify({ email: formData.email, otp: personalOtp }),
              skipRefresh: true
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Invalid OTP");
          
          setIsPersonalVerified(true)
          setPersonalEmailError("")
      } catch (e) {
          setPersonalEmailError(e.message)
      } finally {
          setOtpLoading(false)
      }
  }

  useEffect(() => {
    if (!personalOtpSent || personalResendTimer <= 0) return
    const t = setInterval(() => {
      setPersonalResendTimer((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => clearInterval(t)
  }, [personalOtpSent, personalResendTimer])

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }
    
    const payload = {
      usn: String(formData.usn || '').toUpperCase(),
      rvuEmail: formData.rvuEmail || null,
      password: formData.password || null,
      personalEmail: formData.email,
      phone: formData.contact,
      dob: formData.dob,
      gender: formData.gender,
      parents: (() => {
        const out = []
        if (savedParents.includes('Father')) {
          out.push({
            type: 'Father',
            name: formData.fatherName || '',
            occupation: formData.fatherOccupation || null,
            organization: '',
            email: formData.fatherEmail || null,
            phone: formData.fatherContact || null
          })
        }
        if (savedParents.includes('Mother')) {
          out.push({
            type: 'Mother',
            name: formData.motherName || '',
            occupation: formData.motherOccupation || null,
            organization: '',
            email: formData.motherEmail || null,
            phone: formData.motherContact || null
          })
        }
        if (savedParents.includes('Guardian')) {
          out.push({
            type: 'Guardian',
            name: formData.guardianName || '',
            occupation: formData.guardianOccupation || null,
            organization: '',
            email: formData.guardianEmail || null,
            phone: formData.guardianContact || null
          })
        }
        return out.filter(p => String(p.type || '').trim() && String(p.name || '').trim())
      })()
    }

    try {
      const res = await apiFetch('/auth/register-student', {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify(payload),
        skipRefresh: true
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Registration failed")
        return
      }
      
      setError("")
      setIsCompleted(true)
      try {
        sessionStorage.removeItem('studentRegisterState');
        sessionStorage.removeItem('registerRole');
      } catch (e) {
        void e
      }
      
      if (data.ok && data.access) {
        setSession(data.access, data.user || null)
        navigate('/student-dashboard', { replace: true })
      }
    } catch (e) {
      void e
      // Surface specific backend error (e.g. college email not RVU) to the user
      setError(e?.message || "Connection error. Please try again.")
    }
  }

  const inputStyle = {
    color: "gray.700",
    bg: "white",
    borderColor: "gray.300",
    _focus: { borderColor: "#d4a960", boxShadow: "0 0 0 1px #d4a960", color: "gray.700", bg: "white" },
    _placeholder: { color: "gray.500" },
    _hover: { borderColor: "gray.400" },
    _autofill: { boxShadow: "0 0 0px 1000px white inset", textFillColor: "#2d3748" }
  }

  const renderStep1 = () => (
    <VStack gap={6} align="stretch">
      <Heading size="md" className="register-form__step-heading">Step 1: Student Verification</Heading>
      <Text className="register-form__step-lead">Please enter your University Serial Number (USN) to verify your identity.</Text>
      
      <Field label="USN" errorText={!isUsnVerified ? error : null}>
        <Input 
          name="usn" 
          placeholder="e.g., 1MS21CS001" 
          value={formData.usn} 
          onChange={handleChange}
          {...inputStyle}
          color="gray.700"
          readOnly={isUsnVerified}
          opacity={isUsnVerified ? 0.8 : 1}
        />
      </Field>

      {isUsnVerified && (
        <VStack gap={4} align="stretch" animation="fadeIn 0.5s">
            <Box className="register-form__record-box" p={4} bg="gray.50" borderRadius="md" borderWidth="1px" borderColor="gray.200">
                <Text fontWeight="bold" color="#20343c">Student Record Located</Text>
                <SimpleGrid columns={1} gap={4} mt={2}>
                  <Box>
                    <Text fontSize="xs" color="gray.500">Registered College Email</Text>
                    <Text fontWeight="medium" color="gray.700">{maskedEmail}</Text>
                  </Box>
                </SimpleGrid>
            </Box>

            {error && !otpSent && (
                <Text fontSize="sm" color="red.600" bg="red.50" p={2} borderRadius="md" border="1px solid" borderColor="red.200">
                    {error}
                </Text>
            )}

            {!otpSent ? (
              <PixelCard 
                variant="yellow" 
                onClick={otpLoading ? null : handleSendOtp}
                style={{ 
                  backgroundColor: "#20343c", 
                  color: "white", 
                  width: "100%", 
                  height: "48px", 
                  borderRadius: "0.375rem",
                  fontWeight: "600",
                  fontSize: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: otpLoading ? "not-allowed" : "pointer",
                  opacity: otpLoading ? 0.7 : 1
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !otpLoading) {
                    handleSendOtp();
                  }
                }}
              >
                {otpLoading ? "Sending..." : <>Send OTP <Icon as={FaArrowRight} ml={2} /></>}
              </PixelCard>
            ) : (
                <VStack gap={4} align="stretch">
                    <Flex gap={3} align="center">
                      <Text fontSize="sm" color="green.600" bg="green.50" p={2} borderRadius="md" border="1px solid" borderColor="green.200" flex={1}>
                        <Icon as={FaCheck} display="inline" mr={2} />
                        OTP sent successfully
                      </Text>
                      <Button 
                        variant="outline" 
                        onClick={handleSendOtp} 
                        isDisabled={resendTimer > 0 || otpLoading}
                        _hover={{ bg: "gray.50" }}
                        _disabled={{ bg: "gray.100", color: "gray.400", cursor: "not-allowed" }}
                        borderColor="#20343c" 
                        color="#20343c"
                      >
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                      </Button>
                    </Flex>
                    
                    <Field label="Enter OTP" errorText={error}>
                        <Input 
                            placeholder="Enter 6-digit OTP" 
                            value={otp} 
                            onChange={(e) => setOtp(e.target.value)}
                            {...inputStyle}
                            color="gray.700"
                            maxLength={6}
                            textAlign="center"
                            letterSpacing="widest"
                            fontWeight="bold"
                        />
                    </Field>

                    <Button bg="#20343c" color="white" width="full" _hover={{ bg: "#1a2b32" }} onClick={verifyOtpAndContinue}>
                        Verify & Continue <Icon as={FaArrowRight} ml={2} />
                    </Button>
                </VStack>
            )}

             <Button variant="link" size="sm" color="gray.500" onClick={() => { setIsUsnVerified(false); setOtpSent(false); setOtp(""); setError(""); }}>
                Not you? Change USN
            </Button>
        </VStack>
      )}

      {!isUsnVerified && (
        <Button 
            bg="#20343c" 
            color="white" 
            width="full" 
            _hover={{ bg: "#1a2b32" }} 
            onClick={handleVerifyUsn}
            isLoading={loading}
            loadingText="Verifying..."
        >
            Get Details <Icon as={FaArrowRight} ml={2} />
        </Button>
      )}
    </VStack>
  )

  // Academic details step removed

  const renderStep3 = () => (
    <VStack gap={4} align="stretch">
      <Heading size="md" className="register-form__step-heading">Step 3: Personal Details</Heading>
      
      <Flex gap={4}>
        <Field label="Date of Birth" errorText={dobError || null}>
          <Input type="date" name="dob" value={formData.dob} onChange={handleChange} {...inputStyle} color="gray.700" />
        </Field>
        <Field label="Gender">
          <Box 
            as="select" 
            name="gender" 
            value={formData.gender} 
            onChange={handleChange} 
            {...inputStyle} 
            color="gray.700"
            h={10}
            w="full"
            borderRadius="md"
            px={3}
            border="1px solid"
            borderColor="gray.300"
          >
            <option value="">Select</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="Other">Other</option>
          </Box>
        </Field>
      </Flex>
      
      <Field label="Personal Email ID" errorText={personalEmailError || (error && error.toLowerCase().includes('email') ? error : null)}>
        <Input 
          type="email" 
          name="email" 
          placeholder="e.g. john.doe@gmail.com" 
          value={formData.email} 
          onChange={handleChange} 
          {...inputStyle} 
          color="gray.700" 
        />
      </Field>
      
      {!isPersonalVerified && formData.email && isValidGmail(formData.email) ? (
        <VStack gap={3} align="stretch">
          <Text fontSize="sm" color="gray.600">
            We will send a 6-digit code to {formData.email}
          </Text>
          {!personalOtpSent ? (
            <Button 
              bg="#20343c" 
              color="white" 
              width="full" 
              borderRadius="md"
              _hover={{ bg: "#1a2b32" }} 
              onClick={handleSendPersonalOtp}
              isLoading={otpLoading}
            >
              Send OTP to Personal Email
            </Button>
          ) : (
            <VStack gap={3} align="stretch">
              <Button
                variant="outline"
                onClick={handleSendPersonalOtp}
                isDisabled={personalResendTimer > 0 || otpLoading}
                _hover={{ bg: "gray.50" }}
                _disabled={{ bg: "gray.100", color: "gray.400", cursor: "not-allowed" }}
                borderColor="#20343c"
                color="#20343c"
              >
                {personalResendTimer > 0 ? `Resend in ${personalResendTimer}s` : "Resend OTP"}
              </Button>
              <Field label="Enter OTP" errorText={error}>
                <Input 
                  placeholder="Enter 6-digit OTP" 
                  value={personalOtp} 
                  onChange={(e) => setPersonalOtp(e.target.value)}
                  {...inputStyle}
                  color="gray.700"
                  maxLength={6}
                  textAlign="center"
                  letterSpacing="widest"
                  fontWeight="bold"
                />
              </Field>
              <Button 
                bg="#20343c" 
                color="white" 
                width="full" 
                borderRadius="md"
                _hover={{ bg: "#1a2b32" }} 
                onClick={handleVerifyPersonalOtp}
                isLoading={otpLoading}
              >
                Verify Personal Email <Icon as={FaArrowRight} ml={2} />
              </Button>
            </VStack>
          )}
        </VStack>
      ) : isPersonalVerified ? (
        <Text fontSize="sm" color="green.600" bg="green.50" p={2} borderRadius="md" border="1px solid" borderColor="green.200">
          <Icon as={FaCheck} display="inline" mr={2} />
          Personal Email verified
        </Text>
      ) : null}
      
      <Field label="Contact Number">
        <Input
          type="tel"
          name="contact"
          placeholder="e.g. 9876543210"
          value={formData.contact}
          onChange={(e) => setFormData({ ...formData, contact: normalizePhoneInput(e.target.value) })}
          inputMode="numeric"
          onKeyDown={(e) => {
            if (!isAllowedNumericKey(e)) {
              e.preventDefault();
              setError('Only digits allowed in contact number');
              setTimeout(() => setError(''), 2000);
            }
          }}
          onPaste={(e) => handlePasteDigits(e, (digits) => setFormData(prev => ({ ...prev, contact: digits })))}
          {...inputStyle}
          color="gray.700"
          maxLength={10}
          pattern="\d*"
        />
      </Field>

      <Flex gap={4} mt={4}>
        <Button variant="outline" onClick={handleBack} borderColor="#20343c" color="#20343c" _hover={{ bg: "gray.50" }}>Back</Button>
        <Button bg="#20343c" color="white" flex={1} _hover={{ bg: "#1a2b32" }} onClick={handleNext}>Save & Next</Button>
      </Flex>
    </VStack>
  )

  const renderStep4 = () => (
    <VStack gap={4} align="stretch">
      <Heading size="md" className="register-form__step-heading">Step 4: Family Details</Heading>
      {error && (
        <Text fontSize="sm" color="red.600" bg="red.50" p={2} borderRadius="md" border="1px solid" borderColor="red.200">
          {error}
        </Text>
      )}
      <Text fontSize="sm" color="gray.600">Add up to three contacts</Text>
      <Tabs index={parentTab} onChange={(i) => { setParentTab(i); }} isFitted variant="enclosed">
        <TabList>
          <Tab isDisabled={savedParents.length >= 3 && !savedParents.includes('Father')}>
            Father {savedParents.includes('Father') && <Badge ml={2} colorScheme="green">Added</Badge>}
          </Tab>
          <Tab isDisabled={savedParents.length >= 3 && !savedParents.includes('Mother')}>
            Mother {savedParents.includes('Mother') && <Badge ml={2} colorScheme="green">Added</Badge>}
          </Tab>
          <Tab isDisabled={savedParents.length >= 3 && !savedParents.includes('Guardian')}>
            Guardian {savedParents.includes('Guardian') && <Badge ml={2} colorScheme="green">Added</Badge>}
          </Tab>
        </TabList>
        <TabPanels>
          {['Father','Mother','Guardian'].map((role) => (
            <TabPanel key={role}>
              <Box p={4} borderWidth="1px" borderRadius="md" borderColor="gray.200" bg="gray.50">
                <Text fontWeight="bold" mb={3} color="#20343c">{role} Details</Text>
                <VStack gap={3}>
                  <Field label="Name">
                    <Input placeholder="Name" value={parentName} onChange={(e) => setParentName(e.target.value)} {...inputStyle} color="gray.700" />
                  </Field>
                  <Flex gap={3} width="full">
                    <Field label="Contact">
                        <Input
                          placeholder="Contact"
                          value={parentContact}
                          onChange={(e) => setParentContact(normalizePhoneInput(e.target.value))}
                          {...inputStyle}
                          color="gray.700"
                          maxLength={10}
                          pattern="\d*"
                          inputMode="numeric"
                          onKeyDown={(e) => {
                            if (!isAllowedNumericKey(e)) {
                              e.preventDefault();
                              setError('Only digits allowed in parent contact');
                              setTimeout(() => setError(''), 2000);
                            }
                          }}
                          onPaste={(e) => handlePasteDigits(e, setParentContact)}
                        />
                      </Field>
                    <Field label="Occupation">
                      <Input placeholder="Occupation" value={parentOccupation} onChange={(e) => setParentOccupation(e.target.value)} {...inputStyle} color="gray.700" />
                    </Field>
                  </Flex>
                  <Field label="Email">
                    <Input type="email" placeholder="e.g. parent@gmail.com" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} {...inputStyle} color="gray.700" />
                  </Field>
                  <Button 
                    bg="#20343c" 
                    color="white" 
                    width="full" 
                    _hover={{ bg: "#1a2b32" }}
                    onClick={() => {
                      const r = ['Father','Mother','Guardian'][parentTab]
                      if (!parentName || !parentContact) { setError("Please enter name and contact"); return; }
                      // Parent contact must be 10 digits
                      if (parentContact && parentContact.replace(/\D/g, '').length !== 10) { setError("Parent contact must be exactly 10 digits"); return; }
                      if (parentEmail && !parentEmail.toLowerCase().endsWith('@gmail.com')) { setError("Only Gmail addresses are allowed"); return; }
                      if (savedParents.length >= 3 && !savedParents.includes(r)) { setError("Maximum three contacts allowed"); return; }
                      if (r === 'Father') {
                        setFormData({ ...formData, fatherName: parentName, fatherContact: parentContact, fatherOccupation: parentOccupation, fatherEmail: parentEmail });
                      } else if (r === 'Mother') {
                        setFormData({ ...formData, motherName: parentName, motherContact: parentContact, motherOccupation: parentOccupation, motherEmail: parentEmail });
                      } else {
                        setFormData({ ...formData, guardianName: parentName, guardianContact: parentContact, guardianOccupation: parentOccupation, guardianEmail: parentEmail });
                      }
                      if (!savedParents.includes(r)) {
                        const nextSaved = [...savedParents, r]
                        setSavedParents(nextSaved)
                        const order = ['Father','Mother','Guardian']
                        const nextIdx = order.findIndex(x => !nextSaved.includes(x))
                        if (nextIdx !== -1) setParentTab(nextIdx)
                      }
                      setError("");
                    }}
                  >
                    Save {role} Details
                  </Button>
                </VStack>
              </Box>
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>

      {savedParents.length > 0 && (
        <Box p={3} borderWidth="1px" borderRadius="md" borderColor="green.200" bg="green.50">
          <Text fontSize="sm" color="green.700">
            {savedParents.map((r) => `${r} details added`).join(' • ')}
          </Text>
        </Box>
      )}

      <Flex gap={4} mt={4}>
        <Button variant="outline" onClick={handleBack} borderColor="#20343c" color="#20343c" _hover={{ bg: "gray.50" }}>Back</Button>
        <Button bg="#20343c" color="white" flex={1} _hover={{ bg: "#1a2b32" }} onClick={handleNext}>Next</Button>
      </Flex>
    </VStack>
  )

  const renderStep5 = () => (
    <VStack gap={6} align="stretch">
      <Heading size="md" className="register-form__step-heading">Step 5: Set Password</Heading>

      {error && !error.includes("Password") && (
        <Text fontSize="sm" color="red.600" bg="red.50" p={2} borderRadius="md" border="1px solid" borderColor="red.200">
          {error}
        </Text>
      )}
      
      <Field label="Password" errorText={error && error.includes("Password") ? error : null}>
        <InputGroup>
          <Input
            type={isPasswordVisible ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleChange}
            {...inputStyle}
            color="gray.700"
            pr="3rem"
          />
          <InputRightElement>
            <IconButton
              variant="ghost"
              size="sm"
              aria-label={isPasswordVisible ? "Hide password" : "Show password"}
              icon={<Icon as={isPasswordVisible ? FaEyeSlash : FaEye} />}
              onClick={() => setIsPasswordVisible((v) => !v)}
            />
          </InputRightElement>
        </InputGroup>
      </Field>
      
      <Field label="Confirm Password" errorText={error && error.includes("Password") ? error : null}>
        <InputGroup>
          <Input
            type={isConfirmPasswordVisible ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            {...inputStyle}
            color="gray.700"
            pr="3rem"
          />
          <InputRightElement>
            <IconButton
              variant="ghost"
              size="sm"
              aria-label={isConfirmPasswordVisible ? "Hide confirm password" : "Show confirm password"}
              icon={<Icon as={isConfirmPasswordVisible ? FaEyeSlash : FaEye} />}
              onClick={() => setIsConfirmPasswordVisible((v) => !v)}
            />
          </InputRightElement>
        </InputGroup>
      </Field>

      <Flex gap={4} mt={4}>
        <Button variant="outline" onClick={handleBack} borderColor="#20343c" color="#20343c" _hover={{ bg: "gray.50" }}>Back</Button>
        <Button bg="#20343c" color="white" flex={1} _hover={{ bg: "#1a2b32" }} onClick={handleSubmit}>
          Complete Registration <Icon as={FaCheck} ml={2} />
        </Button>
      </Flex>
    </VStack>
  )

  return (
    <VStack gap={6} align="stretch">
      {/* Academic details confirmation removed */}
      <Box className="register-form__hero" mb={4}>
        <Heading className="register-form__title">Student Registration</Heading>
        {!isCompleted && (
          <Flex className="register-form__steps" justify="center" gap={2} mt={2}>
            {[1, 2, 3, 4, 5].map((i) => (
              <Box
                key={i}
                className={[
                  'register-form__step',
                  step === i ? 'register-form__step--active' : '',
                  step > i ? 'register-form__step--done' : '',
                ].filter(Boolean).join(' ')}
              />
            ))}
          </Flex>
        )}
      </Box>
      
      {isCompleted ? (
        <VStack gap={6} py={10}>
          <Box className="register-form__complete-icon">
            <Icon as={FaCheck} w={10} h={10} />
          </Box>
          <Heading size="lg" color="#20343c">Registration Complete!</Heading>
          <Text textAlign="center" color="gray.600">
            Your account has been successfully created. You can now login to access the placement portal.
          </Text>
          <Button as={RouterLink} to="/login" bg="#20343c" color="white" width="full" _hover={{ bg: "#1a2b32" }}>
            Proceed to Login
          </Button>
        </VStack>
      ) : (
        <>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </>
      )}
      
      {!isCompleted && step === 1 && (
        <Text textAlign="center" fontSize="sm" color="gray.600">
          Already have an account?{" "}
          <RouterLink to="/login" className="register-form__footer-link">
            Login here
          </RouterLink>
        </Text>
      )}
    </VStack>
  )
}

const CompanyRegister = () => {
    const [formData, setFormData] = useState({
        company_name: "",
        hr_email: "",
        company_type: "",
        website: "",
        linkedin: "",
        address: "",
        description: "",
        company_logo_link: "",
        contact_phone: "",
        contact_role: ""
    })

    const handleChange = (e) => {
      if (e.target.name === 'contact_phone') {
        const v = normalizePhoneInput(e.target.value)
        setFormData({ ...formData, contact_phone: v })
        return
      }
      setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = () => {
        console.log("Company Registration Data:", formData)
        alert("Company Registration Submitted (Check Console)")
    }

    return (
        <VStack gap={6} align="stretch" py={4}>
            <Heading size="md" color="#20343c">Company Registration</Heading>
            <Text color="gray.600">Register your company to hire top talent.</Text>
            
            <Field label="Company Name" required>
                <Input 
                    name="company_name" 
                    value={formData.company_name}
                    onChange={handleChange}
                    placeholder="Enter company name" 
                    color="gray.700" 
                    borderColor="gray.300" 
                    _focus={{ borderColor: "#d4a960", boxShadow: "0 0 0 1px #d4a960" }} 
                />
            </Field>

             <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                <Field label="Company Type">
                    <Input 
                        name="company_type" 
                        value={formData.company_type}
                        onChange={handleChange}
                        placeholder="e.g. Product, Service, Startup" 
                        color="gray.700" 
                        borderColor="gray.300" 
                        _focus={{ borderColor: "#d4a960", boxShadow: "0 0 0 1px #d4a960" }} 
                    />
                </Field>
                <Field label="HR Email" required>
                    <Input 
                        name="hr_email" 
                        value={formData.hr_email}
                        onChange={handleChange}
                        placeholder="Enter HR email" 
                        type="email" 
                        color="gray.700" 
                        borderColor="gray.300" 
                        _focus={{ borderColor: "#d4a960", boxShadow: "0 0 0 1px #d4a960" }} 
                    />
                </Field>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                <Field label="Contact Number" required>
                    <Input 
                        name="contact_phone" 
                        value={formData.contact_phone}
                    onChange={handleChange}
                    placeholder="+91 9876543210" 
                    type="tel" 
                    inputMode="numeric"
                    maxLength={15}
                    onKeyDown={(e) => { if (!isAllowedNumericKey(e)) e.preventDefault(); }}
                    onPaste={(e) => handlePasteDigits(e, (d) => setFormData(prev => ({ ...prev, contact_phone: d })))}
                        color="gray.700" 
                        borderColor="gray.300" 
                        _focus={{ borderColor: "#d4a960", boxShadow: "0 0 0 1px #d4a960" }} 
                    />
                </Field>
                <Field label="Role / Designation" required>
                    <Input 
                        name="contact_role" 
                        value={formData.contact_role}
                        onChange={handleChange}
                        placeholder="e.g. HR Manager" 
                        color="gray.700" 
                        borderColor="gray.300" 
                        _focus={{ borderColor: "#d4a960", boxShadow: "0 0 0 1px #d4a960" }} 
                    />
                </Field>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                <Field label="Website">
                    <Input 
                        name="website" 
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://company.com" 
                        type="url" 
                        color="gray.700" 
                        borderColor="gray.300" 
                        _focus={{ borderColor: "#d4a960", boxShadow: "0 0 0 1px #d4a960" }} 
                    />
                </Field>
                <Field label="LinkedIn">
                    <Input 
                        name="linkedin" 
                        value={formData.linkedin}
                        onChange={handleChange}
                        placeholder="https://linkedin.com/company/..." 
                        type="url" 
                        color="gray.700" 
                        borderColor="gray.300" 
                        _focus={{ borderColor: "#d4a960", boxShadow: "0 0 0 1px #d4a960" }} 
                    />
                </Field>
            </SimpleGrid>

            <Field label="Logo URL">
                <Input 
                    name="company_logo_link" 
                    value={formData.company_logo_link}
                    onChange={handleChange}
                    placeholder="https://company.com/logo.png" 
                    type="url" 
                    color="gray.700" 
                    borderColor="gray.300" 
                    _focus={{ borderColor: "#d4a960", boxShadow: "0 0 0 1px #d4a960" }} 
                />
            </Field>

            <Field label="Address">
                <Textarea 
                    name="address" 
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Headquarters Address" 
                    color="gray.700" 
                    borderColor="gray.300" 
                    _focus={{ borderColor: "#d4a960", boxShadow: "0 0 0 1px #d4a960" }} 
                />
            </Field>

            <Field label="Description">
                <Textarea 
                    name="description" 
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Brief description about the company..." 
                    color="gray.700" 
                    borderColor="gray.300" 
                    _focus={{ borderColor: "#d4a960", boxShadow: "0 0 0 1px #d4a960" }} 
                />
            </Field>

            <Button 
                onClick={handleSubmit}
                bg="#20343c" 
                color="white" 
                width="full" 
                _hover={{ bg: "#1a2b32" }}
            >
                Register Company
            </Button>
        </VStack>
    )
}

const VerifierRegister = () => (
     <VStack gap={6} align="stretch" py={4}>
        <Heading size="md" color="#20343c">Verifier Access</Heading>
        <Text color="gray.600">Placement Officer / Admin Access.</Text>
        <Field label="Employee ID">
            <Input placeholder="Enter Employee ID" color="gray.700" borderColor="gray.300" _focus={{ borderColor: "#d4a960", boxShadow: "0 0 0 1px #d4a960" }} />
        </Field>
         <Field label="Access Code">
            <Input type="password" placeholder="Enter Access Code" color="gray.700" borderColor="gray.300" _focus={{ borderColor: "#d4a960", boxShadow: "0 0 0 1px #d4a960" }} />
        </Field>
        <Button bg="#20343c" color="white" width="full" _hover={{ bg: "#1a2b32" }}>
            Request Access
        </Button>
    </VStack>
)

export const Register = () => {
  const [role, setRole] = useState(() => {
    try {
      return sessionStorage.getItem('registerRole') || null;
    } catch {
      return null;
    }
  })
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      switch (user.role?.toLowerCase()) {
        case 'student':
          navigate("/student-dashboard", { replace: true });
          break;
        case 'admin':
        case 'vc':
          navigate("/placement/dashboard", { replace: true });
          break;
        case 'alumni':
          navigate("/placement/alumni-dashboard", { replace: true });
          break;
        case 'company':
          navigate("/company/dashboard", { replace: true });
          break;
        default:
          break;
      }
    } else if (role === 'alumni') {
        navigate('/alumni/register');
        setRole(null);
    }
  }, [isAuthenticated, user, navigate, role]);

  useEffect(() => {
    try {
      if (role) sessionStorage.setItem('registerRole', role);
      else sessionStorage.removeItem('registerRole');
    } catch (e) {
      void e
    }
  }, [role]);

  return (
    <Box
      py={role ? 0 : 0}
      bg="transparent"
      minH="90vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      className={role ? 'register-form' : 'register-role'}
    >
      <Container
        maxW={role ? 'md' : undefined}
        className={role ? 'register-form__card' : 'register-role__card'}
        bg={role ? 'white' : 'transparent'}
        p={role ? 8 : 0}
        borderRadius={role ? 'xl' : undefined}
        shadow={role ? 'lg' : undefined}
        borderTopWidth={role ? '4px' : undefined}
        borderTopColor={role ? '#20343c' : undefined}
      >
        {!role ? (
            <div className="register-role__inner">
                <header className="register-role__header">
                    <p className="register-role__eyebrow">Carve You</p>
                    <h1 className="register-role__title">Join Our Platform</h1>
                    <p className="register-role__subtitle">Select your role to continue with registration</p>
                </header>
                <div className="register-role__grid">
                    <RoleCard
                      variant="student"
                      title="Student"
                      description="Register with your college email and USN"
                      icon={FaUserGraduate}
                      onClick={() => setRole('student')}
                    />
                    <RoleCard
                      variant="alumni"
                      title="Alumni"
                      description="Graduates joining the alumni network"
                      icon={FaUserTie}
                      onClick={() => navigate('/alumni/register')}
                    />
                </div>
                <p className="register-role__footer">
                    Already have an account?{' '}
                    <RouterLink to="/login" className="register-role__login-link">
                        Login here
                    </RouterLink>
                </p>
            </div>
        ) : (
             <VStack align="stretch" gap={4}>
                <Button
                    className="register-form__back"
                    variant="ghost"
                    justifyContent="flex-start"
                    leftIcon={<Icon as={FaArrowLeft} />}
                    onClick={() => setRole(null)}
                    color="gray.500"
                    size="sm"
                >
                    Back to Role Selection
                </Button>
                {role === 'student' && <StudentRegister />}
             </VStack>
        )}
      </Container>
    </Box>
  )
}

export default Register;
