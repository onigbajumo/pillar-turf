import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap grid min-h-[60vh] place-content-center gap-3 text-center">
      <h1 className="display text-5xl">Off the pitch</h1>
      <p className="hint">That page doesn&apos;t exist, or the tournament isn&apos;t public yet.</p>
      <Link href="/" className="btn primary mx-auto">See all tournaments</Link>
    </main>
  );
}
