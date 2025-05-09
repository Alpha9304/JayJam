"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useLogin } from "@/hooks/auth/use-login";
import Link from "next/link";
import Head from "next/head";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { trpc } from "@/trpc/client";

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { handleLogin, mutation: loginMutation } = useLogin();

  //if user has a valid session, go into a logged-in page (class-groups)
  const placeholder = "";
    const query = trpc.auth.validateSession.useQuery({placeholder}, {
           retry: false,
           gcTime: 0,
    });
  
  useEffect(() => {
    if(query.isSuccess && query.data?.success === true) {
      router.push('/class-groups');
    }
  }, [query.isSuccess])


  const handleUserLogin = async () => {
    if (!email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    // Redirect to /calendar only if login is successful
    const response = await handleLogin({ email, password });
    if (response.success) {
      router.push("/calendar");
    }
  };

  return (
    <div>
      <Head>
        <title>Sign In | JayJam ClassGroups</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap" rel="stylesheet" />
      </Head>

      <style jsx global>{`
        * {
          font-family: 'Orbitron', sans-serif;
        }

        @keyframes breathing {
          0% { background-position: 50% 50%; filter: brightness(1); }
          25% { background-position: 75% 25%; filter: brightness(1.2); }
          50% { background-position: 100% 50%; filter: brightness(1); }
          75% { background-position: 75% 75%; filter: brightness(1.2); }
          100% { background-position: 50% 50%; filter: brightness(1); }
        }
      `}</style>

      {/* Background with breathing effect */}
      <div
        className="flex flex-col justify-center min-h-screen px-4 relative"
        style={{
          background: "linear-gradient(45deg, #99ffff, rgb(148, 214, 255),rgb(136, 194, 252),rgb(23, 103, 252), rgb(23, 165, 253), rgb(120, 188, 255))",
          backgroundSize: "400% 400%",
          animation: "breathing 20s ease-in-out infinite",
          boxShadow: "0px 0px 40px rgba(153, 204, 255, 0.5)", 
        }}
      >


        {/* Header Section */}
        <div className="relative top-32 text-center">
          <div className = "flex flex-col justify-center align-center items-center">
            <img src="./JayJamLogo.png" alt="JayJam Logo" className = "h-28 w-28"/>
            <div className="flex">
              <h1 className="text-4xl md:text-5xl pb-3 font-extrabold text-white drop-shadow-lg">
                JayJam
              </h1>
            </div>
          </div>
          <p className="text-lg md:text-xl font-medium text-white">
            Automatically join group chats with your classmates and enjoy streamlined study scheduling!
          </p>
        </div>

        {/* Login Box (Static Size) */}
        <div className="m-auto mt-60 bg-white bg-opacity-80 backdrop-blur-lg p-8 rounded-xl shadow-2xl border border-gray-300 w-full max-w-md">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">Sign In</h2>

          {/* Email Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-black"
              data-testid="login_email_input"
            />
          </div>

          {/* Password Input with Eye Button */}
          <div className="mb-4 relative">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm pr-10 text-black"
                data-testid="login_password_input"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <Button
            className="w-full py-3 rounded-md bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-lg text-white text-lg font-bold tracking-wide"
            onClick={handleUserLogin}
            disabled={loginMutation.isPending}
            data-testid="login_btn"
          >
            {loginMutation.isPending ? "Logging in..." : "Login"}
          </Button>

          {/* Links */}
          <p className="mt-4 text-sm text-center text-gray-700">
            Don&quot;t have an account?{" "}
            <Link href={`/sign-up`} className="text-indigo-600 hover:underline">
              Sign Up
            </Link>

          </p>
          <p className="mt-2 text-sm text-center text-gray-700">
            Forgot your password?{" "}
            <Link href="/reset" className="text-indigo-600 hover:underline">Reset Password</Link>
          </p>
        </div>

        <div className="flex justify-end text-right text-gray-200 text-xs mt-2 tracking-wide bg-gradient-to-r from-cyan-300 to-blue-400 text-transparent bg-clip-text">
          <a href="https://www.flaticon.com/free-icons/blue-jay" title="blue jay icons" className="text-xs">Blue jay icons created by Freepik - Flaticon, </a>
          <a href="https://www.flaticon.com/free-icons/pencil" title="pencil icons" className="text-xs">Pencil icons created by Freepik - Flaticon, </a>
          <a href="https://www.flaticon.com/free-icons/musical-note" title="musical note icons" className="text-xs">Musical note icons created by Freepik - Flaticon</a>
        </div>
      </div>
    </div>
  );
}
