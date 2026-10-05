/**
 * Mode « assistant seul » : l'application parle directement à Claude avec la clé API
 * de l'utilisateur, sans serveur Aide ni maison connectée. Tout se passe dans le
 * processus principal : la clé ne parvient jamais à l'interface.
 */
import Anthropic from "@anthropic-ai/sdk";

import type { ApiResult, ChatTurn } from "../shared/ipc";

const MODEL = "claude-opus-5-5";
const MAX_TURNS = 30;

const SYSTEM_PROMPT = `Tu es « Aide », l'assistant personnel intelligent d'un foyer, chaleureux, vif et un brin futuriste.
Réponds toujours en français, de façon claire et concise : quelques phrases, des listes courtes si c'est utile. Tes réponses peuvent être lues à voix haute : évite les tableaux et les longs blocs de code.
Tu fonctionnes pour l'instant sans connexion à la maison : tu ne peux ni allumer les lumières, ni régler le chauffage, ni lire des capteurs. Si on te demande une action domotique, explique simplement que la maison n'est pas encore connectée, puis propose ce que tu peux faire maintenant (conseils, organisation, idées de routines à préparer, recettes, rédaction, réponses aux questions).
Tu n'as pas accès à Internet.`;

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

function contextBlock(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `Nous sommes le ${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]} ${d.getFullYear()}, il est ${hh}:${mm}.`;
}

/** Garde une conversation valide : rôles connus, texte non vide, commence et finit par l'utilisateur. */
export function sanitizeTurns(raw: unknown): ChatTurn[] | null {
  if (!Array.isArray(raw)) return null;
  const turns = raw
    .filter(
      (t): t is ChatTurn =>
        !!t &&
        (t.role === "user" || t.role === "assistant") &&
        typeof t.content === "string" &&
        t.content.trim().length > 0,
    )
    .map((t) => ({ role: t.role, content: t.content.slice(0, 20_000) }))
    .slice(-MAX_TURNS);
  while (turns.length && turns[0].role !== "user") turns.shift();
  if (!turns.length || turns[turns.length - 1].role !== "user") return null;
  return turns;
}

function describeError(e: unknown): string {
  if (e instanceof Anthropic.AuthenticationError) return "Clé API refusée. Vérifiez-la dans les réglages.";
  if (e instanceof Anthropic.PermissionDeniedError) return "Cette clé API n'a pas accès à ce modèle.";
  if (e instanceof Anthropic.RateLimitError) return "Trop de demandes en peu de temps. Patientez un instant puis réessayez.";
  if (e instanceof Anthropic.BadRequestError && /credit|balance/i.test(e.message)) {
    return "Crédit insuffisant sur votre compte Anthropic. Ajoutez du crédit sur console.anthropic.com (Billing).";
  }
  if (e instanceof Anthropic.APIConnectionError) return "Pas de connexion à Internet, ou le service est injoignable.";
  if (e instanceof Anthropic.APIError && (e.status ?? 0) >= 500) return "Le service Claude est momentanément indisponible. Réessayez.";
  if (e instanceof Anthropic.APIError) return `Erreur du service Claude (${e.status ?? "?"}).`;
  return "Une erreur inattendue est survenue.";
}

/** Vérifie une clé sans consommer de crédit (lecture des informations du modèle). */
export async function checkApiKey(apiKey: string): Promise<ApiResult<null>> {
  if (!/^sk-ant-[\w-]{20,}$/.test(apiKey.trim())) {
    return { ok: false, status: 400, error: "Ce n'est pas une clé API Anthropic (elle commence par « sk-ant- »)." };
  }
  try {
    await new Anthropic({ apiKey: apiKey.trim(), maxRetries: 1 }).models.retrieve(MODEL);
    return { ok: true, status: 200, data: null };
  } catch (e) {
    return { ok: false, status: e instanceof Anthropic.APIError ? (e.status ?? 0) : 0, error: describeError(e) };
  }
}

const running = new Map<string, AbortController>();

export function cancelChat(requestId: string): void {
  running.get(requestId)?.abort();
}

/**
 * Envoie la conversation à Claude et diffuse la réponse au fil de l'eau via `onText`
 * (texte complet à chaque fois). Ne lève jamais : renvoie un ApiResult.
 */
export async function chat(
  apiKey: string,
  requestId: string,
  rawTurns: unknown,
  onText: (text: string) => void,
): Promise<ApiResult<{ text: string; truncated: boolean }>> {
  const turns = sanitizeTurns(rawTurns);
  if (!turns) return { ok: false, status: 400, error: "Conversation invalide." };

  const controller = new AbortController();
  running.set(requestId, controller);
  let text = "";
  try {
    const client = new Anthropic({ apiKey });
    const stream = client.beta.messages.stream(
      {
        model: MODEL,
        max_tokens: 16000,
        system: [
          // Bloc stable mis en cache ; le contexte variable (date) vient après.
          { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
          { type: "text", text: contextBlock() },
        ],
        messages: turns,
        thinking: { type: "adaptive" },
        output_config: { effort: "low" }, // conversation : réponses rapides
        // Repli automatique côté serveur si le modèle principal décline la requête.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      },
      { signal: controller.signal },
    );
    stream.on("text", (delta) => {
      text += delta;
      onText(text);
    });
    const message = await stream.finalMessage();
    if (message.stop_reason === "refusal") {
      return { ok: false, status: 200, error: "Je ne peux pas répondre à cette demande. Essayez de la reformuler." };
    }
    const finalText = message.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    if (!finalText) return { ok: false, status: 200, error: "Je n'ai rien trouvé à répondre. Pouvez-vous préciser ?" };
    return { ok: true, status: 200, data: { text: finalText, truncated: message.stop_reason === "max_tokens" } };
  } catch (e) {
    if (controller.signal.aborted || e instanceof Anthropic.APIUserAbortError) {
      return { ok: false, status: 499, error: "cancelled", data: { text, truncated: true } };
    }
    return { ok: false, status: e instanceof Anthropic.APIError ? (e.status ?? 0) : 0, error: describeError(e), data: { text, truncated: true } };
  } finally {
    running.delete(requestId);
  }
}
