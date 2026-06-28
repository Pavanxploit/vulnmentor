"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";
import { AcademyTopNav, Badge } from "./academy-ui";
import type { ProgressState, StudentSession, UserRole } from "@/lib/progress-types";

type AuthMode = "login" | "register";

type AuthResponse = {
  ok: boolean;
  message?: string;
  student?: StudentSession;
  progress?: ProgressState;
};

export function AuthPage({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [name, setName] = useState("Pavan Kumar");
  const [email, setEmail] = useState("pavan@example.test");
  const [password, setPassword] = useState("VulnMentor@123");
  const [usn, setUsn] = useState("4MH23IC033");
  const [role, setRole] = useState<UserRole>("student");
  const [instructorCode, setInstructorCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const isRegister = mode === "register";

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
    const payload = isRegister
      ? { name, email, password, usn, role, instructorCode }
      : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as AuthResponse;

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "Authentication failed.");
      }

      router.push(getNextPath());
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <AcademyTopNav />
      <section className="mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="max-w-2xl">
          <Badge tone="green">Account access</Badge>
          <h1 className="mt-5 text-4xl font-semibold leading-tight text-white md:text-6xl">
            {isRegister ? "Create your VulnMentor account" : "Sign in to continue learning"}
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-300">
            Real accounts keep dashboard progress, lab attempts, flag submissions, and guide-only views tied to the right user.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <AuthBenefit icon={ShieldCheck} title="Protected labs" />
            <AuthBenefit icon={KeyRound} title="Role-based access" />
            <AuthBenefit icon={UserRound} title="Per-user progress" />
          </div>
        </div>

        <form onSubmit={submitAuth} className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-2xl">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-cyan-200" aria-hidden="true" />
            <h2 className="text-2xl font-semibold text-white">{isRegister ? "Register" : "Login"}</h2>
          </div>

          {isRegister ? (
            <>
              <Field label="Full name" id="name" value={name} onChange={setName} autoComplete="name" />
              <Field label="USN / college ID" id="usn" value={usn} onChange={setUsn} autoComplete="off" />
            </>
          ) : null}

          <Field label="Email" id="email" value={email} onChange={setEmail} type="email" autoComplete="email" />
          <Field label="Password" id="password" value={password} onChange={setPassword} type="password" autoComplete={isRegister ? "new-password" : "current-password"} />

          {isRegister ? (
            <>
              <label className="mt-4 block text-sm font-semibold text-slate-200" htmlFor="role">
                Account role
              </label>
              <select
                id="role"
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
                className="mt-2 min-h-11 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-cyan-300"
              >
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
              </select>
              {role === "instructor" ? (
                <Field
                  label="Instructor code"
                  id="instructor-code"
                  value={instructorCode}
                  onChange={setInstructorCode}
                  autoComplete="off"
                  helper="The first account in a fresh local database becomes instructor automatically. Later instructor accounts need VULNMENTOR_INSTRUCTOR_CODE, except local .test demo accounts outside production."
                />
              ) : null}
            </>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-emerald-400 px-5 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Please wait..." : isRegister ? "Create account" : "Sign in"}
          </button>

          {message ? (
            <p className="mt-4 rounded-md border border-red-300/20 bg-red-400/10 p-3 text-sm leading-6 text-red-100">{message}</p>
          ) : null}

          <p className="mt-5 text-center text-sm text-slate-400">
            {isRegister ? "Already have an account?" : "New to VulnMentor?"}{" "}
            <Link href={isRegister ? "/login" : "/register"} className="font-semibold text-cyan-200 hover:text-cyan-100">
              {isRegister ? "Sign in" : "Create account"}
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}

function Field({
  autoComplete,
  helper,
  id,
  label,
  onChange,
  type = "text",
  value,
}: {
  autoComplete: string;
  helper?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="mt-4 block text-sm font-semibold text-slate-200" htmlFor={id}>
      {label}
      <input
        id={id}
        value={value}
        type={type}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-11 w-full rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-cyan-300"
      />
      {helper ? <span className="mt-2 block text-xs leading-5 text-slate-400">{helper}</span> : null}
    </label>
  );
}

function AuthBenefit({
  icon: Icon,
  title,
}: {
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/70 p-4">
      <Icon className="h-5 w-5 text-cyan-200" aria-hidden="true" />
      <p className="mt-3 text-sm font-semibold text-white">{title}</p>
    </div>
  );
}

function getNextPath() {
  if (typeof window === "undefined") return "/dashboard";
  const next = new URLSearchParams(window.location.search).get("next");
  return next?.startsWith("/") ? next : "/dashboard";
}
