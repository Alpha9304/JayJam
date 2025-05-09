"use client";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useGetHello } from "@/hooks/test/use-get-hello";
import { UserCircleIcon, HomeIcon, GemIcon, ShieldCheckIcon } from "lucide-react";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useGetLuckyNumber } from "@/hooks/test/use-get-lucky-number";
import { useLogin } from "@/hooks/auth/use-login";


export default function HelloWorld() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { data: greeting, refetch: refetchGreeting } = useGetHello({ name });
  const { data: luckyNumber, refetch: refetchLuckyNumber, isPending } = useGetLuckyNumber();
  const { mutation: loginRes, handleLogin } = useLogin(); // Check tanstack query docs for mutation and query return types

  return (
    <>
      <div className="flex justify-center items-center w-full h-10 bg-blue-900">
        <div className="w-1/4 flex item-center">
          <Button onClick={() => router.push("/")} className="ml-1">
            <HomeIcon />
            Back to Home Page
          </Button>
        </div>
        <h1 className="w-1/2 text-center text-white text-2xl font-bold">
          This is a client component
        </h1>
        <div className="w-1/4"></div>
      </div>

      <div className="flex flex-col gap-4 justify-center items-center">
        <div className="flex flex-col gap-4 justify-center items-center">
          <h1 className="text-2xl font-bold">Say Hello To Server</h1>
          <div className="flex gap-2 justify-center items-center">
            <Input
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Button onClick={() => refetchGreeting()}>
              <UserCircleIcon />
              Say Hello To Server
            </Button>
          </div>
          <div className="bg-slate-400 flex justify-center items-center">
            {greeting && <p>{greeting.greeting}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-4 justify-center items-center">
          <h1 className="text-2xl font-bold">Lucky Number</h1>
          <div>
            <Button onClick={() => refetchLuckyNumber()}>
              <GemIcon />
              Try pick a lucky number
            </Button>
          </div>
          {isPending ? (
            <p>Waiting for your pick of lucky number</p>
          ) : luckyNumber && (
            <p>Your lucky number for today  {luckyNumber.number}</p>
          )}
        </div>

        {/* New Button to Redirect to Verify Page */}
        <div className="flex flex-col gap-4 justify-center items-center">
          <h1 className="text-2xl font-bold">Verify Your Email</h1>
          <Button onClick={() => router.push("/verify")} className="bg-purple-600 hover:bg-purple-700">
            <ShieldCheckIcon />
            Go to Verification
          </Button>
        </div>

        <div className="flex flex-col gap-4 justify-center items-center">
          <h1 className="text-2xl font-bold">Test Login</h1>
          <div className="flex flex-col gap-2">
            <label>
              Email:
              <Input onChange={(e) => setEmail(e.target.value)}/>
            </label>
            <label>
              Password:
              <Input onChange={(e) => setPassword(e.target.value)}/>
            </label>
            <Button onClick={() => handleLogin({email, password})}>
              Login
            </Button>
          </div>
          {loginRes.isSuccess && (
            <p>Success! Message from server: {loginRes.data!.message}</p>
          )}
        </div>
      </div>
    </>
  );
}
