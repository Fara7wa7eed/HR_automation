# BrightPath HR

Google Forms, recruitment workbooks, CV storage, and credential references are configured. The live jobs API and authenticated handbook chatbot have passed HTTPS gateway checks. A synthetic recruitment test verified position opening/closing, CV extraction and storage, candidate saving, HR email, replay protection, and closed-position guards. The final referral scoring check is limited by Gemini's reported high demand. The frontend currently uses a temporary gateway tunnel that depends on the local computer and Docker remaining running. Permanent HTTPS hosting and actual employee leave mappings are still required before calling the full system production-ready. See **context/CURRENT_STATE.md** for status, **SETUP.md** for setup, and **deploy/README.md** for the prepared always-on server stack.

Start with **SETUP.md**, then use **TEST_REPORT.md** for the verified results and remaining acceptance checks.

## Included

| Folder | Purpose |
|---|---|
| `portal/` | Burgundy-and-navy portal, chatbot, leave form, responsive styling and transitions |
| `workflows/` | Ten inactive n8n workflows, individually and as one import file |
| `server/` | Private integration gateway; passwords and webhook keys stay outside the website |
| `setup/` | Google Forms/Sheets/Drive setup bridge, configuration and import helpers |
| `tests/` | Business-rule and HTTP integration tests using simulated external services |
| `deploy/` | Prepared Docker Compose stack for an always-on server with HTTPS and a private n8n editor |
| `reference/` | Unmodified original workflow JSONs for comparison |
| `.github/workflows/pages.yml` | GitHub Pages deployment of `portal/` only |

No handbook PDF, CVs, OAuth tokens, API keys, or employee passwords are included in this package.

## Local preview

Install/use Node.js 24, open a terminal in this folder, then run:

```text
npm start
```

Open `http://localhost:8080`. Until the account connections and server configuration are supplied, the pages show honest unavailable/sign-in states. This is not a demo populated with invented vacancies.

```text
npm test
```

The tests simulate Google storage/email calls. They do not send messages or alter Google data.

## What runs where

GitHub Pages serves the website. The gateway runs on a computer/server reachable through HTTPS. n8n, the Google Forms bridge, Google Sheets/Drive/Gmail, Qdrant, and Gemini carry out the automations.

**Uploading the website to GitHub does not host n8n or the gateway.** Keep those services running for live features.
