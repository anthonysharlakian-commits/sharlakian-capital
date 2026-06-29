import { redirect } from "next/navigation";

export default function PropertyMaintenancePage({ params }: { params: { id: string } }) {
  redirect(`/properties/${params.id}?tab=maintenance`);
}
