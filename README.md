# BrightPath HR

The project files are ready for configuration and GitHub upload. The chatbot was tested against the uploaded handbook in the connected Qdrant/Gemini setup. Google Forms, recruitment storage, and email still need the account connections listed in **SETUP.md** before the full system can go live.

Start with **SETUP.md**, then use **TEST_REPORT.md** for the verified results and remaining acceptance checks.

## Included

| Folder | Purpose |
|---|---|
| `portal/` | Burgundy-and-navy portal, chatbot, leave form, responsive styling and transitions |
| `workflows/` | Ten inactive n8n workflows, individually and as one import file |
| `server/` | Private integration gateway; passwords and webhook keys stay outside the website |
| `setup/` | Google Forms/Sheets/Drive setup bridge, configuration and import helpers |
| `tests/` | Business-rule and HTTP integration tests using simulated external services |
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
