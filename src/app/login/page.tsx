import { AuthPage } from "@/components/academy/auth-page";

export const metadata = {
  title: "Login | VulnMentor",
  description: "Sign in to VulnMentor to continue protected labs and progress tracking.",
};

export default function LoginRoute() {
  return <AuthPage mode="login" />;
}
