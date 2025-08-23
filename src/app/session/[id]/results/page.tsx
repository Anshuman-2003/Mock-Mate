import { redirect } from "next/navigation";
export default function Alias({ params }: { params: { id: string } }) {
  redirect(`/start/jd/session/${params.id}/results`);
}