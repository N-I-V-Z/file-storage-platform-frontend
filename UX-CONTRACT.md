# Project dashboard interaction contract

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Select/Listbox | Native HTML `select` | This contract and `DESIGN.md` | Native for fixed expiry choices; browser popup and locale behavior accepted | API key panel component test and manual keyboard smoke test |
| Form | Zod schema with React Hook Form | This contract and feature schemas | Project creation and key issuance | Project and API key component tests |
| CRUD | Project/API key feature modules | This contract and backend API contract | Stay on dashboard after create and revoke | Project and API key component tests |

## Navigation and loading

`/dashboard` checks the cookie session before showing account or project data. Its header links to the Projects and Tài khoản sections; the account section displays the signed-in email. The route shows a loading message during navigation and a generic error with a retry button if rendering fails. The project list belongs to the signed-in user and loads through TanStack Query. Selection is local to this page: choose the first project when data arrives, select a newly created project, and choose another existing project if the selected one disappears. Show distinct loading, empty, and recoverable error states; a failed fetch has a visible retry action. The project list, selected project's usage, and key list use separate query keys.

## Storage usage

The selected project's usage card loads `GET /projects/:id/usage` after session restoration. It shows used bytes against quota, a percentage bar, and bytes reserved by uploads. Balance fields are decimal strings; validate them before `BigInt` arithmetic and format binary units for display. Loading and failed requests remain inside the card so project selection and API keys stay usable. A failed request offers retry. Switching projects clears the prior card immediately; never display one project's usage under another project's name.

## Forms and mutations

Project creation and key creation use Zod with React Hook Form. Validate on submit, associate inline errors with fields, preserve nonsensitive input after API failure, block duplicate submissions, and show a form-level error. On project success, refresh the list and select the new project. Key issuance waits for server confirmation before showing success. Revoke has an inline confirmation naming the key; keep it open and show an error if the request fails. Do not expose project deletion in this phase because it also deletes keys.

## API key secret

The create response's token appears in one dedicated panel after success. It is held only in component memory, never in a query/list cache, URL, localStorage, or log. Copy uses a labeled button and reports success or failure. Closing the panel, changing projects, or leaving the page clears the token. The key list contains metadata and status only; the secret cannot be retrieved later. Default expiry is 90 days, with explicit 30-day, 365-day, and no-expiry choices. Scope checkboxes must show each permission and its effect; no scope cannot be submitted.

## Responsive and accessibility

On wide screens the project rail and detail panel sit side by side; on narrow screens they stack and scroll with the document. Controls remain reachable at short viewport heights. Use native checkboxes and select for the small fixed scope/expiry choices. Use buttons for actions, `aria-current` for selection, `role="alert"` for errors, and an announced status for loading/copy results. Focus returns to the relevant trigger after inline confirmation is canceled.
