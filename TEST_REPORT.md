# BrightPath handover and test report

Date: November 23, 2026 · Africa/Cairo

**Status: project package prepared; partial live integration verified. Full production activation remains dependent on Google reconnection and the configuration in SETUP.md.** No live recruitment, Google Forms deployment, applicant email, or GitHub publication is claimed.

## Sources inspected

- User-designated Drive workflow: `1oMAjAxeIxxnw_LCilPJHBsrEVNsAC6vR`, named My workflow 3.
- RAG Drive folder: `1XCROt3xSftWnty5S-RwH3KI5ueWOOMyY`; it contained the handbook file `1ZDkbcuwpWG1MEKsD3zc775_hU8-bUad0`.
- Uploaded/local BrightPath Employee Handbook, v4.2, effective January 1, 2026. SHA256: `c88d0baabd496886d64425309fad2f73958b738df58cd8d99f0d73a8dfc842c6`.
- `E:\Downloads\HR_System_Portal_Assignment (1).pdf` and `CV_Screening_Assignment_Part3 (1).pdf`.
- Existing burgundy/navy portal HTML, chatbot HTML, annual_leave_n8n_workflow.json, and related downloaded workflow variants.
- Running Docker n8n 2.47.7 and existing workflow exports. Native node definitions from that installed instance were used because no n8n MCP builder was available.

## Passed with live services

| Check | Evidence/limit |
|---|---|
| Gemini generation | Native n8n Gemini chain returned the requested response |
| Handbook ingestion | Uploaded PDF binary passed through the native PDF loader, Gemini embeddings and Qdrant insert in an isolated BrightPath collection |
| Handbook retrieval | Native Qdrant retrieval returned actual handbook excerpts and page metadata |
| Known-policy answer | Annual-leave question returned the correct entitlement and a citation to page 3 |
| Unsupported question | A question absent from the handbook returned the prescribed fallback and no sources |
| Handbook integrity | Native n8n Crypto SHA256 node and the approved-PDF guard passed for the uploaded file |
| Existing leave workbook metadata | Its ID, tab names and relevant column headers were read through the Drive connector |

The first live answer check caught fenced JSON and a Qdrant filter compatibility issue. These were fixed and the known/unsupported answer checks were rerun successfully. Retrieval now uses a dedicated collection and validates sourceId on the returned excerpts before prompting Gemini.

## Passed with simulated external operations inside n8n

Actual n8n Code, Set, IF and connection paths were executed; Google Sheets, CV download/storage and notification nodes were replaced with fixtures for these checks:

- Closed and missing Job IDs: applicant-notification branch reached; no CV download, AI scoring or candidate save.
- High: saved first, then reached the HR email and notification-status update.
- Medium and Low: saved; did not reach the HR email node.
- Referral: retained Referral source and referrer fields while using the same scoring path.
- Invalid AI score: returned a structured failure before saving or emailing HR.
- Replayed High application: reused its saved result and resumed the pending email without redownloading/rescoring the CV.
- Position open: created the unique ID, job row/folder and prefilled-link payload; reached HR confirmation.
- Position close: reached the matching-row update and HR confirmation.
- Unknown close ID: reached not-found confirmation without a row update.
- Replayed position open: skipped creating another folder/row.
- Leave approval: journal, one balance debit and approved status.
- Leave rejection: no balance debit.
- Leave retry after debit: completed the request without a second debit.
- Insufficient leave: returned 422 without a debit.
- Already decided leave request: returned its prior result without updating the employee.
- Another Processing debit: stopped for reconciliation.

The position checks caught that the standard URL constructor is unavailable in this n8n Code environment. The link builder was replaced with a compatible validated implementation and the open/replay checks passed on rerun. The handbook guard uses the native Crypto node, avoiding a disallowed Code-node crypto import.

## Local automated checks

Twenty Node tests passed before the last date-validation addition. They covered priority boundaries, invalid scores, missing/closed jobs, prefilled URLs, fixed source/referral validation, malformed email, typed AI results, invalid leave input, workflow-script compilation, connection references and private webhook authentication. Real local HTTP tests with simulated upstream services covered authentication, exact CORS origins, preflight, forged employee identity, size/type validation, login rate limiting, static-file isolation, the private Forms relay and malformed relay JSON.

The delivered suite now includes one additional impossible-date validation test. The requested final full-suite rerun was declined, so that new case and a full rerun of the final package are **not claimed as executed**. Run `npm test` before deployment. The Apps Script source passed a syntax compilation check; its Google execution remains unverified.

No email was sent by these tests. No job/candidate rows or CV folders were created in Google by these tests.

## Confirmed blockers / unverified parts

| Item | Status and exact next action |
|---|---|
| n8n Google Drive OAuth | Live request failed: credential needs reconnection. Reconnect Google Drive account. |
| n8n Google Sheets OAuth | Live metadata request failed: credential needs reconnection. Reconnect Google Sheets account. |
| n8n Gmail OAuth | Live profile request failed: credential needs reconnection. Reconnect Gmail account. |
| Inbound webhook credential | Create Header Auth named BrightPath Webhook Access; supply its reference ID and privately configure its value. |
| Google Forms / new recruitment storage | Setup script prepared, not run against the Google account. Run bootstrap, add the two CV upload items, configure verified identities, publish, then finalizeSetup. |
| HR email and account allowlists | Not supplied; enter the actual notification mailbox and permitted verified HR/employee emails. |
| Matching Qdrant HTTP URL | Native indexing/retrieval worked. The local HTTP URL test did not return valid authenticated JSON. Copy the saved Qdrant credential’s actual URL into config before enabling reset/reindex. |
| Public gateway HTTPS URL | Not supplied; expose the gateway and configure portal/API origin and Apps Script properties. |
| Employee access accounts | Not created; add each actual work email, Employee ID and private password hash locally. |
| GitHub | User chose to upload the package themselves. Actions workflow and exact steps included; no repository was pushed or published. |
| Browser visual QA | Attempted. In-app preview timed out and the native Chrome window remained minimized through the available control API. No screenshot-based layout or mobile-browser pass is claimed. |
| Real CV extraction/scoring and Google writes | Not executed end-to-end because Google credentials need reconnection. Run the synthetic-CV acceptance matrix in SETUP.md. |
| Full HTTP webhook round trip | Private workflows remain inactive; CLI/model execution does not prove production webhook auth/CORS. Run final checks after binding the header credential and activating. |

## Operational limits

- AI scores use required skills (60), relevant experience (25), and nice-to-have skills (15). No referral bonus. Scoring supports HR review; it does not automatically hire or reject a person based on protected characteristics.
- PDF CVs only, maximum 10 MB and 30 extracted pages. Scanned/image-only, encrypted or unreadable PDFs need manual review/OCR; the system returns a failure rather than inventing a score.
- The Forms bridge serializes submissions. Do not bypass it with concurrent direct writes or edit processing rows/balances while operations run. Sheets does not offer a multi-service transaction.
- Candidate Application IDs avoid normal replay duplicates. A crash after Gmail accepts a message but before Sent is recorded can still produce a duplicate notification on retry. No exactly-once email guarantee is claimed.
- A storage operation followed by an AI/provider failure can leave a copied CV folder needing cleanup. Inspect the Automation Queue before replaying failed rows.
- Scheduled handbook reindexing is guarded by the approved hash and a dedicated collection; a reset/reindex is not atomic. Keep the existing collection backed up before planned replacement.
- Leave review preserves the original balance workbook, requires a manager decision, and journals retries. Holiday calendars, probation, blackout/notice rules and exceptions remain explicit HR review responsibilities.
- Workflow execution success/error payload retention is disabled in the delivered settings. The Forms queue retains event references and delivery state. Set an appropriate retention/access policy for CVs and candidate rows before real use.
- Final readback compared all 17 pre-existing workflows: their nodes, connections and active states were unchanged. There were 29 added inactive test/probe drafts and zero newly active workflows. Those drafts are not included in the production import file; you may remove them after reviewing the handover.

## Assignment mapping

| Requirement | Delivered implementation |
|---|---|
| Qdrant + authoritative handbook | Workflows 01–02, isolated source/version metadata; live indexing and answers verified |
| Unified portal / deployed chatbot page files | portal/index.html, chatbot.html, leave.html, shared styles/scripts, GitHub Pages action |
| HR opens/closes without editing n8n | Restricted verified management Form → bridge → workflow 04 |
| Unique IDs / prefilled links | Stable form-response digest → Job ID; real Forms entry IDs derived by setup |
| External + referral / common logic | Workflows 05–06 both call workflow 07 |
| Closed/missing jobs | Guard before CV access, applicant email branch, second check before saving |
| CV storage / extraction / AI scoring | Private per-job/candidate folders, native PDF extraction, shared Gemini chain, schema/component validation |
| High ≥75; Medium 50–74; Low <50 | Exact thresholds; only High reaches candidate-notification email |
| Job/Candidate Sheets | Exact required assignment columns plus retry/notification fields; setup and native nodes supplied |
| Portal only open jobs | Workflow 03 projects Open rows; portal refreshes automatically |
| Secure access / errors / CORS | Private header credentials, gateway employee authentication, verified Google identities, validation, bounded requests, explicit error outputs |
| Existing leave flow | Verified existing workbook; corrected intake plus manager review and retry journal |

Final activation belongs after the listed credentials/settings and live acceptance checks are complete.
