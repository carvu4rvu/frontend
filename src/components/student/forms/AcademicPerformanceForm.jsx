import React, { useState } from "react";
import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  SimpleGrid,
  Box,
  Heading,
  IconButton,
  useColorModeValue,
  Select,
  Text,
  Flex,
  Collapse,
  useToast,
  Image,
  Link,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from "@chakra-ui/react";
import { FaPlus, FaChevronDown, FaChevronUp, FaUpload, FaFile } from "react-icons/fa";
import { getFileUrl } from "../../../utils/fileUrl";
import { useAuth } from "../../../context/AuthContext";
import { StudentProfileService } from "../../../services/studentProfile.service";

/** Get file extension from URL (handles query params like ?token=xyz) */
const getFileExtension = (url) => {
  if (!url || typeof url !== "string") return "";
  const pathname = url.split("?")[0];
  const match = pathname.match(/\.([a-z0-9]+)$/i);
  return match ? match[1].toLowerCase() : "";
};

const isImageUrl = (url) => ["jpg", "jpeg", "png", "gif", "webp"].includes(getFileExtension(url));
const isPdfUrl = (url) => getFileExtension(url) === "pdf";

const AcademicsFileInput = ({ isEditing, value, onChange, onFileSelect, index }) => {
  const toast = useToast()
  const inputId = `academics-file-upload-${index}`
  const [isUploading, setIsUploading] = useState(false)
  const fileUrl = value ? (typeof value === "string" ? value : (Array.isArray(value) && value.length > 0 ? value[0] : "")) : ""
    const [imageError, setImageError] = useState(false)
    const [selectedFileName, setSelectedFileName] = useState("")

    // Reset error state and selected name when URL changes
    React.useEffect(() => {
        setImageError(false)
        if (fileUrl) setSelectedFileName("")
    }, [fileUrl])

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      // 5MB limit
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size must be less than 5MB",
          status: "error",
          duration: 3000,
          isClosable: true,
        })
        return
      }

      // Check file type
      if (!['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF or Image file",
          status: "error",
          duration: 3000,
          isClosable: true,
        })
        return
      }

      setSelectedFileName(file.name)

      if (onFileSelect) {
        setIsUploading(true)
        try {
            await onFileSelect(file)
        } catch (err) {
          toast({
            title: "Upload failed",
            description: err?.message || "Could not upload file. Please try again.",
            status: "error",
            duration: 5000,
            isClosable: true,
          })
          throw err
        } finally {
            setIsUploading(false)
        }
      }
      e.target.value = ""
    }
  }

  return (
    <Box>
        {isEditing ? (
            <VStack align="stretch" spacing={2}>
                <Flex align="center" gap={2}>
                    <Button 
                        as="label" 
                        htmlFor={inputId} 
                        cursor="pointer" 
                        size="sm" 
                        leftIcon={<FaUpload />} 
                        colorScheme="blue" 
                        variant="outline" 
                        type="button"
                        isLoading={isUploading}
                        loadingText="Uploading..."
                    >
                        {fileUrl || selectedFileName ? "Change Marksheet" : "Upload Marksheet"}
                        <input
                            id={inputId}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </Button>
                    {selectedFileName && (
                        <Text fontSize="xs" color="green.600" noOfLines={1}>
                            Selected: {selectedFileName}
                        </Text>
                    )}
                </Flex>
                
                {fileUrl && !selectedFileName && (
                    <Box mt={2}>
                        <Text fontSize="xs" color="gray.600" mb={1}>Uploaded marksheet:</Text>
                        <Flex align="center" gap={3} flexWrap="wrap">
                            <Link 
                                href={getFileUrl(fileUrl)} 
                                target="_blank"
                                rel="noopener noreferrer"
                                fontSize="sm" 
                                color="blue.500"
                                display="flex"
                                alignItems="center"
                                gap={2}
                                fontWeight="600"
                            >
                                <FaFile size="12px" />
                                 View Full Marksheet
                             </Link>
                            {isImageUrl(fileUrl) && (
                                <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={2} bg="white" maxW="200px" overflow="hidden">
                                  {!imageError ? (
                                    <Image 
                                      key={fileUrl}
                                      src={getFileUrl(fileUrl)} 
                                      alt="Marksheet preview" 
                                      maxH="120px" 
                                      objectFit="contain"
                                      fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3Ctext x='50' y='50' fill='%23999' text-anchor='middle' dy='.3em' font-size='10'%3ELoading...%3C/text%3E%3C/svg%3E"
                                      onError={() => setImageError(true)}
                                    />
                                  ) : (
                                    <Text py={4} px={2} textAlign="center" color="gray.500" fontSize="xs">
                                      Preview unavailable. Use the link above to view.
                                    </Text>
                                  )}
                                </Box>
                            )}
                            {isPdfUrl(fileUrl) && (
                                <Box mt={2} w="100%" border="1px solid" borderColor="gray.200" borderRadius="md" overflow="hidden" bg="gray.100" h="280px">
                                    <iframe
                                        title="Marksheet preview"
                                        src={getFileUrl(fileUrl)}
                                        style={{ width: "100%", height: "280px", border: "none" }}
                                    />
                                </Box>
                            )}
                        </Flex>
                    </Box>
                )}
            </VStack>
        ) : (
            fileUrl ? (
                <Box>
                  <Link 
                    href={getFileUrl(fileUrl)} 
                    target="_blank"
                    rel="noopener noreferrer"
                    fontSize="sm" 
                    color="blue.600"
                    display="flex"
                    alignItems="center"
                    gap={2}
                    fontWeight="bold"
                    mb={3}
                    _hover={{ textDecoration: "underline" }}
                  >
                    <FaFile size="14px" />
                    OPEN MARKSHEET
                  </Link>

                  {isImageUrl(fileUrl) ? (
                    <Box 
                      border="1px solid" 
                      borderColor="gray.200" 
                      borderRadius="lg" 
                      p={2}
                      bg="white"
                      shadow="sm"
                      maxW="300px"
                    >
                        {!imageError ? (
                          <Image 
                            key={fileUrl}
                            src={getFileUrl(fileUrl)} 
                            alt="Marksheet" 
                            maxH="250px" 
                            objectFit="contain"
                            mx="auto"
                            fallbackSrc="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3Ctext x='50' y='50' fill='%23999' text-anchor='middle' dy='.3em' font-size='10'%3ELoading...%3C/text%3E%3C/svg%3E"
                            onError={() => setImageError(true)}
                          />
                        ) : (
                          <Box py={8} textAlign="center" color="gray.500" fontSize="sm">
                            <Text>Preview unavailable</Text>
                            <Link href={getFileUrl(fileUrl)} isExternal color="blue.500" fontWeight="bold">Open in new tab</Link>
                          </Box>
                        )}
                    </Box>
                  ) : isPdfUrl(fileUrl) ? (
                      <Box border="1px solid" borderColor="gray.200" borderRadius="md" overflow="hidden" bg="gray.100" h="400px" w="100%">
                        <iframe
                          title="Marksheet preview"
                          src={getFileUrl(fileUrl)}
                          style={{ width: "100%", height: "400px", border: "none" }}
                        />
                      </Box>
                  ) : null}
                </Box>
            ) : (
                <Text fontSize="sm" color="gray.500" fontStyle="italic">No marksheet uploaded</Text>
            )
        )}
    </Box>
  )
}

/** Compute academic year from joining year and semester. Sem 1&2 = YOJ, Sem 3&4 = YOJ+1, etc. */
const computeAcademicYear = (yearOfJoining, semester) => {
  if (!yearOfJoining || !semester) return null;
  const yoj = Number(yearOfJoining);
  const sem = Number(semester);
  if (Number.isNaN(yoj) || Number.isNaN(sem) || sem < 1) return null;
  return yoj + Math.floor((sem - 1) / 2);
};

/** Returns minimal semester entries (1 through currentSemester-1) with auto-filled semester, academic year, and backlogs. */
export const getAutoFilledAcademics = (personalMeta) => {
  const yearOfJoining = personalMeta?.yearOfJoining ?? personalMeta?.year_of_joining;
  const currentSemester = personalMeta?.currentSemester ?? personalMeta?.current_semester;
  const current = currentSemester ? Number(currentSemester) : 0;
  const maxSem = Math.max(1, current - 1);
  if (!yearOfJoining || maxSem < 1) return [];
  const entries = [];
  for (let sem = 1; sem <= maxSem; sem++) {
    const academicYear = computeAcademicYear(yearOfJoining, sem);
    entries.push({
      semester: sem,
      academicYear: academicYear != null ? String(academicYear) : "",
      sgpa: "",
      liveBacklogs: 0,
      closedBacklogs: 0,
      resultUploadLink: []
    });
  }
  return entries;
};

/** Current semester upload allowed only in final year (sem 8) or after graduation (current year >= yearOfJoining + 4). */
const canUploadCurrentSemesterRule = (currentSemester, yearOfJoining) => {
  const sem = Number(currentSemester);
  const yoj = yearOfJoining != null && yearOfJoining !== '' ? Number(yearOfJoining) : NaN;
  const currentYear = new Date().getFullYear();
  return sem >= 8 || (Number.isFinite(yoj) && currentYear >= yoj + 4);
};

/** Saved semester with no backlogs is locked (no edit/delete). */
const isSemesterLocked = (item) => {
  const hasId = item?.id != null;
  const live = Number(item?.liveBacklogs ?? item?.live_backlogs ?? 0) || 0;
  const closed = Number(item?.closedBacklogs ?? item?.closed_backlogs ?? 0) || 0;
  return hasId && live === 0 && closed === 0;
};

const SemesterItem = ({ item, onChange, index, isOpen, onToggle, isEditing, onFileSelect, takenSemesters, maxAllowedSemester, yearOfJoining, canUploadCurrentSemester }) => {
  const locked = isSemesterLocked(item);
  const canEdit = isEditing && !locked;

  const handleChange = (field, value) => {
    // Handle number fields
    if (['academicYear', 'semester', 'sgpa', 'closedBacklogs', 'liveBacklogs'].includes(field)) {
       let updated = { ...item, [field]: value };
       // Auto-calculate academic year when semester changes and yearOfJoining is available
       if (field === 'semester' && value && yearOfJoining) {
         const computedYear = computeAcademicYear(yearOfJoining, value);
         if (computedYear != null) updated.academicYear = String(computedYear);
       }
       onChange(updated, index);
    } else if (field === 'resultUploadLink') {
        // Handle as array for backend compatibility (text[]), but single input for now
        // If the user inputs a string, we'll store it. The parent component or submit handler can wrap it.
        // Actually, let's store it as string in form state, and wrap in array before sending if needed.
        // Or if the backend expects 'provisionalResultUploadLink' as array.
        // Let's assume the backend controller handles simple mapping.
        // Wait, if I send a string to text[] column, postgres will complain.
        // I should probably store it as array in state if possible, or convert on submit.
        // But this form receives `data` and calls `onUpdate`.
        // The `GenericProfileSection` likely just sends `data` to backend.
        // So I should ensure `data` has the correct structure.
        
        // If the backend expects an array, I should set it as an array.
        // But for a single input, it's easier to bind to a string.
        // I'll bind to a string property `resultUploadLinkStr` and update the actual array `resultUploadLink`.
        
        const val = value;
        onChange({ ...item, resultUploadLink: val ? [val] : [] }, index);
    } else {
        onChange({ ...item, [field]: value }, index);
    }
  };
  
  // Helper to get string value from potential array
  const getLinkValue = (links) => {
      if (Array.isArray(links) && links.length > 0) return links[0];
      if (typeof links === 'string') return links;
      return "";
  };

  // Max completed sem = currentSemester - 1 (e.g. in sem 6, completed 1-5). Allow at least sem 1 when no results yet.
  // Current semester only if canUploadCurrentSemester (final year or after graduation).
  const maxCompletedSem = Math.max(1, maxAllowedSemester - 1);
  const itemSem = Number(item.semester);
  const isCurrentSemester = itemSem === maxAllowedSemester;
  const allowUpload = !isCurrentSemester || canUploadCurrentSemester;
  const availableOptions = [1, 2, 3, 4, 5, 6, 7, 8].filter(sem => {
      const allowed = sem <= maxCompletedSem || (sem === maxAllowedSemester && canUploadCurrentSemester);
      const available = !takenSemesters.has(sem) || sem === itemSem;
      return allowed && available;
  });

  return (
    <Box border="1px solid" borderColor={locked ? "gray.300" : "gray.200"} borderRadius="xl" p={4} bg={locked ? "gray.50" : "white"}>
      <Flex justify="space-between" align="center" mb={isOpen ? 4 : 0} cursor="pointer" onClick={onToggle}>
        <VStack align="start" gap={0}>
            <Heading size="sm" color="#20343c">{item.semester ? `Semester ${item.semester}` : "New Semester Entry"}</Heading>
            <Text fontSize="xs" color="gray.600">{item.academicYear || "Year"}{locked ? " · Locked (no backlogs)" : ""}</Text>
        </VStack>
        <IconButton icon={isOpen ? <FaChevronUp /> : <FaChevronDown />} size="sm" variant="ghost" aria-label="Toggle" />
      </Flex>
      
      <Collapse in={isOpen}>
        <VStack spacing={6} align="stretch" mt={4}>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <FormControl isRequired>
              <FormLabel>Semester</FormLabel>
              {yearOfJoining ? (
                <Text fontSize="md" py={2} color="gray.700">{item.semester || "—"}</Text>
              ) : (
                <Select 
                  value={item.semester || ""} 
                  onChange={(e) => handleChange("semester", e.target.value)}
                  isDisabled={!canEdit}
                  placeholder="Select Semester"
                >
                  {availableOptions.map(sem => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </Select>
              )}
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Academic Year</FormLabel>
              {yearOfJoining ? (
                <Text fontSize="md" py={2} color="gray.700">{item.academicYear || "—"}</Text>
              ) : (
                <Input
                  type="number"
                  value={item.academicYear || ""}
                  onChange={(e) => handleChange("academicYear", e.target.value)}
                  isDisabled={!canEdit}
                  placeholder="e.g. 2023"
                />
              )}
            </FormControl>

            <FormControl isRequired>
              <FormLabel>SGPA</FormLabel>
              <Input
                type="text"
                inputMode="decimal"
                value={item.sgpa || ""}
                onChange={(e) => {
                  let val = String(e.target.value || "")
                  // allow digits and one dot
                  val = val.replace(/[^0-9.]/g, '')
                  const parts = val.split('.')
                  if (parts.length > 2) {
                    val = parts[0] + '.' + parts.slice(1).join('').slice(0,2)
                  }
                  if (parts[1]) {
                    parts[1] = parts[1].slice(0,2)
                    val = parts[0] + '.' + parts[1]
                  }
                  if (val.startsWith('.')) val = '0' + val
                  // cap max at 10
                  const n = parseFloat(val)
                  if (!Number.isNaN(n) && n > 10) {
                    // keep two decimals if present
                    val = '10' + (val.includes('.') ? val.slice(val.indexOf('.')) : '')
                  }
                  handleChange("sgpa", val)
                }}
                onBlur={(e) => {
                  let val = e.target.value;
                  if (val && !isNaN(val)) {
                    // format to 2 decimal places on blur
                    const formatted = parseFloat(val).toFixed(2);
                    handleChange("sgpa", formatted);
                  }
                }}
                isDisabled={!canEdit}
                placeholder="e.g. 8.50"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Live Backlogs</FormLabel>
              <Input
                type="text"
                inputMode="numeric"
                value={String(item.liveBacklogs ?? item.live_backlogs ?? "")}
                onChange={(e) => {
                  let v = String(e.target.value || '')
                  v = v.replace(/[^0-9]/g, '').slice(0,2) // max 2 digits
                  handleChange("liveBacklogs", v === "" ? 0 : Number(v))
                }}
                isDisabled={!canEdit}
                placeholder="0"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Closed Backlogs</FormLabel>
              <Input
                type="text"
                inputMode="numeric"
                value={String(item.closedBacklogs ?? item.closed_backlogs ?? "")}
                onChange={(e) => {
                  let v = String(e.target.value || '')
                  v = v.replace(/[^0-9]/g, '').slice(0,2) // max 2 digits
                  handleChange("closedBacklogs", v === "" ? 0 : Number(v))
                }}
                isDisabled={!canEdit}
                placeholder="0"
              />
            </FormControl>

            <FormControl isRequired>
                <FormLabel>Result Marksheet*</FormLabel>
                {!allowUpload && canEdit ? (
                  <Text fontSize="sm" color="orange.600">
                    You can upload current semester result only in final year (Sem 8) or after graduation.
                  </Text>
                ) : null}
                <AcademicsFileInput 
                    isEditing={canEdit && allowUpload}
                    value={getLinkValue(item.resultUploadLink)}
                    onChange={(url) => handleChange("resultUploadLink", url ? [url] : [])}
                    onFileSelect={allowUpload && onFileSelect ? (file) => onFileSelect(index, file) : undefined}
                    index={index}
                />
            </FormControl>
          </SimpleGrid>
        </VStack>
      </Collapse>
    </Box>
  )
}

export const AcademicPerformanceForm = ({ data = {}, onUpdate, isEditing, onFileSelect, personalDetails }) => {
  const bg = useColorModeValue("white", "gray.50");
  const formData = data || {};
  
  // Normalize data from DB (snake_case) to frontend (camelCase)
  // Check if formData itself is the array or if it's inside 'academics' property
  const rawAcademics = Array.isArray(formData) ? formData : (formData.academics || []);
  
  const academics = rawAcademics.map(item => ({
      ...item,
      id: item.id,
      semester: item.semester,
      academicYear: item.academicYear || item.academic_year,
      sgpa: item.sgpa || item.result_in_sgpa,
      liveBacklogs: item.liveBacklogs ?? item.live_backlogs ?? 0,
      closedBacklogs: item.closedBacklogs ?? item.closed_backlogs ?? 0,
      resultUploadLink: item.resultUploadLink || item.provisional_result_upload_links
  }));
  
  const currentSemester = personalDetails?.currentSemester != null && personalDetails.currentSemester !== ''
    ? Number(personalDetails.currentSemester)
    : 9;
  const yearOfJoining = personalDetails?.yearOfJoining ?? personalDetails?.year_of_joining;
  const canUploadCurrentSemester = canUploadCurrentSemesterRule(currentSemester, yearOfJoining);
  const takenSemesters = new Set(academics.map(a => Number(a.semester)).filter(Boolean));

  const [openIndex, setOpenIndex] = React.useState(null);
  const [showCurrentSemesterAlert, setShowCurrentSemesterAlert] = React.useState(false);
  const [attemptedSemester, setAttemptedSemester] = React.useState(null);

  const handleUpdate = (newAcademics) => {
    // If the original data structure was an object, we might want to preserve that?
    // But for simplicity and since I control the backend, I'll send the array.
    onUpdate(newAcademics);
  };

  const handleAdd = () => {
    // Next semester: 1 if empty, else max taken + 1
    const nextSem = academics.length === 0 ? 1 : (Math.max(...Array.from(takenSemesters), 0) + 1);
    const isCurrentSem = nextSem === currentSemester;
    
    if (isCurrentSem && !canUploadCurrentSemester) {
      setAttemptedSemester(nextSem);
      setShowCurrentSemesterAlert(true);
      return;
    }
    
    setShowCurrentSemesterAlert(false);
    const nextYear = yearOfJoining ? String(computeAcademicYear(yearOfJoining, nextSem)) : "";
    const newEntry = {
      semester: nextSem,
      academicYear: nextYear,
      sgpa: "",
      liveBacklogs: "0",
      closedBacklogs: "0",
      resultUploadLink: []
    };
    const newAcademics = [...academics, newEntry];
    handleUpdate(newAcademics);
    setOpenIndex(newAcademics.length - 1);
  };

  const handleChange = (item, index) => {
    const newAcademics = [...academics];
    newAcademics[index] = item;
    handleUpdate(newAcademics);
  };

  const { user } = useAuth()
  const usn = user?.usn
  const toast = useToast()

  const handleUpload = async (index, file) => {
    if (!usn) {
      toast({
        title: "Authentication Error",
        description: "User session not found. Please log in again.",
        status: "error",
        duration: 3000,
        isClosable: true
      })
      return
    }
    if (!file) return

    try {
      const result = await StudentProfileService.uploadFile(usn, file, { folder: "academics" })
      const url = result?.url || result?.path
      if (url) {
        const newAcademics = [...academics]
        newAcademics[index] = { 
            ...newAcademics[index], 
            resultUploadLink: [url],
            provisional_result_upload_links: [url] 
        }
        handleUpdate(newAcademics)
        toast({
          status: "success",
          description: "Marksheet uploaded successfully",
          duration: 3000,
          isClosable: true
        })
      }
    } catch (e) {
      toast({
        status: "error",
        description: "File upload failed",
        duration: 4000,
        isClosable: true
      })
    }
  }

  const handleFileSelectWrapper = async (index, file) => {
    if (onFileSelect) {
      await onFileSelect(index, file)
    } else {
      await handleUpload(index, file)
    }
  }

  return (
    <VStack spacing={6} align="stretch">
      {showCurrentSemesterAlert && attemptedSemester && (
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>All previous semester uploads are complete</AlertTitle>
            <AlertDescription>
              Kindly wait until Semester {attemptedSemester} ends before uploading its results.
            </AlertDescription>
          </Box>
        </Alert>
      )}
      
      <Flex justify="space-between" align="center">
        <Heading size="md" color="#20343c">Semester Academics</Heading>
        {isEditing && (
          <Button
            leftIcon={<FaPlus />}
            onClick={handleAdd}
            colorScheme="orange"
            variant="outline"
            borderColor="#d4a960"
            color="#d4a960"
            _hover={{ bg: "#fff5e6" }}
          >
            Add Semester
          </Button>
        )}
      </Flex>

      <VStack spacing={4} align="stretch">
        {academics.map((item, index) => (
          <SemesterItem
            key={index}
            index={index}
            item={item}
            onChange={handleChange}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            isEditing={isEditing}
            onFileSelect={handleFileSelectWrapper}
            takenSemesters={takenSemesters}
            maxAllowedSemester={currentSemester}
            yearOfJoining={yearOfJoining}
            canUploadCurrentSemester={canUploadCurrentSemester}
          />
        ))}
        {academics.length === 0 && (
            <Box p={8} textAlign="center" color="gray.600" border="1px dashed" borderColor="gray.300" borderRadius="xl">
                No academic records added yet.
            </Box>
        )}
      </VStack>
    </VStack>
  );
};
