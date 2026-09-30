import Link from "next/link";

export default function Home() {
  return (
    <div className="home-v2">
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="home-nav">
        <Link className="home-mark" href="/" aria-label="Redirected home">R<span>→</span>D</Link>
        <nav aria-label="Main navigation">
          <a href="#formats">Formats</a>
          <Link href="/artists">Artists</Link>
          <a href="#about">About</a>
        </nav>
        <a className="home-contact" href="mailto:leonardo.soares@redirectedmusic.com">Get in touch ↗</a>
      </header>

      <main id="main">
        <section className="home-hero" aria-labelledby="hero-title">
          <div className="home-hero-image" aria-hidden="true" />
          <div className="home-hero-shade" aria-hidden="true" />
          <p className="home-kicker">Independent music documentary · Switzerland</p>
          <h1 id="hero-title">REDIRECTED</h1>
          <p className="home-hero-line">The moment the path changed.<br />The music that followed.</p>
          <a className="home-scroll" href="#about">Enter the story ↓</a>
          <span className="home-edition">SEASON 01<br />MMXXVI</span>
        </section>

        <section className="home-manifesto" id="about">
          <p className="home-index">01 — The idea</p>
          <div>
            <h2>Every artist has a moment that redirects everything.</h2>
            <p>Redirected follows musicians and scene-builders into the places where their work becomes real. Part conversation, part process, part document of a culture in motion.</p>
          </div>
        </section>

        <section className="home-formats" id="formats" aria-labelledby="formats-title">
          <div className="home-section-head">
            <p className="home-index">02 — Two ways in</p>
            <h2 id="formats-title">The formats</h2>
          </div>
          <article>
            <div className="format-number">01</div>
            <div className="format-copy">
              <p>In the studio</p>
              <h3>Sessions</h3>
              <span>A deep conversation becomes a new song. Beat, melodies, vocals and instinct—created together in one episode.</span>
            </div>
            <span className="format-arrow" aria-hidden="true">↗</span>
          </article>
          <article>
            <div className="format-number">02</div>
            <div className="format-copy">
              <p>Behind the movement</p>
              <h3>Backstage</h3>
              <span>A day inside the world of DJs, organizers and the people who build culture before the doors open.</span>
            </div>
            <span className="format-arrow" aria-hidden="true">↗</span>
          </article>
        </section>

        <section className="home-people">
          <p className="home-index">03 — The people</p>
          <div>
            <p className="home-coming">Stories arriving soon.</p>
            <h2>Meet the voices shaping what comes next.</h2>
            <Link className="home-button" href="/artists">Explore artists ↗</Link>
          </div>
        </section>
      </main>

      <footer className="home-footer">
        <div className="home-footer-word">REDIRECTED</div>
        <div>
          <span>Music · Culture · Stories</span>
          <a href="mailto:leonardo.soares@redirectedmusic.com">leonardo.soares@redirectedmusic.com</a>
        </div>
      </footer>
    </div>
  );
}
