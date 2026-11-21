// The sync panel: turn sync on (new code), join with a code from another device, or turn it off.
import { state, pretty, createCode, joinCode, leave, syncNow } from './sync.js';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function ago(t) {
  if (!t) return 'not yet';
  const s = Math.round((Date.now() - t) / 1000);
  return s < 10 ? 'just now' : s < 60 ? `${s} seconds ago` : s < 3600 ? `${Math.round(s / 60)} min ago` : new Date(t).toLocaleString();
}

export function initSyncPanel(button, panel, onRemoteChange) {
  let msg = '';
  function render() {
    const s = state();
    button?.classList.toggle('off', !s.code);
    button?.classList.toggle('warn', !!(s.code && s.error));
    panel.innerHTML = s.code ? `
      <h3>Sync is on</h3>
      <p class="vhint">Your progress is saved online and shared with every device that uses this code:</p>
      <div class="code">${pretty(s.code)}</div>
      <button class="s-copy">Copy code</button>
      <p class="vhint">On your other device, open Knight School, go to <b>Settings</b>, choose <b>I have a code</b> and enter it. Keep the code private, it's the key to your progress.</p>
      <p class="vhint">Last synced: ${ago(s.at)}${s.error ? ` · <span class="err">Problem: ${esc(s.error)}</span>` : ''}</p>
      <div class="row"><button class="s-now primary">Sync now</button><button class="s-off">Turn off here</button></div>`
    : `
      <h3>Sync your progress</h3>
      <p class="vhint">Use Knight School on your phone and PC with the same lessons, puzzle rating, reviews and mistakes. Free, no account needed.</p>
      <button class="s-new primary">Turn on sync (first device)</button>
      <details class="s-joinbox"><summary>I have a code from another device</summary>
        <input class="s-code" placeholder="ABCD-EFGH-JKLM-NPQR-STUV" autocapitalize="characters" autocomplete="off" spellcheck="false">
        <button class="s-join primary">Connect</button></details>`;
    if (msg) panel.insertAdjacentHTML('beforeend', `<p class="vhint ${msg.startsWith('!') ? 'err' : ''}">${esc(msg.replace(/^!/, ''))}</p>`);
    const $ = s2 => panel.querySelector(s2);
    const busy = async (btn, fn) => { btn.disabled = true; btn.textContent = 'Working…'; try { await fn(); } catch (e) { msg = '!' + e.message; } render(); };
    $('.s-new')?.addEventListener('click', e => busy(e.target, async () => { await createCode(); msg = 'Sync is on. Now enter this code on your other device.'; }));
    $('.s-join')?.addEventListener('click', e => busy(e.target, async () => {
      await joinCode($('.s-code').value);
      msg = 'Connected! Your progress from the other device is here now.';
      onRemoteChange();
    }));
    $('.s-now')?.addEventListener('click', e => busy(e.target, async () => { if (await syncNow()) onRemoteChange(); msg = state().error ? '' : 'Synced.'; }));
    $('.s-copy')?.addEventListener('click', async e => { try { await navigator.clipboard.writeText(pretty(state().code)); e.target.textContent = 'Copied ✓'; } catch { e.target.textContent = 'Select the code above to copy'; } });
    $('.s-off')?.addEventListener('click', () => {
      if (!confirm('Stop syncing on this device? Your progress stays here and online; you can reconnect later with the code.')) return;
      leave(); msg = 'Sync is off on this device.'; render();
    });
  }
  if (button) { // popover mode; without a button it renders in place (the Settings page)
    button.onclick = () => { panel.hidden = !panel.hidden; msg = ''; if (!panel.hidden) render(); };
    document.addEventListener('click', e => { if (!panel.hidden && !panel.contains(e.target) && !button.contains(e.target)) panel.hidden = true; });
  }
  render();
  return render;
}
