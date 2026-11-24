# BrightPath setup status — 2026-11-24

## Verified

- Node 24: all 23 repository tests pass, including notification rendering and the Gemini response adapter.
- n8n container: `deploy-n8n-1`, local editor `http://127.0.0.1:5678`.
- Drive, Sheets and Gmail credentials were reconnected and passed live read checks.
- Live handbook retrieval returns a cited annual-leave answer; unsupported questions return the configured fallback with no citations.
- The real Job Openings workbook is readable and currently contains no open jobs.
- Ten configured production workflow graphs and credential IDs are verified. Chat, jobs, position management, external intake, referral intake, shared screening and error notification are active. Handbook reingestion and both leave workflows remain inactive.
- Gateway source and assets were copied and checksum-verified in `/home/node/.n8n/brightpath-gateway` inside the n8n container. The private environment file uses the existing Header Auth credential. An owner portal account is configured; its password exists only in a private local deliverable, and only its salted hash is in the gateway configuration.

## Current configuration

- Google resource IDs and HR notification email are saved in `setup/config.json`.
- HR and referral testing allowlists use the owner's email supplied in chat. `finalizeSetup` completed successfully at 15:24 Africa/Cairo and returned `applicationJobEntry=entry.284884436` and `referralJobEntry=entry.689311202`. Both are saved in the final source configuration.
- Header Auth credential reference is `FwZphDVSqWGZPGI4`, header `X-BrightPath-Key`. No secret values belong in repository files.
- Gateway listens on container loopback port 8081.
- Temporary test gateway: `https://trucks-fax-excluding-mechanical.trycloudflare.com`.
- Existing GitHub Pages website: `https://fara7wa7eed.github.io/HR_automation/`.
- GitHub CLI authorization is confirmed for Fara7wa7eed with repository push/admin and workflow permissions. The configured frontend is published at the GitHub Pages URL above.

## Remaining work

1. Final configuration is regenerated and passes the configuration checker. The suite now has 23 passing tests. The earlier package was imported and verified; subsequent recruitment fixes are in the source and live recruitment workflows.
2. The error notification, jobs and chatbot workflows were published through n8n CLI. This n8n version applies publication without a restart. The actual public gateway `/api/jobs` returns HTTP 200 and `{"ok":true,"jobs":[]}` with the exact GitHub Pages CORS origin. The gateway's earlier saved key differed from the current n8n credential; it is now synchronized and only the gateway process was restarted. The authenticated public gateway `/api/me` and `/api/chat` return HTTP 200; chat returns the handbook annual-leave answer with a page-3 citation. Anonymous employee access returns HTTP 401. No secret values were printed.
3. The owner confirmed they have no employee record or Employee ID. Their account has chatbot access and an empty employee ID; personal leave requests remain blocked. Genuine employee data and the restricted manager-review setup are required before enabling leave services. Do not fabricate an employee identity or leave entitlement.
4. GitHub Pages deployment succeeded for commit `109ef4c` in Actions run `45407757235`. The previous Pages v4 artifact lookup failed twice; the committed fix uses Pages v5 actions and separate build/deploy jobs. All three HTML pages and frontend assets return HTTP 200, the published config points at the current gateway, and authenticated chat through that configuration returns a page-3 citation. The browser rendered the homepage and its genuine empty-jobs state successfully. CLI lives in the parent scratch `work/github-cli/bin` directory and uses `work/github-cli-auth` as GH_CONFIG_DIR. Never copy that directory or the private local login deliverable into the repository.
5. The owner authorized the synthetic recruitment test. Role `JOB-bp-acceptance-20261124-v1` was opened, became visible with correct prefilled links, and was closed through the actual HTTPS relay. It no longer appears in the jobs API. Synthetic CV `1SqMigcZt_Hf9eeEc9XgpBp4QUjRyz3qI` was uploaded, extracted and stored privately. Application `bp-acceptance-external-20261124-v1` produced one High candidate row with notification status Sent. Replays skipped both scoring and email and kept one row. Both actual external and referral endpoints returned `position_closed` for new synthetic applications after closure. Test records and files are retained for review.
6. Live testing exposed invalid Drive alias locators (`My Drive` used ID validation) and invalid line breaks in the High-candidate email expression. Both are fixed. Scoring now uses an authenticated HTTP Request with a 30-second timeout, two attempts and a validated JSON-response adapter. The API rejected the old 2.5 model for new users and explicitly recommended `gemini-3.5-flash-lite`; that discovered model is configured. Its live calls currently return Google's high-demand/service-unavailable response, so final positive referral scoring is not certified. This failure is returned as a recoverable service error for the Forms queue. Earlier unbounded sub-execution #429 is confirmed canceled; no stop action remains. The synthetic role is closed.
7. The owner confirmed no hosting account/server exists. An always-on Docker Compose stack, gateway Dockerfile, Caddy HTTPS configuration and private environment templates are prepared in `deploy/`. `docker compose config --no-env-resolution --quiet` passes. No remote stack was started or purchased. The current gateway and tunnel still depend on this computer and container remaining running; restarting the tunnel changes its hostname.
8. A copy-ready LinkedIn post was saved outside the repository as a private local deliverable. It describes a prototype, 23 passing tests, human review and the remaining hosting/leave milestones. It was not posted to LinkedIn.

## Access limitations

- Native browser automation could not reliably determine the Chrome URL in earlier turns; it stopped before interacting with the script or Forms.
- Host Git Credential Manager access is denied; portable GitHub CLI authorization now works.
- Ordinary host Docker API calls are denied; approved direct `docker exec` calls work. Gateway secrets stay inside the container.
- Windows previously refused Docker CLI commands because the paging file was too small. Commands work again in the latest turn. Avoid unnecessary concurrent CLI processes.
