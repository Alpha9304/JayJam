"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRegister } from "@/hooks/auth/use-register";
import useCheckName from "@/hooks/profile/use-check-name";
import Link from "next/link";
import Head from "next/head";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { trpc } from "@/trpc/client";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState(emailFromQuery);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");

  const { mutation: registerRes, handleRegister } = useRegister();
  const { checkName } = useCheckName();

  const placeholder = "";
  const query = trpc.auth.validateSession.useQuery({ placeholder }, {
    retry: false,
    gcTime: 0,
  });

  useEffect(() => {
    if (query.isSuccess && query.data?.success === true) {
      router.push('/class-groups');
    }
  }, [query.isSuccess]);

  useEffect(() => {}, [emailFromQuery, router]);

  const isValidJHUEmail = (email: string) => {
    return /^[a-zA-Z0-9._%+-]+@jh(u|).edu$/.test(email);
  };

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

  const handleUserSignup = async () => {
    if (!await checkName(name)) {
      return;
    }
    if (!isValidJHUEmail(email)) {
      toast.error("Please enter a valid JHU email (e.g., example@jhu.edu or example@jh.edu).");
      return;
    }
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
      const response: { success: boolean } = await handleRegister({ name, email, password, confirm: confirmPassword });
      if (response?.success) {
        toast.success("Sign-up successful! Redirecting to verification...");
        router.push(`/verify?email=${encodeURIComponent(email)}`);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred during registration. Please try again.");
      console.error("Registration error", error);
    }
  };

  return (
    <div>
      <Head>
        <title>Sign Up | JayJam ClassGroups</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        * {
          font-family: 'Orbitron', sans-serif;
        }
      `}</style>

      <div className="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-100">
        <div className="text-center mb-8">
          <h1 data-testid="signup-title" className="text-4xl font-extrabold text-gray-900">Create Your Account</h1>
          <p data-testid="signup-subtitle" className="text-lg font-medium text-gray-600 mt-2">
            Almost there to your new Class Group Scheduling Experience!
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-300 w-full max-w-md" data-testid="signup-box">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6" data-testid="signup-password-header">
            Set Your Password
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <Input
              data-testid="input-full-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">JHU Email Address</label>
            <Input
              data-testid="input-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your JHU email"
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
            />
          </div>

          <div className="mb-4 relative">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <Input
                data-testid="input-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  validatePasswordStrength(e.target.value);
                }}
                placeholder="Enter your password"
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm pr-10"
              />
              <button
                type="button"
                data-testid="toggle-password-visibility"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>
            <p data-testid="password-strength" className="mt-1 text-sm text-gray-600">{passwordStrength}</p>
          </div>

          <div className="mb-4 relative">
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <div className="relative">
              <Input
                data-testid="input-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm pr-10"
              />
              <button
                type="button"
                data-testid="toggle-confirm-password-visibility"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>
          </div>

          <Button
            data-testid="button-complete-registration"
            className="w-full py-3 rounded-md bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-lg text-white text-lg font-bold tracking-wide"
            onClick={handleUserSignup}
            disabled={registerRes.isPending}
          >
            {registerRes.isPending ? "Signing up..." : "Complete Registration"}
          </Button>

          <p className="mt-4 text-sm text-center text-gray-700">
            Already have an account?{" "}
            <Link href="/" className="text-blue-600 hover:underline" data-testid="link-login">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
