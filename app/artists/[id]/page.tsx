import Link from "next/link";
import { notFound } from "next/navigation";
import { Brand } from "@/components/Brand";
import { publicArtists } from "@/lib/store";
import { safeWebUrl } from "@/lib/models";
export const dynamic = "force-dynamic";
export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const a = (await publicArtists()).find((a) => a.id === id);
  if (!a) notFound();
  return (
    <>
      <header className="public-header">
        <Brand />
        <Link href="/artists">All guests</Link>
      </header>
      <main className="directory narrow">
        <p className="eyebrow">
          {a.format_type} · Season {a.season_number}
        </p>
        <h1>{a.artist_name}</h1>
        <p className="intro">Discover their music, projects, and latest work.</p>
        {safeWebUrl(a.linktree_url) && (
          <a
            className="text-link"
            href={a.linktree_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            Explore their world ↗
          </a>
        )}
      </main>
    </>
  );
}
