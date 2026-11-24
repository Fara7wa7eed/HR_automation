# BrightPath setup status — 2026-11-24

## Verified

- Node 24: all 21 repository tests pass.
- n8n container: `deploy-n8n-1`, local editor `http://127.0.0.1:5678`.
- Drive, Sheets and Gmail credentials were reconnected and passed live read checks.
- Live handbook retrieval returns a cited annual-leave answer; unsupported questions return the configured fallback with no citations.
- The real Job Openings workbook is readable and currently contains no open jobs.
- Ten production workflows were imported as inactive drafts; exported connections matched the source package.
- Gateway source and assets were copied and checksum-verified in `/home/node/.n8n/brightpath-gateway` inside the n8n container. The private environment file uses the existing Header Auth credential. An owner portal account is configured; its password exists only in a private local deliverable, and only its salted hash is in the gateway configuration.

## Current configuration

- Google resource IDs and HR notification email are saved in `setup/config.json`.
- HR and referral testing allowlists use the owner's email supplied in chat. `finalizeSetup` completed successfully at 15:24 Africa/Cairo and returned `applicationJobEntry=entry.284884436` and `referralJobEntry=entry.689311202`. Both are saved in the final source configuration.
- Header Auth credential reference is `FwZphDVSqWGZPGI4`, header `X-BrightPath-Key`. No secret values belong in repository files.
- Gateway listens on container loopback port 8081.
- Temporary test gateway: `https://trucks-fax-excluding-mechanical.trycloudflare.com`.
- Existing GitHub Pages website: `https://fara7wa7eed.github.io/HR_automation/`.
- GitHub CLI authorization is confirmed for Fara7wa7eed with repository push/admin access. Publishing the changed frontend is the next step.

## Remaining work

1. Final configuration is regenerated, passes the configuration checker, and all 21 tests pass. All ten drafts were reimported. Exported graphs and credential IDs match; n8n resolves the Header Auth display label to its actual saved name.
2. The error notification, jobs and chatbot workflows were published through n8n CLI. This n8n version applies publication without a restart. The actual public gateway `/api/jobs` returns HTTP 200 and `{"ok":true,"jobs":[]}` with the exact GitHub Pages CORS origin. The gateway's earlier saved key differed from the current n8n credential; it is now synchronized and only the gateway process was restarted. The authenticated public gateway `/api/me` and `/api/chat` return HTTP 200; chat returns the handbook annual-leave answer with a page-3 citation. Anonymous employee access returns HTTP 401. No secret values were printed.
3. The owner's email does not match any Employees workbook row. Their account has chatbot access and an empty employee ID; personal leave requests remain blocked. The owner was asked for their actual Employee ID. Finish the restricted leave manager review form before activating leave review.
4. Push and verify GitHub Pages. CLI lives in the parent scratch `work/github-cli/bin` directory and uses `work/github-cli-auth` as GH_CONFIG_DIR. Never copy that directory into the repository or deliverables.
5. A clearly marked synthetic CV is prepared outside the repository. The owner was asked to approve one end-to-end recruitment test creating a labeled role, Drive files, Sheet rows and notifications only to the supplied HR inbox, then closing the role and retaining test records. Do not run those side effects until their answer arrives.
6. Replace the temporary tunnel with permanent HTTPS hosting. The current gateway and tunnel depend on this computer and container remaining running; their processes require restarting after a container restart, and a new Quick Tunnel gets a new hostname.

## Access limitations

- Native browser automation could not reliably determine the Chrome URL in earlier turns; it stopped before interacting with the script or Forms.
- Host Git Credential Manager access is denied; portable GitHub CLI authorization now works.
- Ordinary host Docker API calls are denied; approved direct `docker exec` calls work. Gateway secrets stay inside the container.
- Windows previously refused Docker CLI commands because the paging file was too small. Commands work again in the latest turn. Avoid unnecessary concurrent CLI processes.
