import React from "react";
import {
  Box,
  VStack,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  Heading,
  Text,
  Divider,
  useColorModeValue,
  Avatar,
  Flex,
  IconButton,
} from "@chakra-ui/react";
import { useAuth } from "../../../context/AuthContext";
import { FaEdit } from "react-icons/fa";

const Section = ({ title, bg, children }) => (
  <Box
    bg={bg}
    borderRadius="xl"
    boxShadow="sm"
    p={{ base: 6, md: 8 }}
    border="1px solid"
    borderColor="gray.100"
  >
    <Heading size="md" mb={6} color="gray.700">{title}</Heading>
    {children}
  </Box>
);

  const SelectFromOptions = ({ 
    label, 
    valueKey, 
    idKey, 
    options, 
    isEnabled,
    formData,
    handleChange,
    inputVariant,
    focusBorderColor,
    inputPadding
  }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [filter, setFilter] = React.useState("");
    const wrapperRef = React.useRef(null);

    // Sync input text with saved value
    React.useEffect(() => {
        if (!isOpen) {
             setFilter(formData[valueKey] || "");
        }
    }, [formData, valueKey, isOpen]);

    // Click outside handler
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = React.useMemo(() => {
        if (!options) return [];
        if (!filter) return options;
        return options.filter(o => 
            o.name.toLowerCase().includes(filter.toLowerCase())
        );
    }, [options, filter]);

    const handleSelect = (option) => {
        // Fix: Update both fields in ONE state update to prevent stale state overwrite
        handleChange({
            [valueKey]: option.name,
            [idKey]: option.id
        });
        setFilter(option.name);
        setIsOpen(false);
    };

    return (
      <Box ref={wrapperRef} position="relative">
        <FormControl>
          <FormLabel fontWeight="semibold" color="gray.600">{label}</FormLabel>
          <Input
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setIsOpen(true);
              // Do NOT clear ID here. Wait for valid selection.
              // Clearing ID while keeping Name leads to inconsistent state if user cancels.
            }}
            onFocus={() => isEnabled && setIsOpen(true)}
            variant={inputVariant}
            focusBorderColor={focusBorderColor}
            px={inputPadding}
            isDisabled={!isEnabled}
            _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
            autoComplete="off"
            placeholder={isEnabled ? "Type to search..." : ""}
          />
          {isOpen && isEnabled && (
              <Box
                  position="absolute"
                  top="100%"
                  left={0}
                  right={0}
                  zIndex={1000}
                  bg="white"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="md"
                  boxShadow="lg"
                  maxH="200px"
                  overflowY="auto"
                  mt={1}
              >
                  {filteredOptions.length > 0 ? (
                      filteredOptions.map(option => (
                          <Box
                              key={option.id}
                              p={2}
                              cursor="pointer"
                              _hover={{ bg: "gray.100" }}
                              onMouseDown={(e) => {
                                  e.preventDefault(); // Prevent blur
                                  e.stopPropagation();
                                  handleSelect(option);
                              }}
                          >
                              {option.name}
                          </Box>
                      ))
                  ) : (
                       <Box p={2}>
                          <Text color="gray.500" fontSize="sm">No options found</Text>
                      </Box>
                  )}
              </Box>
          )}
        </FormControl>
      </Box>
    );
  };

  const processLanguages = (val) => {
      if (!val) return "";
      return val.split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()) // Title Case
        .sort()
        .join(', ');
  };

export const PersonalInformationForm = ({
  data = {},
  onUpdate,
  isEditing,
  mode = "student",
  majorOptions = [],
  minorOptions = [],
  specializationOptions = [],
  schoolOptions = [],
  programOptions = [],
  pendingProfileImagePreview,
  onProfileImageSelect,
}) => {
  const bg = "white"; // Clean white card
  const formData = data || {};
  
  const inputVariant = isEditing ? "outline" : "unstyled";
  const inputPadding = isEditing ? 3 : 0;
  const focusBorderColor = "#d4a960";
  
  const isStudent = mode === "student";
  const { user } = useAuth();
  const usn = user?.usn;
  const fileInputRef = React.useRef(null);

  // Filter options based on selected Program ID
  const filteredSpecializations = React.useMemo(() => {
      if (!formData.programId) return specializationOptions;
      return specializationOptions.filter(s => s.program_id === formData.programId);
  }, [specializationOptions, formData.programId]);

  const filteredMajors = React.useMemo(() => {
      if (!formData.programId) return majorOptions;
      return majorOptions.filter(m => m.program_id === formData.programId);
  }, [majorOptions, formData.programId]);

  // Minors are not filtered as per requirements

  const toDdMmYyyy = (v) => {
    if (!v) return "";
    const d = new Date(v);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    }
    const s = String(v);
    const mIso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (mIso) return `${mIso[3]}-${mIso[2]}-${mIso[1]}`;
    const mDdMmYy = /^(\d{2})-(\d{2})-(\d{4})$/.exec(s);
    if (mDdMmYy) return s;
    return s;
  };
  const toYyyyMmDd = (v) => {
    if (!v) return "";
    const d = new Date(v);
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${yyyy}-${mm}-${dd}`;
    }
    const s = String(v);
    const mDdMmYy = /^(\d{2})-((\d{2}))-(\d{4})$/.exec(s);
    if (mDdMmYy) return `${mDdMmYy[3]}-${mDdMmYy[2]}-${mDdMmYy[1]}`;
    const mIso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (mIso) return s;
    return s;
  };

  // Fix: Accept an object of updates to support atomic multiple-field updates
  const handleChange = (updates) => {
    onUpdate({ ...formData, ...updates });
  };
  
  const handleLanguageChange = (e) => {
      handleChange({ languages: e.target.value });
  };
  
  const handleLanguageBlur = (e) => {
      const processed = processLanguages(e.target.value);
      handleChange({ languages: processed });
  };

  return (
    <VStack spacing={8} align="stretch">
      <Section title="Profile Details" bg={bg}>
        <Flex direction={{ base: "column", md: "row" }} align="center" gap={10}>
          <Box 
            position="relative"
            p={2} 
            borderRadius="full" 
            borderWidth="1px" 
            borderColor="gray.200"
            bg="white"
            boxShadow="sm"
          >
            <Avatar 
              size="2xl" 
              name={formData.fullName} 
              src={pendingProfileImagePreview || formData.profileImage} 
              borderWidth="4px"
              borderColor="gray.50"
            />
            {isEditing && (
              <>
                <IconButton
                  icon={<FaEdit />}
                  size="sm"
                  aria-label="Change profile image"
                  position="absolute"
                  bottom={2}
                  right={2}
                  borderRadius="full"
                  bg="#d4a960"
                  color="#20343c"
                  _hover={{ bg: "#c39850" }}
                  boxShadow="md"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                />
                <Input
                  type="file"
                  ref={fileInputRef}
                  accept=".jpg,.jpeg,.png,.webp"
                  display="none"
                  onChange={async (e) => {
                    const file = e.target.files && e.target.files[0];
                    if (!file) return;
                    if (onProfileImageSelect) {
                      onProfileImageSelect(file);
                    }
                    e.target.value = "";
                  }}
                />
              </>
            )}
          </Box>

          <VStack flex={1} w="full" spacing={6} align="stretch">
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium" color="gray.500">
                  Full Name
                </FormLabel>
                <Input
                  value={formData.fullName || ""}
                  onChange={(e) => handleChange({ fullName: e.target.value })}
                  variant={inputVariant}
                  focusBorderColor={focusBorderColor}
                  px={isEditing ? 3 : 0}
                  fontSize="xl"
                  fontWeight="semibold"
                  isDisabled={!isEditing}
                  _disabled={{ opacity: 1, bg: "transparent", px: 0, color: "gray.900", cursor: "default" }}
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium" color="gray.500">
                  USN
                </FormLabel>
                <Input
                  value={formData.usn || ""}
                  onChange={(e) => handleChange({ usn: e.target.value })}
                  variant="unstyled"
                  fontSize="lg"
                  fontFamily="monospace"
                  isDisabled={true}
                  _disabled={{ opacity: 1, bg: "transparent", px: 0, color: "gray.900", cursor: "default" }}
                />
              </FormControl>
            </SimpleGrid>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium" color="gray.500">
                  Current Year
                </FormLabel>
                <Input
                  value={formData.currentYear ?? ""}
                  variant="unstyled"
                  fontSize="lg"
                  isDisabled={true}
                  _disabled={{ opacity: 1, bg: "transparent", px: 0, color: "gray.900", cursor: "default" }}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium" color="gray.500">
                  Current Semester
                </FormLabel>
                <Input
                  value={formData.currentSemester ?? ""}
                  variant="unstyled"
                  fontSize="lg"
                  isDisabled={true}
                  _disabled={{ opacity: 1, bg: "transparent", px: 0, color: "gray.900", cursor: "default" }}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="medium" color="gray.500">
                  Section
                </FormLabel>
                <Input
                  value={formData.section || ""}
                  onChange={(e) => handleChange({ section: (e.target.value || '').toLowerCase() })}
                  variant={inputVariant}
                  focusBorderColor={focusBorderColor}
                  px={inputPadding}
                  isDisabled={!isEditing}
                  _disabled={{ opacity: 1, bg: "transparent", px: 0, color: "gray.900", cursor: "default" }}
                />
              </FormControl>
            </SimpleGrid>
            {/* Profile Image URL input removed as per request */}
          </VStack>
        </Flex>
      </Section>

      <Section title="Basic Details" bg={bg}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          <FormControl>
            <FormLabel fontWeight="semibold" color="gray.600">Gender</FormLabel>
            <Select
              variant={inputVariant}
              focusBorderColor={focusBorderColor}
              isDisabled={!isEditing}
              _disabled={{ opacity: 1, color: "gray.800", cursor: "default", bg: "transparent" }}
              value={formData.gender || ""}
              onChange={(e) => handleChange({ gender: e.target.value })}
              icon={!isEditing ? "none" : undefined}
            >
              <option value="">Select</option>
              <option value="MALE">MALE</option>
              <option value="FEMALE">FEMALE</option>
              <option value="Other">Other</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel fontWeight="semibold" color="gray.600">Date of Birth</FormLabel>
            <Input
              type={isEditing ? "date" : "text"}
              value={isEditing ? toYyyyMmDd(formData.dateOfBirth || "") : toDdMmYyyy(formData.dateOfBirth || "")}
              onChange={(e) => handleChange({ dateOfBirth: e.target.value })}
              variant={inputVariant}
              focusBorderColor={focusBorderColor}
              px={inputPadding}
              isDisabled={!isEditing}
              _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
            />
          </FormControl>

          <FormControl>
            <FormLabel fontWeight="semibold" color="gray.600">Blood Group</FormLabel>
            <Input
              value={formData.bloodGroup || ""}
              onChange={(e) => handleChange({ bloodGroup: e.target.value })}
              variant={inputVariant}
              focusBorderColor={focusBorderColor}
              px={inputPadding}
              isDisabled={!isEditing}
              _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
            />
          </FormControl>

          <FormControl>
            <FormLabel fontWeight="semibold" color="gray.600">Marital Status</FormLabel>
            <Select
              variant={inputVariant}
              focusBorderColor={focusBorderColor}
              isDisabled={!isEditing}
              _disabled={{ opacity: 1, color: "gray.800", cursor: "default", bg: "transparent" }}
              value={formData.maritalStatus || ""}
              onChange={(e) => handleChange({ maritalStatus: e.target.value })}
              icon={!isEditing ? "none" : undefined}
            >
              <option value="">Select</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel fontWeight="semibold" color="gray.600">Specially Abled</FormLabel>
            <Select
              variant={inputVariant}
              focusBorderColor={focusBorderColor}
              isDisabled={!isEditing}
              _disabled={{ opacity: 1, color: "gray.800", cursor: "default", bg: "transparent" }}
              value={formData.speciallyAbled ? "Yes" : "No"}
              onChange={(e) => handleChange({ speciallyAbled: e.target.value === "Yes" })}
              icon={!isEditing ? "none" : undefined}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel fontWeight="semibold" color="gray.600">Languages</FormLabel>
            <Input
              value={formData.languages || ""}
              onChange={handleLanguageChange}
              onBlur={handleLanguageBlur}
              variant={inputVariant}
              focusBorderColor={focusBorderColor}
              px={inputPadding}
              isDisabled={!isEditing}
              _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
              placeholder={isEditing ? "e.g. English, Hindi" : ""}
            />
          </FormControl>
        </SimpleGrid>
      </Section>

      <Section title="Academic Details" bg={bg}>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          <SelectFromOptions
            label="School Name"
            valueKey="schoolName"
            idKey="schoolId"
            options={schoolOptions}
            listId="school-options"
            isEnabled={isEditing}
            formData={formData}
            handleChange={handleChange}
            inputVariant={inputVariant}
            focusBorderColor={focusBorderColor}
            inputPadding={inputPadding}
          />

          <FormControl>
            <FormLabel fontWeight="semibold" color="gray.600">Year of Joining</FormLabel>
            <Input
              value={formData.yearOfJoining ?? ""}
              onChange={(e) => handleChange({ yearOfJoining: e.target.value === "" ? "" : Number(e.target.value) })}
              variant={inputVariant}
              focusBorderColor={focusBorderColor}
              px={inputPadding}
              type={isEditing ? "number" : "text"}
              isDisabled={!isEditing}
              _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }}
            />
          </FormControl>

          <SelectFromOptions
            label="Program"
            valueKey="programName"
            idKey="programId"
            options={programOptions}
            listId="program-options"
            isEnabled={isEditing}
            formData={formData}
            handleChange={(updates) => {
                const programId = updates.programId;
                const program = programOptions.find(p => p.id === programId);
                
                if (program && program.school_name) {
                    updates.schoolName = program.school_name;
                    // Try to find schoolId if available
                    const school = schoolOptions.find(s => s.name === program.school_name);
                    if (school) updates.schoolId = school.id;
                }
                
                handleChange(updates);
            }}
            inputVariant={inputVariant}
            focusBorderColor={focusBorderColor}
            inputPadding={inputPadding}
          />

          {isStudent ? (
            <SelectFromOptions
              label="Specialization"
              valueKey="specializationName"
              idKey="specializationId"
              options={filteredSpecializations}
              listId="specialization-options"
              isEnabled={isEditing}
              formData={formData}
              handleChange={handleChange}
              inputVariant={inputVariant}
              focusBorderColor={focusBorderColor}
              inputPadding={inputPadding}
            />
          ) : (
            <FormControl>
              <FormLabel fontWeight="semibold" color="gray.600">Specialization</FormLabel>
              <Input 
                value={formData.specializationName || ""} 
                onChange={(e) => handleChange({ specializationName: e.target.value })}
                variant={inputVariant}
                isDisabled={!isEditing} 
                _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }} 
              />
            </FormControl>
          )}

          {isStudent ? (
            <SelectFromOptions
              label="Major"
              valueKey="majorName"
              idKey="majorId"
              options={filteredMajors}
              listId="major-options"
              isEnabled={isEditing}
              formData={formData}
              handleChange={handleChange}
              inputVariant={inputVariant}
              focusBorderColor={focusBorderColor}
              inputPadding={inputPadding}
            />
          ) : (
            <FormControl>
              <FormLabel fontWeight="semibold" color="gray.600">Major</FormLabel>
              <Input 
                value={formData.majorName || ""} 
                onChange={(e) => handleChange({ majorName: e.target.value })}
                variant={inputVariant}
                isDisabled={!isEditing} 
                _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }} 
              />
            </FormControl>
          )}

          {isStudent ? (
            <SelectFromOptions
              label="Minor"
              valueKey="minorName"
              idKey="minorId"
              options={minorOptions}
              isEnabled={isEditing}
              formData={formData}
              handleChange={handleChange}
              inputVariant={inputVariant}
              focusBorderColor={focusBorderColor}
              inputPadding={inputPadding}
            />
          ) : (
            <FormControl>
              <FormLabel fontWeight="semibold" color="gray.600">Minor</FormLabel>
              <Input 
                value={formData.minorName || ""} 
                onChange={(e) => handleChange({ minorName: e.target.value })}
                variant={inputVariant}
                isDisabled={!isEditing} 
                _disabled={{ opacity: 1, color: "gray.800", cursor: "default" }} 
              />
            </FormControl>
          )}
        </SimpleGrid>
      </Section>
    </VStack>
  );
};
