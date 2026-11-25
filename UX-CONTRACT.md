# Project dashboard interaction contract

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Select/Listbox | Native HTML `select` | This contract and `DESIGN.md` | Native for fixed expiry choices; browser popup and locale behavior accepted | API key panel component test and manual keyboard smoke test |
| Form | Zod schema with React Hook Form | This contract and feature schemas | Project creation and key issuance | Project and API key component tests |
| CRUD | Project/API key/file feature modules | This contract and backend API contract | Stay on dashboard after create, revoke, and folder changes | Project, API key, and file component tests |

## Navigation and loading

`/dashboard` checks the cookie session before showing account or project data. Its header links to the Projects and Tài khoản sections; the account section displays the signed-in email. The route shows a loading message during navigation and a generic error with a retry button if rendering fails. The project list belongs to the signed-in user and loads through TanStack Query. Selection is local to this page: choose the first project when data arrives, select a newly created project, and choose another existing project if the selected one disappears. Show distinct loading, empty, and recoverable error states; a failed fetch has a visible retry action. The project list, selected project's usage, and key list use separate query keys.

## Storage usage

The selected project's usage card loads `GET /projects/:id/usage` after session restoration. It shows used bytes against quota, a percentage bar, and bytes reserved by uploads. Balance fields are decimal strings; validate them before `BigInt` arithmetic and format binary units for display. Loading and failed requests remain inside the card so project selection and API keys stay usable. A failed request offers retry. Switching projects clears the prior card immediately; never display one project's usage under another project's name.

The card separately loads `GET /projects/:id/usage/breakdown`. It shows READY file bytes, trash and in-progress purge bytes (still charged), and upload reservations. A breakdown error has its own retry and leaves the quota summary visible. When `matchesBalance` is false, warn that stored metadata and quota counters disagree and direct the user to an administrator; never imply that the UI repairs the discrepancy. Upload, trash, restore, and purge invalidate both usage queries. While uploads are active, refresh usage every two seconds and once again after success, failure, or cancellation so temporary reservations do not remain stale. A project switch clears the prior breakdown immediately.

## File explorer and transport

The selected project shows only READY files from the private owner API. Search, MIME filter, sort, folder selection, and pagination are server backed; changing filters or folders returns to page one. Folder choices are all files, unfiled root, and flat project folders. Create and rename use Zod with React Hook Form; deleting a folder requires inline confirmation, and a nonempty folder reports the conflict without losing the retry action. Switching projects clears the previous project's file and folder view.

The upload area accepts multiple selected or dropped files. It checks size, MIME, and filename locally, then sends one multipart request per file directly to NestJS with the in-memory Bearer token. At most two uploads run concurrently; the rest remain queued and can be canceled. Each file has progress, cancellation, and retry; only a READY response marks success and refreshes file list and usage. The selected folder is sent as `X-Folder-Id`, while all/root upload to the unfiled project root. Never place tokens in URLs or browser storage.

Preview supports PNG, JPEG, WebP, PDF, and MP4 up to 64 MiB. Video preview fetches authenticated byte ranges into a temporary Blob URL; seeking after loading is local and makes no new server Range request. ZIP and larger files offer download only. Download fetches the private endpoint with Bearer auth and checks MIME and complete byte count. Browsers with the File System Access API write the response stream directly to the chosen file. Other browsers use a Blob only up to 64 MiB and explain the limitation for larger files. Preview URLs are revoked on close; a failed or unauthorized response is never shown as media.

Moving a READY file to trash requires an inline confirmation naming the file and its 30-day retention; the action removes it from the private file list but does not free project quota. If it empties the last page, return to the preceding page. The selected project's trash panel lists only its own trashed files, shows the purge date, and offers restore before expiry. A permanent purge requires a separate confirmation that says recovery is impossible. On success, refresh the READY list, trash list, and usage card. Failed actions keep the row and confirmation available; expired restore explains the conflict. A purge returning 503 has already been claimed for background retry: refresh the list, dismiss the confirmation, and explain that quota updates after completion. Switching projects clears the previous project's trash view. Trashed files have no preview or download actions, and neither the panel nor its API exposes filesystem paths or tokens.

## Forms and mutations

Project creation and key creation use Zod with React Hook Form. Validate on submit, associate inline errors with fields, preserve nonsensitive input after API failure, block duplicate submissions, and show a form-level error. On project success, refresh the list and select the new project. Key issuance waits for server confirmation before showing success. Revoke has an inline confirmation naming the key; keep it open and show an error if the request fails. Do not expose project deletion in this phase because it also deletes keys.

## API key secret

The create response's token appears in one dedicated panel after success. It is held only in component memory, never in a query/list cache, URL, localStorage, or log. Copy uses a labeled button and reports success or failure. Closing the panel, changing projects, or leaving the page clears the token. The key list contains metadata and status only; the secret cannot be retrieved later. Default expiry is 90 days, with explicit 30-day, 365-day, and no-expiry choices. Scope checkboxes must show each permission and its effect; no scope cannot be submitted.

## Responsive and accessibility

On wide screens the project rail and detail panel sit side by side; on narrow screens they stack and scroll with the document. Controls remain reachable at short viewport heights. Use native checkboxes and select for the small fixed scope/expiry choices. Use buttons for actions, `aria-current` for selection, `role="alert"` for errors, and an announced status for loading/copy results. Focus returns to the relevant trigger after inline confirmation is canceled.
