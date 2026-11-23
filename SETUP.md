# Finish the BrightPath connections

The supplied n8n workflows are inactive drafts. Complete these steps before publishing them. Use the existing Docker n8n service at `http://localhost:5678`; its container was observed as `deploy-n8n-1`.

## 1. Reconnect the three Google credentials

In n8n → Credentials, reconnect:

| Existing credential | Type | Observed result |
|---|---|---|
| Google Drive account | `googleDriveOAuth2Api` | Live download says it needs reconnection |
| Google Sheets account | `googleSheetsOAuth2Api` | Live metadata read says it needs reconnection |
| Gmail account | `gmailOAuth2` | Live profile read says it needs reconnection |
| Google Gemini(PaLM) Api account | `googlePalmApi` | Live generation and embeddings worked |
| Qdrant account | `qdrantApi` | Live indexing and retrieval worked through the native node |

The package binds the observed credential IDs, which are references, not secrets. If reconnection creates new IDs, replace the corresponding values in `setup/credential-ids.json`.

Create an n8n credential of type **Header Auth**, named **BrightPath Webhook Access**:

- Name: `X-BrightPath-Key`
- Value: a long random private value you choose in n8n

Copy its credential ID into `setup/credential-ids.json` → `httpHeaderAuth`. Enter the same private value later in the gateway’s `.env` and Apps Script’s Script Properties. Never put it in `portal/config.js`, workflow text fields, GitHub, or chat.

## 2. Create the recruitment Forms, Sheets and CV folder

Open [Google Apps Script](https://script.google.com/) under the Google account whose Drive/Sheets are connected to n8n. Create a standalone project named BrightPath HR.

1. Replace the initial script with `setup/GoogleFormsBridge.gs`.
2. In Project Settings, enable showing `appsscript.json`; replace it with the supplied `setup/appsscript.json`.
3. Enable **Google Forms API** in the Google Cloud project linked to this Apps Script project. The bridge reads the Forms settings to verify respondent identity.
4. Run `bootstrap` once and authorize the requested access. It creates Job Openings and Candidates workbooks, the private BrightPath CVs folder, and the three recruitment forms. Running it again returns the same saved IDs.
5. Read the execution log for the form editor URLs and created IDs.

In both the Application and Referral forms, add a **required File upload** question with the exact title `CV upload`. Allow **one PDF**, maximum **10 MB**. Place it before Job ID if you prefer. Google’s file-upload sample creates this question in the Forms editor; the script does not pretend to create an unsupported upload item. [Google file upload example](https://developers.google.com/apps-script/samples/automations/upload-files)

For the HR Position Management and Referral forms, select **Settings → Responses → Collect email addresses → Verified**. Restrict HR form responders to the HR accounts and referral responders to employees. The bridge also checks their verified email against an allowlist. A typed email field alone is not accepted as HR identity. [Google’s verified-email setting](https://developers.google.com/workspace/forms/api/reference/rest/v1/forms)

Publish all three forms using their intended responder permissions. External applicants need a Google sign-in to upload a file. Keep the two internal forms restricted.

## 3. Configure the private gateway

Copy `server/.env.example` to `server/.env`. Supply:

| Setting | What to enter |
|---|---|
| `N8N_BASE_URL` | Private n8n address reachable by the gateway, normally `http://127.0.0.1:5678` when Node runs on the host |
| `N8N_WEBHOOK_KEY` | Same private value as BrightPath Webhook Access |
| `PORTAL_ORIGIN` | Exact website origin; local preview is `http://localhost:8080`; GitHub Pages is `https://YOUR-ACCOUNT.github.io` with no repository path |
| `EMPLOYEE_USERS_JSON` | Employee emails mapped to salted password hashes and the actual Employee IDs from the leave workbook |
| `TRUST_HTTPS_PROXY` | `true` only behind your trusted HTTPS tunnel/reverse proxy; keep the listener on loopback |

To add an employee using PowerShell 7, run from the extracted project folder:

```powershell
./setup/add-employee.ps1 -Email 'ACTUAL_WORK_EMAIL' -EmployeeId 'ACTUAL_EMPLOYEE_ID'
```

The helper asks privately for a password and writes only a salted scrypt hash to `server/.env`. Give each employee their own account. No sample login credentials are enabled.

Start the server with `npm start`. Expose **port 8080** through your trusted HTTPS tunnel or reverse proxy. Keep port 5678 and the n8n editor private. The gateway exposes only the intended HR routes; it relays the four Forms endpoints using the private header credential.

The machine, Docker services and gateway must remain running. A temporary tunnel URL must be updated in the configuration if it changes.

## 4. Set the Apps Script private properties

In Apps Script → Project Settings → Script Properties, add:

| Property | Value |
|---|---|
| `N8N_BASE_URL` | **Public HTTPS gateway origin** from step 3, without `/webhook`. Here the historical property name refers to the gateway relay, not the private n8n editor. |
| `N8N_WEBHOOK_KEY` | Same private header value as the gateway and n8n |
| `HR_ALLOWED_EMAILS` | Comma-separated verified Google account emails allowed to manage positions/review leave |
| `EMPLOYEE_ALLOWED_EMAILS` | Comma-separated verified employee Google account emails allowed to submit referrals |

Run `finalizeSetup`. It verifies the upload items and verified-email settings, derives the real Google Forms `entry.NUMBER` values, and installs three submission triggers plus a retry trigger. It prints non-secret configuration IDs and links. Do not guess entry IDs.

Submissions are recorded in Google Forms. The Candidates workbook’s **Automation Queue** stores response IDs and delivery state, without copying CV text into the queue. Failed deliveries retry up to five attempts. `retryPending` also recovers responses missed while a trigger was busy. Review `Needs attention` rows, resolve the issue, set their State to `Retry` and Attempts to `0`, then run `retryPending`.

## 5. Fill the project configuration

Edit `setup/config.json` using the IDs printed by `finalizeSetup`:

- `hrEmail`: actual destination for position and High-candidate notifications; do not use the fictional `.example` handbook address.
- `jobsSheetId`, `candidatesSheetId`, `cvRootFolderId`.
- `applicationFormUrl`, `referralFormUrl`, `applicationJobEntry`, `referralJobEntry`.
- `portalOrigin`: exact website origin, without a path or trailing slash.
- `qdrantUrl`: copy **Qdrant URL** from the existing saved Qdrant credential. It must match the endpoint used by the native Qdrant nodes. The local `http://qdrant:6333` endpoint did not accept the tested authenticated HTTP read, so it is intentionally not assumed to match that credential.

Keep the supplied handbook file ID, SHA256 and collection for this approved PDF. The handbook is already indexed in `brightpath_handbook_v42_c88d0baabd49` under the tested Qdrant credential. Its source is the uploaded BrightPath Employee Handbook v4.2, effective January 1, 2026.

The existing leave workbook ID was verified:

`1xkt1O_iIgjrF5NZjXw21-1SweXUB5jCHgduqkvnho54`

Its tabs are `Employees`, `Leave Requests`, and `Workflow Logic`. The supplied workflow uses Employee ID and the original balance columns. If you choose a different leave workbook, supply its ID and preserve these headers and the Remaining Leave formulas.

Edit `portal/config.js`:

- `apiBaseUrl`: public HTTPS gateway origin; empty only for a same-origin local preview.
- `positionManagementFormUrl`: published HR position form URL from `finalizeSetup`.
- Keep `leaveFormUrl: "./leave.html"` for the supplied employee form.

Run:

```text
node setup/configure.cjs
node setup/check-config.cjs
```

The checker reports missing IDs/settings. It cannot verify account permissions or connectivity.

## 6. Enable the manager-review leave flow

The old downloaded leave template could approve solely because there was enough balance. The updated intake records **Pending** requests; it does not deduct leave before manager review.

In Apps Script:

1. Run `setupLeaveReview`. It verifies the existing leave headers, adds `Last Leave Request ID` to Employees, and adds `Used Before`, `Used After`, `Reviewer` to Leave Requests. It creates a fourth, internal **Leave Manager Review** form for the earlier leave workflow; the recruitment assignment still has its three required forms.
2. Set that review form to collect **Verified** emails, restrict responders to HR, and publish it.
3. Run `enableLeaveReview`. HR uses the printed form URL with a Leave Request ID and Approve/Reject decision.

HR must verify manager consent, probation, holiday deductions, notice deadlines, blackout periods and any exceptions before approving. The system counts Sunday–Thursday and limits this ordinary path to 15 working days. It does not invent Egypt’s movable holidays or automatically implement every handbook exception.

Approved requests journal the intended debit, update Used Leave, preserve the Remaining Leave formula, and mark the request Approved. A retry after the debit does not debit twice. An unresolved Processing request blocks another debit for the same employee. Rejecting changes no balance. Do not edit employee balances or processing rows while an approval is in flight.

## 7. Import and activate n8n

From PowerShell in this project folder:

```powershell
./setup/import-workflows.ps1
```

Alternatively, import `workflows/all-workflows.json` with n8n’s CLI; individual workflow files are also provided. The ten final production drafts are supplied for this import; the local instance currently contains the inactive test/probe drafts used for validation. Reimporting the production package after configuration updates the same BrightPath IDs.

Open each BrightPath workflow and verify its credential selection. Rebind imported credential references if this is a different n8n instance. The ordinary workflow IDs are stable so External/Referral intake both call `BrightPathScreenV1`.

Publish/activate the error notification and shared CV workflow first, then chat, jobs, position management, both intake workflows, and both leave workflows. Keep handbook ingestion inactive until Drive is reconnected and the matching Qdrant URL is set. Run its manual trigger once before enabling the Drive update trigger.

Handbook ingestion downloads and checks the approved PDF hash **before** clearing this package’s dedicated collection. It never clears the original `hr` collection or another project’s collection. Reindexing temporarily makes the dedicated collection unavailable. Back up it before a planned reindex. If the PDF changes, the hash guard stops the operation for review; update the approved version/hash/metadata together before accepting a new handbook.

## 8. Upload and publish GitHub Pages

Upload the **contents** of the extracted `BrightPath_HR` folder to the root of your GitHub repository, including `.github/workflows/pages.yml`. Use the `main` branch, or change the branch setting in that file to match your repository.

In GitHub → Repository Settings → Pages, choose **GitHub Actions** as the source. Push/upload the files. The supplied action runs `npm test` and publishes only `portal/`. Check the Actions run and use the page URL returned by GitHub. Repository-relative asset paths support project Pages sites.

Keep real `.env` files and private credentials out of GitHub. The supplied `.gitignore` excludes them. Never upload the handbook PDF or CV folders to a public repository.

## 9. Final acceptance checks

Use a test HR mailbox, synthetic CVs and disposable Sheet rows first:

1. Open a position: one unique Job ID, one Job Openings row with Open status, one CV folder, valid prefilled Apply/Referral links, and an HR email.
2. Open the portal: it fetches the role without a code edit. Check both links preserve Job ID.
3. Submit external and referral applications: both enter the shared workflow, copy the PDF into the job/candidate folder, and produce one Candidate row.
4. Check scores 49, 50, 74, 75: Low, Medium, Medium, High. Only High sends a candidate summary email to HR.
5. Close the role: it disappears on Refresh/within 60 seconds. An application through the old link sends the applicant the closed/unavailable email and does not download/score the CV.
6. Close a nonexistent ID: no Sheet change, HR receives the not-found notification.
7. Ask a known handbook question and an unsupported question. Verify the citation and fallback.
8. Submit leave, then approve/reject through the restricted review form. Verify one debit on approval and no debit on replay or rejection.
9. From the actual GitHub page, test sign-in, CORS, wrong passwords, missing webhook key, unavailable n8n, and a timeout. Confirm no secrets are present in downloaded frontend files.

The automated evidence and the parts awaiting these live checks are listed in `TEST_REPORT.md`.
