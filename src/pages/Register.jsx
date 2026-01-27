import { useState, useEffect } from "react"
import { 
  Box, Container, VStack, Heading, Input, Button, Text, 
  Flex, InputGroup, InputRightElement, IconButton, useToast,
  Stack, Fade, Alert, AlertIcon, AlertDescription
} from "@chakra-ui/react"
import { Link as RouterLink, useNavigate } from "react-router-dom"
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons"
import { useAuth } from "../context/AuthContext"
import { apiFetch } from "../services/api"
import PixelCard from "../components/PixelCard"
import { Field } from "../components/ui/field"

const Register = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (user) navigate('/student-dashboard')
  }, [user, navigate])

  const handleInitiate = async () => {
    setErrorMessage("")
    // if (!email.endsWith('@rvu.edu.in')) { 
    //    setErrorMessage("Please use your college email ending with @rvu.edu.in")
    //    return
    // }
    if (!email) {
      setErrorMessage("Email is required")
      return
    }
    
    setLoading(true)
    try {
      const { data } = await apiFetch('/auth/register/initiate', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      toast({ 
        title: "OTP Sent", 
        description: data.message, 
        status: "success",
        duration: 3000,
        isClosable: true
      })
      setStep(2)
    } catch (error) {
      setErrorMessage(error.message || "Failed to initiate registration")
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setErrorMessage("")
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match")
      return
    }
    if (password.length < 6) {
        setErrorMessage("Password must be at least 6 characters long")
        return
    }
    
    setLoading(true)
    try {
      const { data } = await apiFetch('/auth/register/verify', {
        method: 'POST',
        body: JSON.stringify({ email, otp, password }),
      })
      toast({ 
        title: "Registration Successful", 
        description: data.message, 
        status: "success",
        duration: 3000,
        isClosable: true
      })
      navigate('/login')
    } catch (error) {
      setErrorMessage(error.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box minH="calc(100vh - 80px)" bg="gray.50" py={10} px={4} display="flex" alignItems="center" justifyContent="center">
      <Container maxW="lg">
        <PixelCard variant="default" gap={10} speed={40} colors="#d4a960,#e2b975,#f0c98a">
          <VStack spacing={8} w="full" bg="white" p={8} borderRadius="xl" boxShadow="xl">
            <VStack spacing={2} textAlign="center">
              <Heading size="xl" color="brand.dark">Student Registration</Heading>
              <Text color="gray.500">
                {step === 1 ? "Enter your college email to verify identity" : "Verify OTP and set your password"}
              </Text>
            </VStack>

            {errorMessage && (
              <Fade in={true}>
                <Alert status="error" borderRadius="md" variant="subtle">
                  <AlertIcon />
                  <AlertDescription fontSize="sm">{errorMessage}</AlertDescription>
                </Alert>
              </Fade>
            )}
            
            <VStack spacing={5} w="full">
              {step === 1 ? (
                <>
                  <Field label="College Email">
                    <Input 
                      placeholder="e.g. name.usn@rvu.edu.in" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      size="lg"
                      borderRadius="md"
                      focusBorderColor="brand.gold"
                      _hover={{ borderColor: "brand.gold" }}
                    />
                  </Field>
                  <Button 
                    w="full" 
                    bg="brand.dark"
                    color="white"
                    size="lg"
                    onClick={handleInitiate}
                    isLoading={loading}
                    _hover={{ bg: "gray.800", transform: "translateY(-2px)" }}
                    transition="all 0.2s"
                    boxShadow="md"
                  >
                    Send OTP
                  </Button>
                </>
              ) : (
                <>
                  <Field label="Enter OTP">
                    <Input 
                      placeholder="6-digit OTP" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      size="lg"
                      borderRadius="md"
                      focusBorderColor="brand.gold"
                      letterSpacing="widest"
                      textAlign="center"
                    />
                  </Field>
                  
                  <Field label="Create Password">
                    <InputGroup size="lg">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        borderRadius="md"
                        focusBorderColor="brand.gold"
                      />
                      <InputRightElement width="4.5rem">
                        <IconButton
                          h="1.75rem"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                          icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                          variant="ghost"
                        />
                      </InputRightElement>
                    </InputGroup>
                  </Field>

                  <Field label="Confirm Password">
                    <Input 
                      type="password"
                      placeholder="Re-enter password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      size="lg"
                      borderRadius="md"
                      focusBorderColor="brand.gold"
                    />
                  </Field>

                  <Stack w="full" spacing={3}>
                    <Button 
                      w="full" 
                      bg="brand.gold"
                      color="white" 
                      size="lg"
                      onClick={handleVerify}
                      isLoading={loading}
                      _hover={{ bg: "#c39850", transform: "translateY(-2px)" }}
                      transition="all 0.2s"
                      boxShadow="md"
                    >
                      Complete Registration
                    </Button>
                    <Button 
                      w="full" 
                      variant="ghost" 
                      onClick={() => setStep(1)}
                      size="md"
                      color="gray.500"
                    >
                      Back to Email
                    </Button>
                  </Stack>
                </>
              )}
            </VStack>

            <Box w="full" pt={4} borderTop="1px solid" borderColor="gray.100" textAlign="center">
              <Text fontSize="sm" color="gray.600">
                Already registered?{" "}
                <Button 
                  as={RouterLink} 
                  to="/login" 
                  variant="link" 
                  color="brand.gold" 
                  fontWeight="bold"
                >
                  Login here
                </Button>
              </Text>
            </Box>
          </VStack>
        </PixelCard>
      </Container>
    </Box>
  )
}

export default Register
