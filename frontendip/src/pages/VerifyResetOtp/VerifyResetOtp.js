import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { resendResetOtp, verifyResetOtp } from '../../services/authService';
import SharedOtpVerification from '../../components/SharedOtpVerification/SharedOtpVerification';

const VerifyResetOtp = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const locationEmail = location.state && location.state.email ? location.state.email : '';
  const email = locationEmail || sessionStorage.getItem('resetPasswordEmail') || '';

  async function handleVerify(emailValue, otpValue) {
    await verifyResetOtp(emailValue, otpValue);
  }

  async function handleResend(emailValue) {
    await resendResetOtp(emailValue);
  }

  function handleVerified(emailValue) {
    navigate('/reset-password', { state: { email: emailValue } });
  }

  return (
    <SharedOtpVerification
      title="Verify Your Email"
      subtitle="Enter the 6-digit code sent to your email"
      email={email}
      verifyHandler={handleVerify}
      resendHandler={handleResend}
      onVerified={handleVerified}
      noEmailMessage="Email not found. Please register again."
      verifySuccessMessage="OTP verified successfully. Please login to continue."
      resendSuccessMessage="A new OTP has been sent to your email."
    />
  );
};

export default VerifyResetOtp;
