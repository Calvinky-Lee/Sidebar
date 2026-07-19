export default async function ReplayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-semibold text-neutral-100">Replay — session {id}</h1>
      <p className="max-w-md text-neutral-400">
        Replays a finished session through the same HQ reducer via the read-endpoint
        proxy — not built yet, routing stub per spec 07.
      </p>
    </main>
  );
}
