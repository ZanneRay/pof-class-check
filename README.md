# PoF Class Check

Anonymous end-of-lesson quiz on students' phones, with results per category for the instructor.
Static web app (GitHub Pages) + Firebase Realtime Database (free Spark plan).

- `host.html` – instructor screen (beamer): load question bank, open room, QR code, questions, results, CSV export.
- `index.html` – student phone: join with QR/code, answer, own feedback.
- `backend.js` – Firebase adapter; `?mock=1` = test mode on one computer (no Firebase).
- `config.js` – Firebase web config (fill in once).
- `database.rules.json` – security rules (paste into Firebase console).

The question bank is **not** in this repo: the instructor loads `POF_Question_Bank_2026.xlsx` (Nextcloud › BA Aerodynamics › Vragenbank, sheet *Questions*) or a CSV on the host screen; only the questions played are sent to the room. Categories = the Module column (Moodle categories). Questions marked X in *Select (X)* (exam selection) are left out by default. The Explanation column is shown after each question on the beamer and on the phones.

## One-time setup

1. https://console.firebase.google.com → **Add project** (Analytics off).
2. **Build → Authentication → Get started → Sign-in method → Anonymous → Enable**.
3. **Build → Realtime Database → Create database** → location **europe-west1 (Belgium)** → *locked mode*.
   Tab **Rules** → replace everything with the content of `database.rules.json` → **Publish**.
4. **Project settings (gear) → Your apps → Web (</>)** → register (no hosting) → copy the `firebaseConfig` values into `config.js`
   (`databaseURL` is shown on the Realtime Database page).
5. **Authentication → Settings → Authorized domains** → add `<github-user>.github.io`.
6. GitHub: new **public** repo → upload all files of this folder → **Settings → Pages → Deploy from branch → main / root**.
   Host screen: `https://<github-user>.github.io/<repo>/host.html`.

Test without Firebase: open `host.html?mock=1` and `index.html?mock=1&r=<code>` in tabs of the same browser.

## In class

Open `host.html` → choose the bank XLSX/CSV (remembered next time) → pick pools or categories → number of questions → **Open room** →
students scan QR → **Start** → Space/Next per question (auto-closes when all have answered or the timer ends) →
results → **Export CSV** → **Close room & delete data**.

## Privacy

No names or accounts. Each phone gets a random anonymous Firebase ID for the session; the room stores only the answer index per
question. Deleting the room removes everything. The personal score is shown only on the student's own phone.
