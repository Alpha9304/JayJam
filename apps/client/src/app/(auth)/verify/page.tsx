"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSendVerificationCode } from "@/hooks/verify/useSendVerificationCode";
import { useVerifyCode } from "@/hooks/verify/useVerifyCode";
import Link from "next/link";
import Head from "next/head";
import { TRPCClientError } from "@trpc/client";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState(Array(6).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(6).fill(null));

  const { sendCode, timer, isPending: isSending } = useSendVerificationCode();
  const { verify, isPending: isVerifying } = useVerifyCode();
  const [hasSent, setHasSent] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const initialSendRef = useRef(false);

  // Use effect for initial send only
  useEffect(() => {
    if (emailFromQuery && !hasInitialized && !hasSent && !timer && !initialSendRef.current) {
      initialSendRef.current = true;
      setHasInitialized(true);
      const initialSend = async () => {
        try {
          await sendCode(emailFromQuery);
          setHasSent(true);
        } catch (error) {
          console.error('Failed to send verification code:', error);
          toast.error('Failed to send verification code. Please try again.');
        }
      };
      initialSend();
    }
  }, [emailFromQuery, hasInitialized, hasSent, sendCode, timer]);

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
  const handleSendCode = async () => {
    if (timer > 0) {
      toast.error(`Please wait ${timer}s before resending.`);
      return;
    }
    try {
      await sendCode(email);
      setHasSent(true);
      toast.success('Verification code sent!');
    } catch (error) {
      console.error('Failed to send verification code:', error);
      toast.error('Failed to send verification code. Please try again.');
    }
  };

  const handleVerifyCode = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code.");
      return;
    }

    try {
      // const response = (await verify(fullCode)) as unknown as { success: boolean }; // Send request to backend

      const success = await verify(fullCode)

      if (success) {
        toast.success("Verification successful! Redirecting to calendar...");
        router.push("/calendar"); // Redirect only if success is true
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
      }
    }
  };




  return (
    <>
      <Head>
        <title>Email Verification | JayJam</title>
      </Head>

      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl font-semibold text-center text-gray-900 mb-4">Email Verification</h2>

          {/* Email Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600">JHU Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your JHU email"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              disabled={hasSent} // Prevent email changes after sending code
            />
          </div>

          {/* Send Verification Code Button */}
          {!hasSent ? (
            <Button
              className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition-all duration-200"
              onClick={handleSendCode}
              disabled={isSending}
            >
              {isSending ? "Sending..." : "Send Verification Code"}
            </Button>
          ) : (
            <Button
              className={`w-full p-2 mt-2 rounded-md transition-all duration-200 ${timer > 0 ? "bg-gray-400 cursor-not-allowed text-white" : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              onClick={handleSendCode}
              disabled={timer > 0}
            >
              {timer > 0 ? `Resend in ${timer}s` : "Send Verification Code"}
            </Button>
          )}
          {/* Notification to Check Junk/Spam Folder */}
          {hasSent && (
            <p className="mt-2 text-sm text-center text-gray-600">
              If you don&quot;t see the email, check your <span className="font-semibold">junk/spam folder</span>.
            </p>
          )}

          {/* 6-Digit Verification Code Input */}
          {hasSent && (
            <div className="mt-4">
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
                  />
                ))}
              </div>
            </div>
          )}

          {/* Verify Code Button */}
          {hasSent && (
            <Button
              className={`w-full p-2 mt-4 rounded-md transition-all duration-200 ${isVerifying ? "bg-gray-400 cursor-not-allowed text-white" : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              onClick={handleVerifyCode}
              disabled={isVerifying}
            >
              {isVerifying ? "Verifying..." : "Verify Code"}
            </Button>
          )}

          {/* Go back to Log In Link*/}
          <p className="mt-4 text-sm text-center text-gray-700">
            If you have an account,{" "}
            <Link href="/" className="text-blue-600 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}