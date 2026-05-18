import { useState, useEffect, useCallback } from "react"
import {
  Box,
  Container,
  VStack,
  Heading,
  Input,
  Button,
  Text,
  InputGroup,
  InputRightElement,
  useToast,
} from "@chakra-ui/react"
import { Link as RouterLink, useNavigate } from "react-router-dom"
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons"
import { apiFetch } from "../services/api"
import { Field } from "../components/ui/field"
import PixelCard from "../components/PixelCard"

const ACCENT = "#d4a960"
const DARK = "#20343c"
const RESEND_COOLDOWN_SECONDS = 30

const ForgotPassword = () => {
  const navigate = useNavigate()
  const toast = useToast()

  const [step, setStep] = useState(1)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const handleInitiate = useCallback(async () => {
    if (!email?.trim()) {
      toast({ title: "Email is required", status: "error" })
      return
    }
    if (loading) return
    setLoading(true)
    try {
      const { data } = await apiFetch("/auth/forgot-password/initiate", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      })
      toast({ title: data?.message ?? "OTP sent", status: "success" })
      setStep(2)
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (error) {
      toast({ title: error.message ?? "Failed to send OTP", status: "error" })
    } finally {
      setLoading(false)
    }
  }, [email, toast, loading])

  useEffect(() => {
    if (step !== 2 || resendCooldown <= 0) return
    const t = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(t)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [step, resendCooldown])

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return
    setLoading(true)
    try {
      const { data } = await apiFetch("/auth/forgot-password/initiate", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      })
      toast({ title: data?.message ?? "OTP resent", status: "success" })
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (error) {
      toast({ title: error.message ?? "Failed to resend OTP", status: "error" })
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (!newPassword?.trim() || !otp?.trim()) {
      toast({ title: "OTP and new password are required", status: "error" })
      return
    }
    if (loading) return
    setLoading(true)
    try {
      const { data } = await apiFetch("/auth/forgot-password/verify", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), otp: otp.trim(), newPassword: newPassword.trim() }),
      })
      toast({ title: data?.message ?? "Password reset", status: "success" })
      navigate("/login")
    } catch (error) {
      toast({ title: error.message ?? "Verification failed", status: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box py={20} bg="gray.50" minH="80vh" display="flex" alignItems="center" justifyContent="center">
      <Container maxW="sm" bg="white" p={8} borderRadius="xl" shadow="lg" borderTopWidth="4px" borderTopColor={DARK}>
        <VStack gap={6} align="stretch">
          <Heading textAlign="center" color={DARK} size="xl">
            Reset Password
          </Heading>

          {step === 1 ? (
            <>
              <Text color="gray.600" textAlign="center" fontSize="sm">
                Enter your college email to receive an OTP.
              </Text>
              <Field label="College Email">
                <Input
                  type="email"
                  placeholder="Enter your college email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                  color="gray.700"
                  _placeholder={{ color: "gray.500" }}
                />
              </Field>
              <PixelCard
                variant="yellow"
                onClick={handleInitiate}
                style={{
                  backgroundColor: DARK,
                  color: "white",
                  width: "100%",
                  height: "48px",
                  borderRadius: "0.375rem",
                  fontWeight: "600",
                  fontSize: "1rem",
                  transition: "all 0.18s ease-out",
                  boxShadow: loading ? "0 0 0 1px #d4a960, 0 10px 20px rgba(0,0,0,0.25)" : "none",
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleInitiate()}
              >
                {loading ? "Sending…" : "Send OTP"}
              </PixelCard>
            </>
          ) : (
            <>
              <Text color="gray.600" textAlign="center" fontSize="sm">
                Enter the OTP sent to <strong>{email}</strong> and your new password.
              </Text>
              <Field label="OTP">
                <Input
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                  color="gray.700"
                  _placeholder={{ color: "gray.500" }}
                />
              </Field>
              <Field label="New Password">
                <InputGroup>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    _focus={{ borderColor: ACCENT, boxShadow: `0 0 0 1px ${ACCENT}` }}
                    color="gray.700"
                    _placeholder={{ color: "gray.500" }}
                  />
                  <InputRightElement h="full">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <ViewOffIcon color="gray.500" /> : <ViewIcon color="gray.500" />}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </Field>

              <Button
                w="full"
                size="sm"
                variant="outline"
                colorScheme="gray"
                isDisabled={resendCooldown > 0}
                onClick={handleResendOtp}
                isLoading={loading}
                _hover={resendCooldown === 0 ? { borderColor: ACCENT, color: ACCENT } : undefined}
              >
                {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : "Resend OTP"}
              </Button>

              <PixelCard
                variant="yellow"
                onClick={handleVerify}
                style={{
                  backgroundColor: DARK,
                  color: "white",
                  width: "100%",
                  height: "48px",
                  borderRadius: "0.375rem",
                  fontWeight: "600",
                  fontSize: "1rem",
                  transition: "all 0.18s ease-out",
                  boxShadow: loading ? "0 0 0 1px #d4a960, 0 10px 20px rgba(0,0,0,0.25)" : "none",
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleVerify()}
              >
                {loading ? "Resetting…" : "Reset Password"}
              </PixelCard>

              <Button
                w="full"
                variant="ghost"
                color="gray.600"
                size="sm"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
            </>
          )}

          <Text textAlign="center" fontSize="sm" color="gray.600">
            Remember your password?{" "}
            <RouterLink to="/login" style={{ color: ACCENT, fontWeight: "600" }}>
              Login here
            </RouterLink>
          </Text>
        </VStack>
      </Container>
    </Box>
  )
}

export default ForgotPassword
