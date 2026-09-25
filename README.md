# Redirected

Public landing page for Redirected, an upcoming music and culture podcast/documentary project with two formats: **Redirected Sessions** (studio conversations and collaborations) and **Redirected Backstage** (documentaries following DJs, promoters, and event organizers).

## Project files

- `index.html`: landing page, format introductions, artist invitation, contact links, and Spotify album player.
- `style.css`: responsive black-and-white layout and typography.
- `hero-logo.svg`: original Redirected logo.
- `assets/fonts/Aylia.otf`: original display font; Inter is loaded from Google Fonts for body text, with a sans-serif fallback.

All five tracked files are in use or provide project documentation. No framework, package installation, or build step is required.

## Preview locally

From the repository directory, run `python3 -m http.server 8000`, then open http://localhost:8000. Stop the server with Ctrl+C.

## Editing

Update copy and contact links in `index.html`, and layout in `style.css`. The contact address is `leonardo.soares@redirectedmusic.com`. The existing Spotify album remains embedded; update both the iframe source and the fallback Spotify link if the album changes.

Keep navigation links matched to section IDs. Before publishing, check desktop and mobile layouts, keyboard focus, section links, email links, and the Spotify player. Publish the static files together, preserving the asset paths; no deployment configuration is included here.

## Later phases

Artist profiles, onboarding forms, database integration, memberships, payments, and an admin dashboard are future work. This page does not collect submissions or process subscriptions.
