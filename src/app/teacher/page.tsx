import type { Metadata } from "next";
import { TeacherDashboard } from "@/components/teacher/TeacherDashboard";

export const metadata: Metadata = { title: "IRL Money — Teacher" };

export default function TeacherPage() {
  return <TeacherDashboard />;
}
