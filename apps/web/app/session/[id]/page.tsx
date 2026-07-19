import { HqScene } from "@/components/hq/HqScene";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <HqScene sessionId={id} />;
}
