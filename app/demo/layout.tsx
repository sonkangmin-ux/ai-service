import { AppSession } from "@/components/app/AppSession";
import type { ReactNode } from "react";

export default function DemoLayout({ children }: { children: ReactNode }) {
  return <AppSession>{children}</AppSession>;
}
