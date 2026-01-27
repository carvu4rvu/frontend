import { useState } from "react"
import { 
  Box, Container, VStack, Heading, Input, Button, Text, 
  InputGroup, InputRightElement, IconButton, useToast
} from "@chakra-ui/react"
import { Link as RouterLink, useNavigate } from "react-router-dom"
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons"
import { apiFetch } from "../services/api"

const ForgotPassword = () => {
  const navigate = useNavigate()
  const toast = useToast()
  
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleInitiate = async () => {
    if (!email) {
        toast({ title: "Email is required", status: "error" })
        return
    }
    setLoading(true)
    try {
      const { data } = await apiFetch('/auth/forgot-password/initiate', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      toast({ title: data.message, status: "success" })
      setStep(2)
    } catch (error) {
      toast({ title: error.message, status: "error" })
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!newPassword || !otp) {
        toast({ title: "OTP and New Password are required", status: "error" })
        return
    }
    setLoading(true)
    try {
      const { data } = await apiFetch('/auth/forgot-password/verify', {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword }),
      })
      toast({ title: data.message, status: "success" })
      navigate('/login')
    } catch (error) {
      toast({ title: error.message, status: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box minH="100vh" bg="#1a202c" py={20} px={4}>
      <Container maxW="md">
        <VStack spacing={8} align="stretch">
          <Heading color="white" textAlign="center" size="xl">
            Reset Password
          </Heading>
          
          <Box bg="gray.800" p={8} borderRadius="xl" shadow="dark-lg" border="1px solid" borderColor="gray.700">
            <VStack spacing={6}>
              {step === 1 ? (
                <>
                  <Text color="gray.400" textAlign="center">
                    Enter your college email to receive an OTP.
                  </Text>
                  <Input 
                    placeholder="College Email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    bg="gray.700"
                    color="white"
                    border="none"
                  />
                  <Button 
                    w="full" 
                    colorScheme="blue" 
                    onClick={handleInitiate}
                    isLoading={loading}
                  >
                    Send OTP
                  </Button>
                </>
              ) : (
                <>
                  <Text color="gray.400" textAlign="center">
                    Enter the OTP sent to {email} and your new password.
                  </Text>
                  <Input 
                    placeholder="OTP" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    bg="gray.700"
                    color="white"
                    border="none"
                  />
                  <InputGroup>
                    <Input 
                      type={showPassword ? "text" : "password"}
                      placeholder="New Password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      bg="gray.700"
                      color="white"
                      border="none"
                    />
                    <InputRightElement>
                      <IconButton
                        icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        variant="ghost"
                        color="gray.400"
                        onClick={() => setShowPassword(!showPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                  <Button 
                    w="full" 
                    colorScheme="green" 
                    onClick={handleVerify}
                    isLoading={loading}
                  >
                    Reset Password
                  </Button>
                  <Button 
                    w="full" 
                    variant="ghost" 
                    color="gray.400" 
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                </>
              )}
            </VStack>
          </Box>
          
          <Text textAlign="center" color="gray.500">
            Remember your password?{" "}
            <Button as={RouterLink} to="/login" variant="link" color="blue.400">
              Login here
            </Button>
          </Text>
        </VStack>
      </Container>
    </Box>
  )
}

export default ForgotPassword
