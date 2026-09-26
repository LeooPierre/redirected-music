export default function Home() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <nav className="navbar" aria-label="Main navigation">
        <a href="#artists">ARTISTS</a>
        <a href="#about">ABOUT</a>
      </nav>
      <main id="main">
        <header className="hero">
          <div className="hero-content">
            <h1>
              <img
                src="hero-logo.svg"
                alt="Redirected"
                className="logo"
                width="855"
                height="445"
              />
            </h1>
            <a
              className="contact-email"
              href="mailto:leonardo.soares@redirectedmusic.com"
            >
              leonardo.soares@redirectedmusic.com
            </a>
          </div>
        </header>
        <section
          id="about"
          className="content-section"
          aria-labelledby="about-title"
        >
          <p className="eyebrow">Music. Culture. Stories.</p>
          <h2 id="about-title">
            Behind the music.
            <br />
            Inside the process.
          </h2>
          <p className="intro">
            Redirected is an upcoming podcast and documentary project exploring
            the people shaping music and culture. Honest conversations, creative
            turning points, and the work you rarely get to see.
          </p>
          <div className="formats">
            <article>
              <p className="eyebrow">01 / In the studio</p>
              <h3>Redirected Sessions</h3>
              <p>
                Conversations become collaborations. Singers, rappers,
                producers, and songwriters share their stories and leave a
                creative seed — a hook, a beat, a melody — to grow into a
                collective track across the season.
              </p>
            </article>
            <article>
              <p className="eyebrow">02 / Behind the scenes</p>
              <h3>Redirected Backstage</h3>
              <p>
                Follow DJs, promoters, and event organizers beyond the
                spotlight. From travel and soundchecks to the moments before a
                set, discover the people and work that bring a scene to life.
              </p>
            </article>
          </div>
        </section>
        <section
          id="artists"
          className="content-section"
          aria-labelledby="artists-title"
        >
          <p className="eyebrow">The people behind it</p>
          <h2 id="artists-title">New stories are coming.</h2>
          <p className="intro">
            Meet the artists and scene-builders of Redirected here as the
            project takes shape. Interested in being part of a future episode?
          </p>
          <a className="text-link" href="/artists">
            Meet the guests <span aria-hidden="true">↗</span>
          </a>
        </section>
        <section
          className="content-section playlist-section"
          aria-labelledby="music-title"
        >
          <p className="eyebrow">Listen</p>
          <h2 id="music-title">On the record.</h2>
          <iframe
            title="Spotify album player"
            src="https://open.spotify.com/embed/album/6SbgFO7RRuss5TLuk0S0wf?utm_source=generator"
            width="100%"
            height="352"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          ></iframe>
          <a
            className="text-link"
            href="https://open.spotify.com/album/6SbgFO7RRuss5TLuk0S0wf"
          >
            Listen on Spotify <span aria-hidden="true">↗</span>
          </a>
        </section>
      </main>
      <footer className="footer">
        <p>Redirected</p>
        <a href="mailto:leonardo.soares@redirectedmusic.com">
          leonardo.soares@redirectedmusic.com
        </a>
      </footer>
    </>
  );
}
