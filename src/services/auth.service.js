import { apiFetch } from './api';

/**
 * Alumni registration flow: validate code → send OTP → verify OTP → register
 */
export const AuthService = {
  validateAlumniCode: async (code) => {
    const res = await apiFetch('/auth/alumni/validate-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    return res.data;
  },

  sendAlumniOtp: async (email, code_id) => {
    const res = await apiFetch('/auth/alumni/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code_id }),
    });
    return res.data;
  },

  verifyAlumniOtp: async (email, otp) => {
    const res = await apiFetch('/auth/alumni/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
    return res.data;
  },

  registerAlumni: async (data) => {
    const res = await apiFetch('/auth/alumni/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },
};

export default AuthService;
