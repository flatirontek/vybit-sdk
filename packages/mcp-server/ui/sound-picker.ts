// Sound picker view. scripts/build-ui.mjs bundles this into the sound picker HTML,
// which hosts render in a sandboxed iframe for sounds_list results.

import {
  App,
  applyDocumentTheme,
  applyHostFonts,
  applyHostStyleVariables,
  type McpUiHostContext,
} from '@modelcontextprotocol/ext-apps/app-with-deps';
import { soundsFromToolResult, type PickerSound } from '../src/sound-picker-data.js';

const app = new App({ name: 'Vybit sound picker', version: '1.0.0' }, {}, { autoResize: true });
const list = document.getElementById('sounds') as HTMLUListElement;
const statusLine = document.getElementById('status') as HTMLParagraphElement;

// One shared player: starting a sound stops whichever one is playing
const audio = new Audio();
audio.preload = 'none';
let playing: { sound: PickerSound; button: HTMLButtonElement } | null = null;

function applyHostContext(context: McpUiHostContext | undefined) {
  if (!context) return;
  if (context.theme) applyDocumentTheme(context.theme);
  if (context.styles?.variables) applyHostStyleVariables(context.styles.variables);
  if (context.styles?.css?.fonts) applyHostFonts(context.styles.css.fonts);
}

function setStatus(message: string) {
  statusLine.textContent = message;
  statusLine.hidden = message === '';
}

function showStopped() {
  if (!playing) return;
  playing.button.textContent = '▶';
  playing.button.setAttribute('aria-pressed', 'false');
  playing.button.setAttribute('aria-label', `Play ${playing.sound.name}`);
  playing = null;
}

function togglePlay(sound: PickerSound, button: HTMLButtonElement, card: HTMLElement) {
  const wasThis = playing?.sound.key === sound.key;
  audio.pause();
  showStopped();
  if (wasThis || !sound.playUrl) return;

  card.classList.remove('failed');
  audio.src = sound.playUrl;
  playing = { sound, button };
  button.textContent = '■';
  button.setAttribute('aria-pressed', 'true');
  button.setAttribute('aria-label', `Stop ${sound.name}`);
  audio.play().catch(() => {
    if (playing?.sound.key !== sound.key) return;
    showStopped();
    card.classList.add('failed');
  });
}

audio.addEventListener('ended', showStopped);
audio.addEventListener('error', () => {
  if (!playing) return;
  playing.button.closest('.card')?.classList.add('failed');
  showStopped();
});

async function useSound(sound: PickerSound, button: HTMLButtonElement) {
  button.disabled = true;
  let sent = false;
  try {
    const result = await app.sendMessage({
      role: 'user',
      content: [{ type: 'text', text: `Use the sound "${sound.name}" (soundKey ${sound.key}).` }],
    });
    sent = !result.isError;
  } catch {
    // not delivered; leave the button usable
  }
  button.textContent = sent ? 'Chosen' : 'Use this sound';
  button.disabled = sent;
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string) {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function renderCard(sound: PickerSound, canSendMessage: boolean): HTMLLIElement {
  const card = element('li', 'card');

  const play = element('button', 'play', '▶');
  play.type = 'button';
  play.setAttribute('aria-pressed', 'false');
  play.setAttribute('aria-label', `Play ${sound.name}`);
  play.disabled = !sound.playUrl;
  play.addEventListener('click', () => togglePlay(sound, play, card));

  const body = element('div', 'body');
  body.append(element('h3', 'name', sound.name));
  if (sound.description) body.append(element('p', 'description', sound.description));

  const credit = [sound.author && `by ${sound.author}`, sound.license].filter(Boolean).join(' · ');
  if (credit || sound.sourceUrl) {
    const line = element('p', 'credit', credit);
    if (sound.sourceUrl) {
      const link = element('button', 'link', 'Freesound');
      link.type = 'button';
      link.addEventListener('click', () => { app.openLink({ url: sound.sourceUrl! }).catch(() => {}); });
      if (credit) line.append(' · ');
      line.append(link);
    }
    body.append(line);
  }
  body.append(element('p', 'error', "This sound couldn't be played here."));

  card.append(play, body);

  if (canSendMessage) {
    const use = element('button', 'use', 'Use this sound');
    use.type = 'button';
    use.addEventListener('click', () => useSound(sound, use));
    card.append(use);
  } else {
    card.append(element('code', 'sound-key', sound.key));
  }
  return card;
}

function render(sounds: PickerSound[]) {
  audio.pause();
  showStopped();
  list.replaceChildren();
  if (sounds.length === 0) {
    setStatus('No sounds matched.');
    return;
  }
  setStatus('');
  const canSendMessage = Boolean(app.getHostCapabilities()?.message);
  list.append(...sounds.map((sound) => renderCard(sound, canSendMessage)));
}

app.onhostcontextchanged = applyHostContext;
app.ontoolinput = () => setStatus('Finding sounds…');
app.ontoolcancelled = () => setStatus('Sound search was cancelled.');
app.ontoolresult = (result) => {
  if (result.isError) {
    list.replaceChildren();
    setStatus("Sounds couldn't be loaded.");
    return;
  }
  render(soundsFromToolResult(result));
};
app.onteardown = async () => {
  audio.pause();
  return {};
};

app.connect()
  .then(() => applyHostContext(app.getHostContext()))
  .catch(() => setStatus("This view couldn't connect to the conversation."));
