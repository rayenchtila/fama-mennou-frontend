# Sign-up flows — Playwright checks with the API mocked

These scripts drive the real React app in a real Chromium, with **every `/api` call answered by an in-memory mock**.
They never contact the Famamennou API, its database or Cloudflare's production keys, and they never start the backend
(the backend's schedulers send real e-mails — it must not be started for tests).

They sit beside the older `*.spec.js` suite in `e2e/`, which needs a running API and is run with `npm run test:e2e`.
These are plain Node scripts (no runner), so `playwright test` ignores them.

## Run

```bash
# 1. a private dev server whose API address nothing listens on (so a test can never reach a real server)
PORT=3200 BROWSER=none REACT_APP_DEV_MODE=false \
  REACT_APP_API_URL=http://localhost:4010/api REACT_APP_SOCKET_URL=http://localhost:4010 \
  REACT_APP_TURNSTILE_SITE_KEY=1x00000000000000000000AA npx react-scripts start

# 2. in another terminal
node e2e/signup-mocked/run-all.js          # behaviour checks
node e2e/signup-mocked/run-all.js --all    # + contrast audit, e-mail render, screenshots (e2e/signup-mocked/out/)
node e2e/signup-mocked/t4_code_screen.js   # or any single script
```

`BASE_URL` (default `http://localhost:3200`) points the scripts at the dev server. On Windows PowerShell set the
variables with `$env:NAME='value'` first.

Three scripts (`t3`, `t6`, `t11`) also load a few **pure modules from the API repository** — its validators, document
check, Turnstile verification and e-mail template — so the browser's output is checked against the real server rules.
The API repo is expected next to this one (`../rayen-buisness BACKEND`); set `BACKEND_DIR` to put it elsewhere.

## What each script covers

| Script | Covers |
| --- | --- |
| `t1_open_once.js` | Sign Up opens the registration form directly, once, with no login flash — header button, hamburger menu, `/signup` and `/login` links; fr / en / ar; desktop and phone |
| `t2_client_signup.js` | One Full name field, no bio, the visible Turnstile box and its token sent with the request, 6-cell code that verifies by itself, account created, login page, no session, first-word greeting |
| `t3_freelancer_signup.js` | Two-step wizard, date of birth 18–56 counted from the real date (boundaries), four document kinds and their photos, masking note, pasted code verifies by itself; the payload is run through the real API validators |
| `t4_code_screen.js` | Wrong / locked / expired codes, resend, network failure and the manual button, "too soon" / "too many" / "taken" answers, captcha failures, dev-only Copy panel, a refusal after the code costs no second code |
| `t5_google_signup.js` | Google sign-up ends on the login page with no session; age refusal; Google login still works |
| `t6_turnstile_real.js` | The real Turnstile widget (Cloudflare's published test key; a small visible box) → a real token → the API's `verifyTurnstile` against Cloudflare's real siteverify (test secrets). Needs internet |
| `t7_onboarding.js` | A freelancer completing their profile lands on Hire a Freelancer with their own card pinned; a refused save says why; the short bio's label and limit |
| `t8_first_word.js` | Pages built from people with made-up surnames: none shows more than the first word (text, title, meta, structured data) |
| `t9_contrast.js` | WCAG AA contrast of every text item on the new screens, fr / en / ar, light and dark |
| `t10_admin_doc.js` | The admin identity review names the submitted document; one photo for one-sided kinds |
| `t13_forgot_password.js` | Password reset: a fresh single-use Turnstile token for every code request (including resend), the API's refusals are shown and never advance to step 2 |
| `t14_login_paths.js` | Log-in: token sent and re-armed per request, the API's refusals, a two-role account (no second captcha), a freelancer still under review |
| `t11_email.js` | Renders the sign-up code e-mail (large selectable code) |
| `t12_visual.js` | Screenshots of the new screens on a phone, in Arabic and in dark mode |

`harness.js` holds the shared pieces: the mock API (`makeMock`), the Turnstile and Google script stubs, a generated PNG
for document photos, and a tiny check reporter.
