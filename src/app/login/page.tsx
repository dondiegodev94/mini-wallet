import type { Metadata } from "next";
import { AuthLayout } from "@/ui/features/auth/AuthLayout";
import { LoginScreen } from "./_components/LoginScreen";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <AuthLayout title="Bienvenido" description="Ingresa con tu teléfono o email para continuar.">
      <LoginScreen />
    </AuthLayout>
  );
}
