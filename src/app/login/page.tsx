import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoginPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-96 w-full max-w-md" />}>
      <LoginForm />
    </Suspense>
  );
}
