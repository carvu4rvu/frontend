import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Step,
  StepDescription,
  StepIcon,
  StepIndicator,
  StepNumber,
  StepSeparator,
  StepStatus,
  StepTitle,
  Stepper,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/auth.service';

const AlumniRegistration = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  React.useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const [formData, setFormData] = useState({
    code: '',
    email: '',
    otp: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone_number: '',
  });
  const [codeData, setCodeData] = useState(null);

  const steps = [
    { title: 'Validate Code', description: 'Enter code' },
    { title: 'Verify Email', description: 'Email & OTP' },
    { title: 'Details', description: 'Your Profile' },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleValidateCode = async () => {
    setLoading(true);
    try {
      const res = await AuthService.validateAlumniCode(formData.code);
      setCodeData(res);
      setActiveStep(1);
      toast({ title: 'Code Validated', description: res.remarks ? `Welcome ${res.remarks}` : 'Code valid', status: 'success' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      await AuthService.sendAlumniOtp(formData.email, codeData.code_id);
      setOtpSent(true);
      setResendTimer(30);
      toast({ title: 'OTP Sent', description: 'Check your email for OTP', status: 'success' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      await AuthService.verifyAlumniOtp(formData.email, formData.otp);
      toast({ title: 'Email Verified', status: 'success' });
      setActiveStep(2);
    } catch (err) {
      toast({ title: 'Invalid OTP', description: err.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', status: 'error' });
      return;
    }
    setLoading(true);
    try {
      await AuthService.registerAlumni({
        code_id: codeData.code_id,
        email: formData.email,
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        password: formData.password,
      });
      toast({ title: 'Registration Successful', description: 'You can now login', status: 'success' });
      navigate('/login');
    } catch (err) {
      toast({ title: 'Error', description: err.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" py={10} display="flex" alignItems="center" justifyContent="center">
      <Container maxW="lg">
        <VStack spacing={8} align="stretch">
          <VStack spacing={2}>
            <Heading textAlign="center" size="lg" color="#20343c">Alumni Registration</Heading>
            <Text textAlign="center" color="gray.500">Join the alumni network</Text>
          </VStack>

          <Stepper index={activeStep} colorScheme="yellow" size="sm">
            {steps.map((step, index) => (
              <Step key={index}>
                <StepIndicator>
                  <StepStatus complete={<StepIcon />} incomplete={<StepNumber />} active={<StepNumber />} />
                </StepIndicator>
                <Box flexShrink="0" display={{ base: 'none', md: 'block' }}>
                  <StepTitle>{step.title}</StepTitle>
                </Box>
                <StepSeparator />
              </Step>
            ))}
          </Stepper>

          <Box p={8} borderRadius="xl" bg="white" shadow="xl" borderTop="4px solid #20343c">
            {activeStep === 0 && (
              <VStack spacing={6} align="stretch">
                <Text fontSize="md" color="gray.600" textAlign="center">Enter your registration code to get started</Text>
                <FormControl isRequired>
                  <FormLabel color="gray.700" fontWeight="bold">Registration Code</FormLabel>
                  <Input
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder="e.g. ALUM-2023-XYZ"
                    size="lg"
                    focusBorderColor="#d4a960"
                    bg="gray.50"
                  />
                </FormControl>
                <Button bg="#20343c" color="white" onClick={handleValidateCode} isLoading={loading} size="lg" mt={2} _hover={{ bg: '#1a2b32' }}>
                  Validate Code
                </Button>
              </VStack>
            )}

            {activeStep === 1 && (
              <VStack spacing={6} align="stretch">
                <Text fontSize="md" color="gray.600" textAlign="center">Verify your email address</Text>
                <FormControl isRequired>
                  <FormLabel color="gray.700" fontWeight="bold">Email Address</FormLabel>
                  <InputGroup size="lg">
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your.email@example.com"
                      focusBorderColor="#d4a960"
                      bg="gray.50"
                      pr="8.5rem"
                    />
                    <InputRightElement width="8.5rem" mr={1}>
                      <Button
                        h="2rem"
                        size="sm"
                        onClick={handleSendOtp}
                        isLoading={loading}
                        isDisabled={!formData.email || resendTimer > 0}
                        colorScheme="yellow"
                        variant={resendTimer > 0 ? 'outline' : 'solid'}
                        bg={resendTimer > 0 ? 'transparent' : '#d4a960'}
                        color={resendTimer > 0 ? 'gray.500' : 'white'}
                        _hover={resendTimer > 0 ? {} : { bg: '#bfa140' }}
                        fontWeight="bold"
                        fontSize="xs"
                        width="100%"
                      >
                        {resendTimer > 0 ? `Resend in ${resendTimer}s` : otpSent ? 'Resend OTP' : 'Send OTP'}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel color="gray.700" fontWeight="bold">Enter OTP</FormLabel>
                  <Input
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    placeholder="Enter 6-digit OTP"
                    size="lg"
                    focusBorderColor="#d4a960"
                    bg="gray.50"
                    textAlign="center"
                    letterSpacing="0.5em"
                    fontWeight="bold"
                    maxLength={6}
                  />
                  {otpSent && (
                    <Text fontSize="sm" color="green.600" mt={2} textAlign="center" fontWeight="medium">
                      ✓ OTP sent to {formData.email}
                    </Text>
                  )}
                </FormControl>
                <Box pt={4} display="flex" justifyContent="space-between">
                  <Button variant="ghost" onClick={() => setActiveStep(0)}>Back</Button>
                  <Button bg="#20343c" color="white" onClick={handleVerifyOtp} isLoading={loading} isDisabled={!formData.otp || !formData.email} _hover={{ bg: '#1a2b32' }}>
                    Verify & Next
                  </Button>
                </Box>
              </VStack>
            )}

            {activeStep === 2 && (
              <VStack spacing={5} align="stretch">
                <Text fontSize="md" color="gray.600" textAlign="center" mb={2}>Set up your profile details</Text>
                <FormControl isRequired>
                  <FormLabel color="gray.700" fontWeight="bold">Full Name</FormLabel>
                  <Input name="full_name" value={formData.full_name} onChange={handleChange} focusBorderColor="#d4a960" bg="gray.50" />
                </FormControl>
                <FormControl>
                  <FormLabel color="gray.700" fontWeight="bold">Phone Number</FormLabel>
                  <Input name="phone_number" value={formData.phone_number} onChange={handleChange} focusBorderColor="#d4a960" bg="gray.50" />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel color="gray.700" fontWeight="bold">Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      focusBorderColor="#d4a960"
                      bg="gray.50"
                    />
                    <InputRightElement>
                      <IconButton variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)} icon={showPassword ? <ViewOffIcon /> : <ViewIcon />} />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel color="gray.700" fontWeight="bold">Confirm Password</FormLabel>
                  <Input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} focusBorderColor="#d4a960" bg="gray.50" />
                </FormControl>
                <Box pt={6} display="flex" justifyContent="space-between">
                  <Button variant="ghost" onClick={() => setActiveStep(1)}>Back</Button>
                  <Button bg="#20343c" color="white" onClick={handleRegister} isLoading={loading} size="lg" _hover={{ bg: '#1a2b32' }} flex={1} ml={4}>
                    Complete Registration
                  </Button>
                </Box>
              </VStack>
            )}
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default AlumniRegistration;
