import { redirect } from "next/navigation";

export default function PropertyFinancialsPage({ params }: { params: { id: string } }) {
  redirect(`/properties/${params.id}?tab=financials`);
}
