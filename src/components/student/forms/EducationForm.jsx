/**
 * Component: EducationForm
 * 
 * Fields (Repeatable):
 * - educationLevel (Select: 10th, 12th, Undergraduate, Postgraduate)
 * - instituteName (Text)
 * - board (Text)
 * - city (Text)
 * - yearOfPassing (Number)
 * - resultType (Select: Percentage, CGPA)
 * - result (Text/Number)
 * - subjects (Text)
 * - gapDetails (Optional)
 * 
 * Validation: All fields optional. Save enabled when there are any changes.
 * 
 * API Contracts:
 * - GET /api/student/profile/education
 * - POST /api/student/profile/education (Add Item)
 * - PUT /api/student/profile/education/:id (Update Item)
 * - DELETE /api/student/profile/education/:id (Delete Item)
 */

import { useState } from "react"
import { Box, SimpleGrid, Input, Select, VStack, Heading, Flex, Button, Text, IconButton, Collapse, useToast, Image, Link, FormControl, Divider, Menu, MenuButton, MenuList, MenuItem, Icon, Badge, Center, HStack } from "@chakra-ui/react"
import { getFileUrl } from "../../../utils/fileUrl"
import { Field } from "../../ui/field"
import { StyledFileInput } from "../../ui/StyledFileInput"
import { FaGraduationCap, FaPlus, FaTrash, FaChevronDown, FaChevronUp, FaSchool, FaMapMarkerAlt, FaCalendarAlt, FaAward, FaBookOpen, FaExclamationCircle } from "react-icons/fa"
import { useAuth } from "../../../context/AuthContext"
import { StudentProfileService } from "../../../services/studentProfile.service"
import "../../../pages/student/profile/EducationProfile.css"

const EducationItem = ({ item, onChange, onDelete, index, isOpen, onToggle, isEditing, onFileSelect, isPG, fieldErrors = {} }) => {
  const [yearError, setYearError] = useState(null)

  const handleChange = (field, value) => {
    onChange({ ...item, [field]: value }, index)
  }
  
  const getError = (field) => fieldErrors[field] || null
  const hasErrors = Object.keys(fieldErrors).length > 0 || !!yearError

  const levelLabels = {
    "10TH": "10th Standard",
    "12TH": "12th Standard / PUC",
    "DIPLOMA": "Diploma",
    "GRADUATION": "Undergraduate",
    "POST_GRADUATION": "Postgraduate",
    "OTHER": "Other"
  }

  const resultTypeLabel = item.resultType === "CGPA" ? "CGPA" : "Percentage"

  return (
    <Box className="education-item-wrapper">
      <Box className="education-item-dot" />
      <Box className={`education-card ${isOpen ? 'education-card--expanded' : ''} ${hasErrors ? 'education-card--error' : ''}`}>
        <Flex className="education-card-header" onClick={onToggle}>
          <Box className="education-card-title-group">
            <Badge className="education-level-badge">
              {levelLabels[item.educationLevel] || "Education Entry"}
            </Badge>
            <Heading className="education-institute-name" size="md">
              {item.instituteName || "Click to add institute name"}
            </Heading>
            <Flex className="education-meta-info">
              {item.city && (
                <Box className="education-meta-item">
                  <Icon as={FaMapMarkerAlt} boxSize={3} />
                  <Text>{item.city}</Text>
                </Box>
              )}
              {item.yearOfPassing && (
                <Box className="education-meta-item">
                  <Icon as={FaCalendarAlt} boxSize={3} />
                  <Text>Passed in {item.yearOfPassing}</Text>
                </Box>
              )}
              {item.result && (
                <Box className="education-meta-item">
                  <Icon as={FaAward} boxSize={3} />
                  <Text>{resultTypeLabel}: {item.result}{item.resultType === "PERCENTAGE" ? "%" : ""}</Text>
                </Box>
              )}
            </Flex>
          </Box>
          <Flex className="education-card-actions">
            {hasErrors && (
              <Icon as={FaExclamationCircle} color="red.500" boxSize={5} mr={2} />
            )}
            {isEditing && (
              <IconButton 
                icon={<FaTrash />} 
                size="sm" 
                colorScheme="red" 
                variant="ghost" 
                className="education-delete-btn"
                onClick={(e) => { e.stopPropagation(); onDelete(index); }} 
                aria-label="Delete" 
                isDisabled={!isEditing} 
              />
            )}
            <IconButton 
              icon={isOpen ? <FaChevronUp /> : <FaChevronDown />} 
              size="sm" 
              variant="ghost" 
              aria-label="Toggle" 
              onClick={(e) => { e.stopPropagation(); onToggle(); }} 
            />
          </Flex>
        </Flex>
        
        <Collapse in={isOpen}>
          <Box className="education-card-body">
            {isEditing ? (
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <Field label="Education Level *">
                    <Select variant="flushed" size="sm" value={item.educationLevel ?? item.education_level ?? ""} onChange={(e) => handleChange("educationLevel", e.target.value)} placeholder="Select Level">
                        <option value="10TH">10th</option>
                        <option value="12TH">12th</option>
                        <option value="DIPLOMA">Diploma</option>
                        {isPG && (
                            <>
                                <option value="GRADUATION">Undergraduate</option>
                                <option value="POST_GRADUATION">Postgraduate</option>
                                <option value="OTHER">Other</option>
                            </>
                        )}
                    </Select>
                </Field>
                <Field label="Institute Name *">
                    <Input size="sm" value={item.instituteName ?? item.institute_name ?? ""} onChange={(e) => handleChange("instituteName", e.target.value)} variant="flushed" placeholder="Enter institute name" />
                </Field>
                <Field label="Board *">
                    <Input size="sm" value={item.board ?? ""} onChange={(e) => handleChange("board", e.target.value)} variant="flushed" placeholder="Enter board" />
                </Field>
                <Field label="City *">
                    <Input size="sm" value={item.city ?? ""} onChange={(e) => handleChange("city", e.target.value)} variant="flushed" placeholder="Enter city" />
                </Field>
                <FormControl isInvalid={!!getError('year_of_passing')}>
                  <Field label="Year of Passing *">
                    <Input 
                      size="sm"
                      type="text" 
                      inputMode="numeric"
                      value={item.yearOfPassing ?? item.end_year ?? item.year_of_passing ?? ""} 
                      onChange={(e) => {
                        let val = e.target.value;
                        val = val.replace(/[^0-9]/g, '').slice(0, 4);
                        handleChange("yearOfPassing", val);
                      }}
                      variant="flushed" 
                      placeholder={`e.g. ${new Date().getFullYear()}`}
                    />
                  </Field>
                  {(getError('year_of_passing') || yearError) && (
                    <Text className="education-error-text">{getError('year_of_passing') || yearError}</Text>
                  )}
                </FormControl>
                <Field label="Result Type *">
                    <Select size="sm" variant="flushed" value={item.resultType ?? item.result_type ?? "PERCENTAGE"} onChange={(e) => handleChange("resultType", e.target.value)}>
                        <option value="PERCENTAGE">Percentage</option>
                        <option value="CGPA">CGPA</option>
                    </Select>
                </Field>
                <FormControl isInvalid={!!getError('result')}>
                  <Field label="Result Value *">
                    <Input 
                      size="sm"
                      type="number"
                      value={item.result ?? item.result_value ?? ""} 
                      onChange={(e) => {
                        const val = e.target.value;
                        const resultType = item.resultType ?? item.result_type ?? "PERCENTAGE";
                        if (val === '') {
                          handleChange("result", val);
                          return;
                        }
                        const numVal = parseFloat(val);
                        if (resultType === "PERCENTAGE") {
                          if (numVal >= 0 && numVal <= 100) handleChange("result", val);
                        } else {
                          if (numVal >= 0 && numVal <= 10) handleChange("result", val);
                        }
                      }}
                      variant="flushed" 
                      placeholder={item.resultType === "CGPA" ? "e.g. 8.5" : "e.g. 85"}
                      step="0.01"
                    />
                  </Field>
                  {getError('result') && (
                    <Text className="education-error-text">{getError('result')}</Text>
                  )}
                </FormControl>
                <FormControl isInvalid={!!getError('subjects')}>
                  <Field label="Subjects *">
                    <Input 
                      size="sm"
                      value={item.subjects ?? ""} 
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^[a-zA-Z\s,.\-&()]+$/.test(val)) {
                          handleChange("subjects", val);
                        }
                      }}
                      variant="flushed" 
                      placeholder="e.g. Physics, Chemistry, Mathematics"
                    />
                  </Field>
                  {getError('subjects') && (
                    <Text className="education-error-text">{getError('subjects')}</Text>
                  )}
                </FormControl>
                <Field label="Upload Marksheet/Certificate *">
                  <EducationFileInput
                      isEditing={isEditing}
                      value={item.marksheet_file}
                      onChange={(url) => handleChange("marksheet_file", url)}
                      onFileSelect={onFileSelect ? (file) => onFileSelect(index, file) : undefined}
                  />
                </Field>
              </SimpleGrid>
            ) : (
              <Box>
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} className="education-view-grid">
                  <Box className="education-view-item">
                    <Text className="education-view-label">Education Level</Text>
                    <Text className="education-view-value">{levelLabels[item.educationLevel] || "-"}</Text>
                  </Box>
                  <Box className="education-view-item">
                    <Text className="education-view-label">Institute Name</Text>
                    <Text className="education-view-value">{item.instituteName || "-"}</Text>
                  </Box>
                  <Box className="education-view-item">
                    <Text className="education-view-label">Board / University</Text>
                    <Text className="education-view-value">{item.board || "-"}</Text>
                  </Box>
                  <Box className="education-view-item">
                    <Text className="education-view-label">City</Text>
                    <Text className="education-view-value">{item.city || "-"}</Text>
                  </Box>
                  <Box className="education-view-item">
                    <Text className="education-view-label">Year of Passing</Text>
                    <Text className="education-view-value">{item.yearOfPassing || "-"}</Text>
                  </Box>
                  <Box className="education-view-item">
                    <Text className="education-view-label">{resultTypeLabel}</Text>
                    <Text className="education-view-value">
                      {item.result ? `${item.result}${item.resultType === "PERCENTAGE" ? "%" : ""}` : "-"}
                    </Text>
                  </Box>
                  <Box className="education-view-item" gridColumn={{ md: "span 3" }}>
                    <Text className="education-view-label">Subjects</Text>
                    <Text className="education-view-value">{item.subjects || "-"}</Text>
                  </Box>
                </SimpleGrid>
                {item.marksheet_file && (
                  <Box className="education-view-document">
                    <HStack>
                      <Icon as={FaAward} color="blue.500" />
                      <Text fontSize="sm" fontWeight="600" color="blue.700">Marksheet / Certificate</Text>
                    </HStack>
                    <Link href={getFileUrl(item.marksheet_file)} isExternal fontSize="xs" color="blue.600" fontWeight="bold" textDecoration="underline">
                      VIEW DOCUMENT
                    </Link>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Collapse>
      </Box>
    </Box>
  )
}

export const EducationForm = ({ data = {}, onUpdate, isEditing = false, onFileSelect, fieldErrors = {} }) => {
  const historyRaw = Array.isArray(data?.education_history) ? data.education_history : (Array.isArray(data) ? data : [])
  const gapsRaw = Array.isArray(data?.education_gaps) ? data.education_gaps : []

  const historyItems = historyRaw.map(item => ({
      ...item,
      educationLevel: item.educationLevel ?? item.education_level ?? "",
      instituteName: item.instituteName ?? item.institute_name ?? "",
      board: item.board ?? "",
      city: item.city ?? "",
      yearOfPassing: item.yearOfPassing ?? item.end_year ?? item.year_of_passing ?? "",
      resultType: item.resultType ?? item.result_type ?? "PERCENTAGE",
      result: item.result ?? item.result_value ?? "",
      subjects: item.subjects ?? "",
      marksheet_file: item.marksheet_file ?? item.proofFile ?? ""
  }))

  const gapItems = gapsRaw.map(item => ({
    ...item,
    gapStartDate: item.gapStartDate ?? item.gap_start_date ?? "",
    gapEndDate: item.gapEndDate ?? item.gap_end_date ?? "",
    gapReason: item.gapReason ?? item.gap_reason ?? "",
    remarks: item.remarks ?? ""
  }))

  const [openIndex, setOpenIndex] = useState(-1)
  const toast = useToast()
  const { user } = useAuth()
  const usn = user?.usn
  const isPG = true

  const updateAll = (nextHistory, nextGaps) => {
    onUpdate({ education_history: nextHistory, education_gaps: nextGaps })
  }

  const handleHistoryChange = (updatedItem, index) => {
      const newItems = [...historyItems]
      newItems[index] = updatedItem
      updateAll(newItems, gapItems)
  }

  const handleAdd = () => {
      const newHistory = [
        ...historyItems,
        {
          educationLevel: "",
          instituteName: "",
          board: "",
          city: "",
          yearOfPassing: "",
          resultType: "PERCENTAGE",
          result: "",
          subjects: "",
          marksheet_file: ""
        }
      ]
      updateAll(newHistory, gapItems)
      setOpenIndex(newHistory.length - 1)
  }

  const handleAddGap = () => {
    updateAll(historyItems, [
      ...gapItems,
      { gapStartDate: "", gapEndDate: "", gapReason: "", remarks: "" }
    ])
  }

  const handleDelete = (index) => {
      const newItems = historyItems.filter((_, i) => i !== index)
      updateAll(newItems, gapItems)
  }

  const handleUpload = async (index, file) => {
    if (!file || !usn) return
    try {
      const result = await StudentProfileService.uploadFile(usn, file, { folder: "education" })
      const url = result?.url || result?.path
      if (url) {
        const newItems = [...historyItems]
        newItems[index] = { ...newItems[index], marksheet_file: url }
        updateAll(newItems, gapItems)
        toast({ status: "success", description: "Marksheet uploaded successfully", duration: 3000, isClosable: true })
      }
    } catch (e) {
      toast({ status: "error", description: "File upload failed", duration: 4000, isClosable: true })
    }
  }

  const handleFileSelectWrapper = async (index, file) => {
    if (onFileSelect) onFileSelect(index, file)
    else await handleUpload(index, file)
  }

  return (
    <Box className="education-profile-container" bg="white" p={{ base: 4, md: 6 }} borderRadius="xl" shadow="sm">
      <Flex className="education-header">
        <Heading className="education-title" size="md">
          <Icon as={FaGraduationCap} className="education-title-icon" />
          Education Journey
        </Heading>
        {isEditing && (
          <Menu>
            <MenuButton 
              as={Button} 
              leftIcon={<FaPlus />} 
              className="education-add-btn"
              size="sm"
            >
              Add Detail
            </MenuButton>
            <MenuList shadow="lg" borderRadius="md" py={1} zIndex={10}>
              <MenuItem icon={<FaSchool />} onClick={handleAdd} py={2} fontSize="sm" fontWeight="600">
                Education History
              </MenuItem>
              <MenuItem icon={<FaBookOpen />} onClick={handleAddGap} py={2} fontSize="sm" fontWeight="600">
                Education Gap
              </MenuItem>
            </MenuList>
          </Menu>
        )}
      </Flex>
      
      <Box className="education-timeline">
        {historyItems.length === 0 ? (
          <Center py={12} flexDirection="column" gap={4} border="2px dashed" borderColor="gray.100" borderRadius="xl">
            <Icon as={FaGraduationCap} boxSize={12} color="gray.200" />
            <Text color="gray.500" fontWeight="500">No education records found.</Text>
            {isEditing && (
              <Button leftIcon={<FaPlus />} variant="outline" colorScheme="orange" onClick={handleAdd}>
                Add your first record
              </Button>
            )}
          </Center>
        ) : (
          historyItems.map((item, index) => (
            <EducationItem 
              key={index} 
              index={index} 
              item={item} 
              onChange={handleHistoryChange} 
              onDelete={handleDelete}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
              isEditing={isEditing}
              onFileSelect={handleFileSelectWrapper}
              isPG={isPG}
              fieldErrors={fieldErrors?.[index] || {}}
            />
          ))
        )}
      </Box>

      {gapItems.length > 0 && (
        <Box className="education-gaps-container">
          <Heading className="education-gaps-title" size="sm">
            <Icon as={FaExclamationCircle} mr={2} boxSize={4} color="orange.400" />
            Education Gaps
          </Heading>
          <Text fontSize="xs" color="gray.600" mb={4}>
            Please mention any academic gaps during your studies, if applicable.
          </Text>
          
          <VStack spacing={4} align="stretch">
            {gapItems.map((item, i) => (
              <GapItem
                key={i}
                item={item}
                index={i}
                onChange={(updated) => {
                  const next = [...gapItems]
                  next[i] = updated
                  updateAll(historyItems, next)
                }}
                onDelete={(idx) => {
                  updateAll(historyItems, gapItems.filter((_, gidx) => gidx !== idx))
                }}
                isEditing={isEditing}
                fieldErrors={fieldErrors?.education_gaps?.[i] || {}}
              />
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  )
}

const GapItem = ({ item, index, onChange, onDelete, isEditing, fieldErrors = {} }) => {
  const set = (field, value) => onChange({ ...item, [field]: value }, index)
  const err = (field) => fieldErrors[field] || null
  return (
    <Box className="education-gap-card">
      <Flex justify="space-between" align="center" mb={isEditing ? 4 : 2}>
        <HStack>
          <Icon as={FaCalendarAlt} color="orange.400" boxSize={3} />
          <Heading size="xs" color="#20343c" textTransform="uppercase" letterSpacing="wider" fontSize="0.7rem">Gap Record #{index + 1}</Heading>
        </HStack>
        {isEditing && (
          <IconButton 
            icon={<FaTrash />} 
            size="xs" 
            colorScheme="red" 
            variant="ghost" 
            onClick={() => onDelete(index)} 
            aria-label="Delete gap" 
          />
        )}
      </Flex>
      {isEditing ? (
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
          <FormControl isInvalid={!!err('gap_start_date')}>
            <Field label="Start Date *">
              <Input size="sm" type="date" variant="filled" bg="white" value={item.gapStartDate ?? ""} onChange={(e) => set("gapStartDate", e.target.value)} />
            </Field>
            {err('gap_start_date') && <Text className="education-error-text">{err('gap_start_date')}</Text>}
          </FormControl>
          <FormControl isInvalid={!!err('gap_end_date')}>
            <Field label="End Date *">
              <Input size="sm" type="date" variant="filled" bg="white" value={item.gapEndDate ?? ""} onChange={(e) => set("gapEndDate", e.target.value)} />
            </Field>
            {err('gap_end_date') && <Text className="education-error-text">{err('gap_end_date')}</Text>}
          </FormControl>
          <FormControl isInvalid={!!err('gap_reason')} gridColumn={{ md: "span 2" }}>
            <Field label="Reason for Gap *">
              <Input size="sm" variant="filled" bg="white" value={item.gapReason ?? ""} onChange={(e) => set("gapReason", e.target.value)} placeholder="e.g. Health reasons, competitive exam preparation, etc." />
            </Field>
            {err('gap_reason') && <Text className="education-error-text">{err('gap_reason')}</Text>}
          </FormControl>
          <Field label="Additional Remarks (Optional)" gridColumn={{ md: "span 2" }}>
            <Input size="sm" variant="filled" bg="white" value={item.remarks ?? ""} onChange={(e) => set("remarks", e.target.value)} placeholder="Any other details you want to share" />
          </Field>
        </SimpleGrid>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} className="education-view-grid">
          <Box className="education-view-item">
            <Text className="education-view-label">Start Date</Text>
            <Text className="education-view-value">{item.gapStartDate || "-"}</Text>
          </Box>
          <Box className="education-view-item">
            <Text className="education-view-label">End Date</Text>
            <Text className="education-view-value">{item.gapEndDate || "-"}</Text>
          </Box>
          <Box className="education-view-item">
            <Text className="education-view-label">Reason</Text>
            <Text className="education-view-value">{item.gapReason || "-"}</Text>
          </Box>
          {item.remarks && (
            <Box className="education-view-item" gridColumn={{ md: "span 3" }}>
              <Text className="education-view-label">Remarks</Text>
              <Text className="education-view-value">{item.remarks}</Text>
            </Box>
          )}
        </SimpleGrid>
      )}
    </Box>
  )
}

const EducationFileInput = ({ isEditing, value, onChange, onFileSelect }) => {
  const [pendingFile, setPendingFile] = useState(null)
  const [pendingPreview, setPendingPreview] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    if (file.type.startsWith('image/')) {
      const previewUrl = URL.createObjectURL(file)
      setPendingPreview(previewUrl)
    }
    setPendingFile(file)
    if (onFileSelect) onFileSelect(file)
    e.target.value = ""
  }

  return (
    <Box className="education-file-upload">
      {isEditing && (
        <VStack align="stretch" spacing={3}>
          <StyledFileInput
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            acceptLabel="PDF, JPG, PNG (Max 5MB)"
          />
          {pendingFile && (
            <Box className="education-file-preview">
              {pendingPreview ? (
                <Image src={pendingPreview} alt="Preview" boxSize="40px" borderRadius="md" objectFit="cover" />
              ) : (
                <Icon as={FaBookOpen} boxSize={6} color="orange.400" />
              )}
              <VStack align="start" spacing={0} flex={1}>
                <Text fontSize="xs" fontWeight="bold" color="orange.600">Pending Upload</Text>
                <Text fontSize="xs" noOfLines={1} color="gray.500">{pendingFile.name}</Text>
              </VStack>
            </Box>
          )}
        </VStack>
      )}
      {value && (
        <Box mt={3} p={3} bg="blue.50" borderRadius="lg" border="1px solid" borderColor="blue.100">
          <HStack justify="space-between">
            <HStack>
              <Icon as={FaAward} color="blue.500" />
              <Text fontSize="sm" fontWeight="600" color="blue.700">Document Uploaded</Text>
            </HStack>
            <Link href={getFileUrl(value)} isExternal fontSize="xs" color="blue.600" fontWeight="bold" textDecoration="underline">
              VIEW DOCUMENT
            </Link>
          </HStack>
        </Box>
      )}
    </Box>
  )
}
