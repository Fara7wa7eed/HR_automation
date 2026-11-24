# Always-on hosting preparation

These files are prepared for a Linux server with Docker Compose. They have not been deployed to a remote server: no hosting account, server or domain is currently supplied.

## Required resources

- An always-on Linux server with Docker Engine and the Compose plugin.
- A public DNS hostname pointing to that server, with ports 80 and 443 reachable for HTTPS.
- Private migration access to the existing n8n database, encryption settings and gateway environment, or a new n8n setup with reconnected credentials.

The website remains on GitHub Pages. Caddy serves only the gateway's API and Forms relay paths over HTTPS. The n8n editor binds to server loopback; reach it with an SSH tunnel rather than publishing the editor.

## Prepare the server

1. Copy `.env.example` to `.env` in this directory and set the actual gateway hostname and certificate email.
2. Copy `gateway/.env.example` to `gateway/.env`. Privately copy the existing webhook key and `EMPLOYEE_USERS_JSON` from the running gateway. Never commit the completed files.
3. Copy `n8n/.env.example` to `n8n/.env`.
4. For a migration, take a consistent backup of the existing n8n data volume while n8n is stopped, and restore the database together with its encryption settings into the new `n8n_data` volume before starting the new instance. Keep the original backup private and recoverable. Restoring a database under a different encryption key makes saved credentials unusable. If creating a new instance instead, reconnect its Google, Gemini, Qdrant and Header Auth credentials and update workflow references before import.
5. Start the stack from this directory:

```sh
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

For private editor access, run this on your computer, replacing the SSH destination:

```sh
ssh -L 5678:127.0.0.1:5678 user@server
```

Then open `http://localhost:5678` locally. Verify OAuth redirect URIs and reconnect credentials if the callback origin changes during migration.

## Switch over after testing

1. Verify `https://YOUR_GATEWAY_DOMAIN/api/jobs`, exact GitHub Pages CORS, employee login and authenticated chat. Anonymous employee access must remain rejected.
2. Change `portal/config.js` → `apiBaseUrl` and Apps Script → `N8N_BASE_URL` to that HTTPS origin. Keep `setup/config.json` → `portalOrigin` and gateway `PORTAL_ORIGIN` set to the GitHub Pages origin.
3. Push the frontend update and confirm its GitHub Pages deployment succeeds.
4. Submit a synthetic Form response and verify the queue, private CV storage, candidate row and intended test email. Complete leave review setup using real employee data before enabling personal leave requests.
5. Stop the old temporary gateway only after the new endpoint and triggers pass the acceptance checks. Preserve its n8n backup.

The n8n image matches the instance used during this setup (2.47.7). Review supported releases and test an upgrade before production use. Back up the n8n volume and Caddy certificate data; `docker compose down --volumes` deletes the named volumes and must not be used as routine shutdown.
