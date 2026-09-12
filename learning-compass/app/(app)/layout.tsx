import { AppSession } from "@/components/app/AppSession";
import type { ReactNode } from "react";

export default function LearnGroupLayout({ children }: { children: ReactNode }) {
  return <AppSession>{children}</AppSession>;
}
