import type { ReactNode } from "react";

type StudentLayoutProps = {
  children: ReactNode;
};

export default function StudentLayout({ children }: StudentLayoutProps) {
  return <>{children}</>;
}
