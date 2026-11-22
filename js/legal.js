// Privacy and terms, in plain words. Keep these true: update them whenever the site starts storing or sending something new.
const UPDATED = 'November 22, 2026';
const page = (title, body) => `<div class="page legal"><h1>${title}</h1><p class="m">Last updated ${UPDATED}</p>${body}
  <p class="sub">Questions? <a href="#/feedback?kind=other">Send us a message</a>.</p></div>`;

export function privacyView(view) {
  view.innerHTML = page('Privacy', `
    <h2>The short version</h2>
    <p>Knight School is free, has no ads, does not sell your data and uses no tracking cookies. Most things stay on your own device.</p>
    <h2>On your device</h2>
    <p>Your lessons, puzzle results, game reviews, settings and chats with the coach are saved in your browser. Voices and the chess engine run on your device; no audio is sent anywhere.</p>
    <h2>If you make an account or turn on sync</h2>
    <p>A copy of your progress is saved in Google Firebase so it can follow you to other devices. Only your account (or someone with your sync code) can read it. Your password goes straight to Firebase's login service; Knight School never sees or stores it in readable form. Accounts use a made-up address built from your chess.com username, so no real email is collected.</p>
    <h2>chess.com and Lichess</h2>
    <p>When you connect your chess.com username, Knight School reads your <b>public</b> ratings and games from chess.com's free public data service. It never asks for your chess.com password. Puzzles come from Lichess's public puzzle service.</p>
    <h2>The AI coach</h2>
    <p>The chat coach only works if you add your own Google AI key. Then your questions, plus the game or position you are asking about and a summary of your ratings and recent games, are sent to Google's Gemini service to get an answer. The key stays on your device. On Google's free plan, Google may use what you send to improve its products.</p>
    <h2>Bug reports and ideas</h2>
    <p>When you send a report we receive your message, the contact you chose to give (if any), your username if you are signed in, and, if you leave the box ticked, the page you were on and your browser type. Reports are only read by the site owner.</p>
    <h2>Deleting your data</h2>
    <p>Signing out removes your progress from that device. To delete your account and everything saved in it, <a href="#/feedback?kind=other">send us a message</a> from your account and we will delete it.</p>`);
}

export function termsView(view) {
  view.innerHTML = page('Terms', `
    <h2>Free, as it is</h2>
    <p>Knight School is a free hobby project. It is provided as it is, without any guarantee. Features can change or stop at any time.</p>
    <h2>Engine and AI advice</h2>
    <p>Move grades come from the Stockfish engine and explanations from rules or an AI model. They are usually right but can be wrong.</p>
    <h2>Be fair</h2>
    <p>Make an account only with your own chess.com username. Don't spam the report form or try to break the site. Accounts that misuse it may be removed.</p>
    <h2>Not affiliated</h2>
    <p>Knight School is not made by, connected to or endorsed by Chess.com, Lichess or Google. Their names belong to their owners and are only used to describe what the site connects to.</p>
    <h2>Open source</h2>
    <p>The site is built with open-source software, including Stockfish and chessground (GPL), and piece sounds from Lichess (AGPL). Its source code is public at <a href="https://github.com/alonglazer2020-hue/knight-school" target="_blank" rel="noopener">GitHub</a>.</p>`);
}
