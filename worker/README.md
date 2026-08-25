# heute — publish worker

Lets the **0907** add-tile commit new videos live. The GitHub token stays here,
never on the public page.

## Deploy (einmalig)

1. Node + wrangler:
   ```bash
   npm i -g wrangler
   wrangler login
   ```
2. GitHub-Token: **Settings → Developer settings → Fine-grained tokens**.
   - Repository access: nur `rquw/Heute`
   - Permissions: **Contents → Read and write**
3. Im Ordner `worker/`:
   ```bash
   wrangler secret put GITHUB_TOKEN      # den token einfügen
   wrangler secret put PUBLISH_SECRET    # ein starkes, eigenes passwort
   wrangler deploy
   ```
   `wrangler deploy` gibt eine URL aus, z.B.
   `https://heute-publish.<name>.workers.dev`.
4. Diese URL in `index.html` bei `const PUBLISH_URL = "…";` eintragen, committen.

## Nutzung

`heute.` mit **0907** öffnen → **+**-Kachel → Formular → *hinzufügen & live schalten*.
Beim ersten Mal fragt die Seite nach dem **PUBLISH_SECRET** (bleibt nur im
Browser-Speicher der Sitzung). Der Worker committet die neue `index.html`;
GitHub Pages ist nach ~1 min aktuell.

Solange `PUBLISH_URL` leer ist, lädt die +-Kachel stattdessen die fertige
`index.html` herunter — dann reicht 1 manueller Commit.
