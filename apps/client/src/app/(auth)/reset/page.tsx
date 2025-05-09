"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Head from "next/head";
import { TRPCClientError } from "@trpc/client";
import { useSendResetCode } from "@/hooks/verify/useSendResetCode";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useReset } from "@/hooks/auth/use-reset";
import { useVerifyReset } from "@/hooks/verify/useVerifyReset";

export default function ResetPage() {

  //here, need to add place to enter password and add reset password call logic; will not useVerifyCode...

  const router = useRouter();


  
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";

  //email
  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState(Array(6).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(6).fill(null));

  //verify
  const { sendCode, timer, isPending: isSending } = useSendResetCode();
  const { verify, isPending: isVerifying } = useVerifyReset();
  const [hasSent, setHasSent] = useState(!!emailFromQuery); // If email is passed, assume code was sent
  const [hasVerified, setHasVerified] = useState(false);


  //password
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const { handleReset } = useReset();
  

  // Validate password strength
  const validatePasswordStrength = (password: string) => {
    if (password.length < 8 || password.length > 20) {
      setPasswordStrength("Password must be 8-20 characters long.");
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setPasswordStrength("Must include at least one uppercase letter.");
      return false;
    }
    if (!/[a-z]/.test(password)) {
      setPasswordStrength("Must include at least one lowercase letter.");
      return false;
    }
    if (!/[0-9]/.test(password)) {
      setPasswordStrength("Must include at least one number.");
      return false;
    }
    if (!/[!@#$%^&*]/.test(password)) {
      setPasswordStrength("Must include at least one special character (!@#$%^&*).");
      return false;
    }
    setPasswordStrength("Strong password.");
    return true;
  };

  // Handle digit input for verification code
  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.substring(value.length - 1);
    setCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace to focus previous input
  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Enforce pasting only numbers
  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedText = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6); // Extract only digits
    const newCode = pastedText.split("").concat(Array(6).fill("")).slice(0, 6);
    setCode(newCode);
  };

  // Handle sending verification email
  const handleSendReset = async () => {
    await sendCode(email);
    setHasSent(true);
  };

  //handle code verification process
  const handleVerifyCode = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code.");
      return;
    }
  
    try {

      const success = await verify(fullCode, email);
  
      if (success) {
        setHasVerified(true);
      } else {
        toast.error("Invalid or expired verification code. Please try again.");
      }
    } catch (error: unknown) {
      // Handle specific backend errors
      if (error instanceof TRPCClientError) {
        if (error.data?.code === "UNAUTHORIZED") {
          toast.error(error.message || "Session expired. Please sign up again.");
          router.push("/sign-up"); // Redirect to sign-up if session is invalid
        }
      } else {
        toast.error("An error occurred during verification. Please try again.");
        console.error(error);
      }
    }
  };

  // Handle password reset process
    const handlePasswordReset = async () => {
      if (!password || !confirmPassword) {
        toast.error("Please enter a password.");
        return;
      }
    
      if (!validatePasswordStrength(password)) {
        toast.error("Password does not meet security requirements.");
        return;
      }
      
      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
    
      try {
        const response: { success: boolean } = await handleReset({ email, password, confirm: confirmPassword });
    
        if (response?.success) { // Ensure registration was successful
          toast.success("Password reset successful, redirecting to login");
          router.push(`/`);
        } else {
          toast.error("Registration failed. Please try again.");
        }
      } catch (error) {
        toast.error("An error occurred when trying to reset your password");
        console.error("Registration error", error)
      }
    };
  
  
  

  return (
    <>
      <Head>
        <title>Reset Password | JayJam</title>
      </Head>

      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-semibold text-center text-gray-900 mb-4">Reset Password</h2>

          {/* Email Input */}
          {!hasVerified && (<div className="mb-4" data-testid="email_input">
            <label className="block text-sm font-medium text-gray-600">JHU Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your JHU email"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={hasSent} // Prevent email changes after sending code
              data-testid="email_input_field"
            />
          </div>)}

          {/* Send Verification Code Button */}
          {!hasVerified && !hasSent ? (
            <Button
              className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-all duration-200"
              onClick={handleSendReset}
              disabled={isSending}
              data-testid="send_code_ready"
            >
              {isSending ? "Sending..." : "Send Verification Code"}
            </Button>
          ) : (!hasVerified &&
            ( <Button
              className={`w-full p-2 mt-2 rounded-md transition-all duration-200 ${
                timer > 0 ? "bg-gray-400 cursor-not-allowed text-white" : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
              onClick={handleSendReset}
              disabled={timer > 0}
              data-testid="send_code_wait"
            >
              {timer > 0 ? `Resend in ${timer}s` : "Send Verification Code"}
            </Button>
          ))}
          {/* Notification to Check Junk/Spam Folder */}
          {!hasVerified && hasSent && (
            <p className="mt-2 text-sm text-center text-gray-600" data-testid="check_spam">
              If you don&quot;t see the email, check your <span className="font-semibold">junk/spam folder</span>.
            </p>
          )}

          {/* 6-Digit Verification Code Input */}
          {!hasVerified && (
            <div className="mt-4" data-testid="code_input">
              <label className="block text-sm font-medium text-gray-600">Verification Code</label>
              <div className="flex justify-center gap-2 mt-2">
                {code.map((digit, index) => (
                  <Input
                    key={index}
                    type="text"
                    value={digit}
                    maxLength={1}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    data-testid="code_input_field"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Verify Code Button */}
          {!hasVerified && (
            <Button
              className={`w-full p-2 mt-4 rounded-md transition-all duration-200 ${
                isVerifying ? "bg-gray-400 cursor-not-allowed text-white" : "bg-blue-500 text-white hover:bg-blue-600"
              }`}
              onClick={handleVerifyCode}
              disabled={isVerifying}
              data-testid="verify_code_btn"
            >
              {isVerifying ? "Verifying..." : "Verify Code"}
            </Button>
          )}


          {/* Password Input */}
          {hasVerified && (
          <div className="mb-4 relative" data-testid="password_input">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  validatePasswordStrength(e.target.value);
                }}
                placeholder="Enter your password"
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm pr-10"
                data-testid="password_input_field"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>
            {/* Password Strength Indicator */}
            <p className="mt-1 text-sm text-gray-600">{passwordStrength}</p>
          </div>)}

          {/* Confirm Password Input */}
          {hasVerified && (
          <div className="mb-4 relative" data-testid="confirm_password_input">
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm pr-10"
                data-testid="confirm_password_input_field"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>
          </div>)}

          {/* Set New Password Button */}
          {hasVerified && (
            <Button
              className={`w-full p-2 mt-4 rounded-md transition-all duration-200 bg-blue-500 text-white hover:bg-blue-600`}
              onClick={handlePasswordReset}
              data-testid="reset_btn"
            >
              Set New Password
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
