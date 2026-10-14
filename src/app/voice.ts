/* ================= the microphone =================
   Speech to text by the browser itself (Web Speech API: Chrome and Android, Safari on iPhone), in Brazilian
   Portuguese. Nothing of ours runs on a server; the browser may send the audio to its maker's service to turn it into
   text. What comes back is read by Core.hear. Where the browser has no speech recognition, the button does not appear. */
type Recognition = { lang: string; interimResults: boolean; maxAlternatives: number; start(): void; stop(): void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: ((e: { error: string }) => void) | null };
type RecognitionCtor = new () => Recognition;
const ctor = (): RecognitionCtor | undefined => {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition || w.webkitSpeechRecognition;
};
export const canListen = (): boolean => !!ctor();
let current: Recognition | null = null;
/** Listens once: `heard` gets what was said; `done` runs when the microphone turns off (with an error, if any). */
export function listen(heard: (text: string) => void, done: (error?: string) => void): void {
  const C = ctor();
  if (!C) { done('sem reconhecimento de voz'); return; }
  if (current) { current.stop(); return; }
  const r = new C();
  r.lang = 'pt-BR'; r.interimResults = false; r.maxAlternatives = 1;
  let err: string | undefined;
  r.onresult = e => heard(Array.from(e.results).map(x => x[0].transcript).join(' '));
  r.onerror = e => { err = e.error; };
  r.onend = () => { current = null; done(err); };
  current = r;
  try { r.start(); } catch (e) { current = null; done('não deu pra ligar o microfone'); }
}
