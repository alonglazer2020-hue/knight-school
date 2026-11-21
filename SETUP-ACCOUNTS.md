# Switching on Knight School accounts (one time, about 5 minutes, on a computer)

Accounts are built into the site but stay off until these two Firebase settings are changed.
Until then the site works as before (connect a chess.com username, or use the sync code).

## Part 1: turn on logins

1. On your computer, open https://console.firebase.google.com and sign in with the Google account you used to make Knight School.
2. Click the project **knight-school-6bddd**.
3. In the left menu click **Build**, then **Authentication**.
4. If you see a **Get started** button, click it.
5. Open the **Sign-in method** tab.
6. Click **Email/Password**.
7. Switch on the first toggle (**Email/Password**). Leave "Email link" off.
8. Click **Save**.

## Part 2: let each account save its progress

1. In the left menu click **Build**, then **Firestore Database**.
2. Open the **Rules** tab.
3. Delete everything in the box.
4. Open the file `firestore.rules` from the Knight School folder (or https://github.com/alonglazer2020-hue/knight-school/blob/main/firestore.rules), copy all of it, and paste it into the box.
5. Click **Publish**.

## Making your account (on any device)

1. Open https://alonglazer2020-hue.github.io/knight-school/
2. On the Coach page, the **Create account** tab is already selected.
3. Type your **chess.com username**.
4. Pick a **new password for Knight School**. Do NOT use your chess.com password.
5. Type the password again and press **Create account**.
6. Write the password down somewhere safe: there is no email, so it can't be reset.

On your phone (or any other device): open the site, tap **Sign in**, type the same username and password. Everything follows you.

Signing out (Settings → Sign out) removes your progress from that device only; it stays saved in your account.
