// Runs the mocked-API sign-up checks one after another and prints a summary.
//
//   node e2e/signup-mocked/run-all.js           the behaviour checks (t1–t8, t10, t13, t14)
//   node e2e/signup-mocked/run-all.js --all     + the contrast audit (t9), the e-mail render (t11) and the screenshots (t12)
//
// BASE_URL is the private dev server (default http://localhost:3200) — start it as the README says, with an API address
// nothing listens on, so no run can ever reach a real server.
const { spawnSync } = require('child_process');
const path = require('path');

const ALL = process.argv.includes('--all');
const BEHAVIOUR = [
  ['t1_open_once.js',          'Sign Up opens the registration form once'],
  ['t2_client_signup.js',      'Client sign-up, end to end'],
  ['t3_freelancer_signup.js',  'Freelancer sign-up, end to end'],
  ['t4_code_screen.js',        'E-mail code screen, every condition'],
  ['t5_google_signup.js',      'Google sign-up'],
  ['t6_turnstile_real.js',     'Real Turnstile widget + real siteverify (needs internet)'],
  ['t7_onboarding.js',         'Onboarding redirect + short bio'],
  ['t8_first_word.js',         'First word of a name only'],
  ['t10_admin_doc.js',         'Admin identity review'],
  ['t13_forgot_password.js',   'Forgot password (Turnstile on both steps)'],
  ['t14_login_paths.js',       'Log-in paths (captcha, refusals, two roles, under review)'],
];
const EXTRA = [
  ['t9_contrast.js',           'WCAG contrast of the new screens'],
  ['t11_email.js',             'Sign-up code e-mail render (screenshots)'],
  ['t12_visual.js',            'Screenshots: phone / Arabic / dark'],
];

const BASE_URL = process.env.BASE_URL || 'http://localhost:3200';
let failed = 0, passedChecks = 0, totalChecks = 0;
const rows = [];

for (const [file, title] of [...BEHAVIOUR, ...(ALL ? EXTRA : [])]) {
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [path.join(__dirname, file)], {
    env: { ...process.env, BASE_URL }, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
  });
  const out = `${r.stdout || ''}${r.stderr || ''}`;
  const m = out.match(/(\d+)\/(\d+) checks passed/);
  const audit = out.match(/TOTAL (\d+) text items, (\d+) problems/);
  if (m) { passedChecks += +m[1]; totalChecks += +m[2]; }
  const ok = r.status === 0;
  if (!ok) { failed++; process.stdout.write(out.split('\n').filter(l => /✘|→|Error|COULD NOT|below AA/.test(l)).join('\n') + '\n'); }
  rows.push(`${ok ? 'PASS' : 'FAIL'}  ${title.padEnd(58)} ${m ? `${m[1]}/${m[2]} checks` : audit ? `${audit[1]} items, ${audit[2]} problems` : ''}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  console.log(rows[rows.length - 1]);
}

console.log(`\n${failed ? 'FAILED' : 'ALL PASSED'}: ${passedChecks}/${totalChecks} checks across ${rows.length} scripts`);
process.exit(failed ? 1 : 0);
