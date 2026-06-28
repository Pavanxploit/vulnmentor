import { AuthPage } from "@/components/academy/auth-page";

export const metadata = {
  title: "Register | VulnMentor",
  description: "Create a VulnMentor student or instructor account.",
};

export default function RegisterRoute() {
  return <AuthPage mode="register" />;
}
