import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { Providers } from "@/components/admin/Providers";
import { getAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return (
    <Providers>
      <AdminShell admin={admin}>{children}</AdminShell>
    </Providers>
  );
}
