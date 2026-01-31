import { redirect } from "next/navigation";

export default function RootPage() {
  // With SSR, we can't check localStorage server-side, so default to login
  // The client-side auth provider will handle the actual auth flow
  redirect("/login");
} 