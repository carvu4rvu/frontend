import { Box, Button, Container, Heading, Input, Stack, Text, VStack, InputGroup, InputRightElement, Alert, AlertIcon, AlertDescription, Fade } from "@chakra-ui/react"
import { useState, useEffect } from "react"
import { keyframes } from "@emotion/react"
import { Link as RouterLink, useNavigate } from "react-router-dom"
import { Field } from "../components/ui/field"
import { useAuth } from "../context/AuthContext"
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons"
import PixelCard from "../components/PixelCard"

const shake = keyframes`
  0% { transform: translateX(0); }
  20% { transform: translateX(-3px); }
  40% { transform: translateX(3px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
  100% { transform: translateX(0); }
`

export const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const navigate = useNavigate()
  const { login, isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (isAuthenticated && user) {
      const role = user.role?.toLowerCase();
      if (role === 'admin' || role === 'superadmin') {
        navigate("/placement/dashboard");
      } else if (role === 'alumni') {
        navigate("/placement/alumni-dashboard");
      } else if (role === 'company') {
        navigate("/company/dashboard");
      } else if (role === 'management') {
        navigate("/management/dashboard");
      } else if (role === 'dean') {
        navigate("/dean/dashboard");
      } else if (role === 'parent') {
        navigate("/parent/dashboard");
      } else {
        navigate("/student-dashboard");
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleLogin = async () => {
    try {
      setErrorMessage("")
      const result = await login(email, password);
      
      if (result && result.success) {
        const user = result.user;
        const role = user.role?.toLowerCase();
        // Navigate based on role (case-insensitive)
        if (role === 'admin' || role === 'superadmin') {
          navigate("/placement/dashboard");
        } else if (role === 'alumni') {
          navigate("/placement/alumni-dashboard");
        } else if (role === 'company') {
          navigate("/company/dashboard");
        } else if (role === 'management') {
          navigate("/management/dashboard");
        } else if (role === 'dean') {
          navigate("/dean/dashboard");
        } else if (role === 'parent') {
          navigate("/parent/dashboard");
        } else {
          navigate("/student-dashboard", { state: { isFirstLogin: true } });
        }
      } else {
        setErrorMessage(
          result?.message ||
            "Invalid Credentials. Please check your ID/Email and Password."
        )
      }
    } catch (error) {
      console.error("Login error:", error)
      setErrorMessage("An error occurred during login. Please try again.")
    }
  }

  useEffect(() => {
    if (!errorMessage) {
      return
    }

    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(200)
      } catch {
      }
    }

    const timeoutId = setTimeout(() => {
      setErrorMessage("")
    }, 1500)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [errorMessage])

  return (
    <Box py={20} bg="gray.50" minH="80vh" display="flex" alignItems="center" justifyContent="center">
      <Container maxW="sm" bg="white" p={8} borderRadius="xl" shadow="lg" borderTopWidth="4px" borderTopColor="#20343c">
        <VStack gap={6} align="stretch">
          <Heading textAlign="center" color="#20343c">
            Login
          </Heading>
          <Fade in={!!errorMessage} unmountOnExit>
            <Alert
              status="error"
              variant="subtle"
              borderRadius="md"
              bg="red.50"
              color="red.800"
              borderLeftWidth="4px"
              borderLeftColor="red.400"
              animation={`${shake} 0.35s ease`}
            >
              <AlertIcon />
              <AlertDescription fontSize="sm">
                {errorMessage}
              </AlertDescription>
            </Alert>
          </Fade>

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <Stack gap={4}>
            <Field label="Email">
              <Input 
                type="email"
                placeholder="Enter your Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                _focus={{ borderColor: "#d4a960", boxShadow: "0 0 0 1px #d4a960" }}
                color="gray.700"
                _placeholder={{ color: 'gray.500' }}
              />
            </Field>
            <Field label="Password">
              <InputGroup>
                <Input 
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  _focus={{ borderColor: "#d4a960", boxShadow: "0 0 0 1px #d4a960" }}
                  color="gray.700"
                  _placeholder={{ color: 'gray.500' }}
                />
                <InputRightElement h={'full'}>
                  <Button
                    variant={'ghost'}
                    onClick={() => setShowPassword((showPassword) => !showPassword)}
                  >
                    {showPassword ? <ViewIcon color="gray.500" /> : <ViewOffIcon color="gray.500" />}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </Field>

            <Box textAlign="right" width="full">
              <RouterLink to="/forgot-password" style={{ color: "#d4a960", fontSize: "0.875rem", fontWeight: "500" }}>
                Forgot Password?
              </RouterLink>
            </Box>

            <PixelCard 
              variant="yellow" 
              onClick={handleLogin}
              style={{ 
                backgroundColor: "#20343c", 
                color: "white", 
                width: "100%", 
                height: "48px", 
                borderRadius: "0.375rem",
                fontWeight: "600",
                fontSize: "1rem"
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleLogin();
                }
              }}
            >
              Login
            </PixelCard>
          </Stack>
          </form>

          <Text textAlign="center" fontSize="sm" color="gray.600">
            Don&apos;t have an account?{" "}
            <RouterLink to="/register" style={{ color: "#d4a960", fontWeight: "bold" }}>
              Register here
            </RouterLink>
          </Text>
        </VStack>
      </Container>
    </Box>
  )
}
