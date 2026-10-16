import { ManageTournament } from "@/components/admin/ManageTournament";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ManageTournament id={(await params).id} />;
}
