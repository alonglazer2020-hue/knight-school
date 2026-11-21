# Knight School: one-time setup at home (on a computer)

Everything below is free. Do Parts 1 to 3 first (about 10 minutes); Parts 4 to 6 are optional extras.
Until Parts 1 and 2 are done the site still works: people can connect a chess.com username without an account.

## Part 1: turn on logins

1. Open https://console.firebase.google.com and sign in with the Google account you used to make Knight School.
2. Click the project **knight-school-6bddd**.
3. In the left menu click **Build**, then **Authentication**. If you see **Get started**, click it.
4. Open the **Sign-in method** tab and click **Email/Password**.
5. Switch on the first toggle (**Email/Password**). Leave "Email link" off. Click **Save**.

## Part 2: the security rules (accounts, bug reports, limits)

1. In the left menu click **Build**, then **Firestore Database**, then the **Rules** tab.
2. Delete everything in the box.
3. Open https://github.com/alonglazer2020-hue/knight-school/blob/main/firestore.rules, copy all of it, paste it into the box.
4. Click **Publish**.

## Part 3: make yourself the owner of the bug-report inbox

1. On the website, create your account (Coach page, **Create account**: your chess.com username and a **new** password; write the password down, it can't be reset).
2. Go to **Settings**, then **Help and feedback**, then **Inbox (site owner)**. The page shows "Only the site owner can read the inbox" and a long **account ID**. Copy it.
3. In Firebase: **Build** > **Firestore Database** > **Data** tab > **+ Start collection**.
4. Collection ID: `admins`. Next.
5. Document ID: paste your account ID. Add one field: name `owner`, type `boolean`, value `true`. Click **Save**.
6. Reload the Inbox page on the website: you now see every bug report and idea.

## Part 4 (optional): get an email for every report

1. Open https://web3forms.com, type your email and press **Create Access Key**. They email you a key.
2. Send the key to Claude (it's safe to share; it can only send emails to you), or put it in `js/config.js` as `WEB3FORMS_KEY = '...'`.

## Part 5 (recommended): lock the Firebase key to your website

1. Open https://console.cloud.google.com/apis/credentials and pick the project **knight-school-6bddd**.
2. Click the key named **Browser key (auto created by Firebase)**.
3. Under **Application restrictions** choose **Websites** and add:
   `https://alonglazer2020-hue.github.io/*`, `http://localhost:8765/*` and (once the new address works) `https://knightschool.js.org/*`.
4. Click **Save**. (Takes up to 5 minutes to apply.)

## Part 6 (optional): show up on Google faster

1. Open https://search.google.com/search-console and click **Add property** > **URL prefix**.
2. Type `https://alonglazer2020-hue.github.io/knight-school/` (later also `https://knightschool.js.org/`).
3. Choose the **HTML tag** method, copy the `content="..."` value, and send it to Claude to add to the site. Then press **Verify**.
4. In **Sitemaps**, submit `sitemap.xml`.

## Using your account

- On a new device: open the site, tap **Sign in**, type your chess.com username and Knight School password. Everything follows you.
- Signing out (Settings > Sign out) removes your progress from that device only; it stays in your account.
