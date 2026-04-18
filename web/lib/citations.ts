import { readFile } from "node:fs/promises";
import path from "node:path";
import type { CitationLookup } from "./citation-types";

const CITATIONS_PATH = path.join(
  process.cwd(),
  "..",
  "data",
  "exploit-citations.json",
);

/**
 * Hardcoded fallback citations used until Vince commits
 * data/exploit-citations.json at minute 75.
 */
const FALLBACK_CITATIONS: CitationLookup = {
  prompt_injection: [
    {
      title: "OWASP LLM01: Prompt Injection",
      source: "OWASP Foundation",
      url: "https://genai.owasp.org/llmrisk/llm01-prompt-injection/",
      note: "Direct and indirect prompt injection remains the #1 risk for LLM applications, enabling attackers to override system instructions.",
    },
    {
      title: "Universal and Transferable Adversarial Attacks on Aligned LLMs",
      source: "Zou et al., 2023",
      url: "https://arxiv.org/abs/2307.15043",
      note: "Automated adversarial suffixes can reliably jailbreak aligned language models across providers.",
    },
  ],
  system_extract: [
    {
      title: "System Prompt Extraction Techniques",
      source: "OWASP LLM Top 10",
      url: "https://genai.owasp.org/llmrisk/llm07-insecure-output-handling/",
      note: "Attackers use social engineering patterns to trick models into revealing their system prompts and internal configuration.",
    },
    {
      title: "Prompt Leak: Extracting System Prompts from Production LLMs",
      source: "Perez & Ribeiro, 2024",
      url: "https://arxiv.org/abs/2311.01011",
      note: "Production LLM deployments are broadly vulnerable to prompt extraction through multi-turn conversation strategies.",
    },
  ],
  tool_hijack: [
    {
      title: "OWASP LLM07: Insecure Plugin Design",
      source: "OWASP Foundation",
      url: "https://genai.owasp.org/llmrisk/llm07-insecure-plugin-design/",
      note: "LLM plugins that execute actions without proper authorization checks can be hijacked through adversarial prompts.",
    },
    {
      title: "Garak: LLM Vulnerability Scanner",
      source: "NVIDIA / leondz",
      url: "https://github.com/leondz/garak",
      note: "Open-source red-teaming framework that probes LLM tool-use surfaces for hijack and misuse vulnerabilities.",
    },
  ],
};

/**
 * Load citations from the pre-fetched JSON file.
 * Falls back to hardcoded citations if the file isn't ready yet.
 *
 * Called from the server component (page.tsx) so it runs at request time.
 */
export async function loadCitations(): Promise<CitationLookup> {
  try {
    const raw = await readFile(CITATIONS_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Record<
      string,
      | { title?: string; source?: string; url?: string; summary?: string; note?: string }
      | Array<{ title?: string; source?: string; url?: string; summary?: string; note?: string }>
    >;

    const lookup: CitationLookup = {};

    for (const [attackClass, value] of Object.entries(parsed)) {
      const items = Array.isArray(value) ? value : [value];
      lookup[attackClass] = items.map((item) => ({
        title: item.title ?? "Research citation",
        source: item.source ?? "You.com",
        url: item.url ?? "#",
        note: item.note ?? item.summary ?? "",
      }));
    }

    return lookup;
  } catch {
    return FALLBACK_CITATIONS;
  }
}
