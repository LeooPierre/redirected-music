import Link from "next/link";
import { Brand } from "@/components/Brand";
import { publicArtists } from "@/lib/store";
export const dynamic = "force-dynamic";
export const metadata = { title: "The people" };
export default async function ArtistsPage() {
  const artists = await publicArtists();
  return (
    <>
      <header className="public-header">
        <Brand />
        <Link href="/#about">About</Link>
      </header>
      <main className="directory">
        <p className="eyebrow">The people behind it</p>
        <h1>
          Different paths.
          <br />
          Shared stories.
        </h1>
        <p className="intro">
          Meet the artists, DJs, and scene-builders of Redirected.
        </p>
        {artists.length ? (
          <div className="profile-grid">
            {artists.map((a) => (
              <Link
                className="panel profile-card"
                href={"/artists/" + a.id}
                key={a.id}
              >
                <span className="eyebrow">
                  {a.format_type} · Season {a.season_number}
                </span>
                <h2>{a.artist_name} ↗</h2>
                <p>Explore their profile and work.</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-symbol">↗</span>
            <h2>New stories are coming.</h2>
            <p>Our first guest profiles will appear here when they’re ready.</p>
          </div>
        )}
      </main>
    </>
  );
}
