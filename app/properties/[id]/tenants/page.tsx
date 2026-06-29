import { redirect } from "next/navigation";

export default function PropertyTenantsPage({ params }: { params: { id: string } }) {
  redirect(`/properties/${params.id}?tab=tenants`);
}
