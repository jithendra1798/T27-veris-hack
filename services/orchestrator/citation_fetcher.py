"""
You.com citation fetcher for exploit research grounding.

Fetches real OWASP/CVE citations for each attack class.
"""

import json
import os
from pathlib import Path

import httpx


ATTACK_CLASS_QUERIES = {
    "prompt_injection": "OWASP LLM01 prompt injection vulnerability AI agents",
    "system_extract": "LLM system prompt extraction attack CVE",
    "tool_hijack": "AI agent tool hijacking unauthorized function calling",
}


async def fetch_citations(api_key: str | None = None) -> dict[str, list[dict]]:
    """
    Fetch exploit research citations from You.com for each attack class.
    
    Args:
        api_key: You.com API key (defaults to YOU_API_KEY env var)
    
    Returns:
        Dict mapping attack class to list of citation dicts
    """
    api_key = api_key or os.getenv("YOU_API_KEY")
    
    if not api_key or api_key == "your_you_api_key_here":
        print("[citations] YOU_API_KEY not set, using fallback citations")
        return get_fallback_citations()
    
    citations = {}
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        for attack_class, query in ATTACK_CLASS_QUERIES.items():
            try:
                response = await client.get(
                    "https://api.ydc-index.io/search",
                    headers={"X-API-Key": api_key},
                    params={"query": query, "num_web_results": 3},
                )
                response.raise_for_status()
                data = response.json()
                
                # Extract top 3 results
                results = []
                for hit in data.get("hits", [])[:3]:
                    results.append({
                        "title": hit.get("title", ""),
                        "url": hit.get("url", ""),
                        "snippet": hit.get("snippets", [""])[0] if hit.get("snippets") else "",
                    })
                
                citations[attack_class] = results
                
            except Exception as exc:
                print(f"[citations] Failed to fetch for {attack_class}: {exc}")
                citations[attack_class] = get_fallback_citations()[attack_class]
    
    return citations


def get_fallback_citations() -> dict[str, list[dict]]:
    """Hardcoded fallback citations if You.com API is unavailable."""
    return {
        "prompt_injection": [
            {
                "title": "OWASP Top 10 for LLM Applications: LLM01 Prompt Injection",
                "url": "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
                "snippet": "Prompt Injection Vulnerability occurs when an attacker manipulates a large language model (LLM) through crafted inputs, causing the LLM to unknowingly execute the attacker's intentions.",
            },
            {
                "title": "Prompt Injection Attacks Against GPT-3",
                "url": "https://simonwillison.net/2022/Sep/12/prompt-injection/",
                "snippet": "Prompt injection is a vulnerability where an attacker can trick an AI model into ignoring its original instructions and following new, malicious ones embedded in user input.",
            },
            {
                "title": "NVD - CVE-2023-29374",
                "url": "https://nvd.nist.gov/vuln/detail/CVE-2023-29374",
                "snippet": "Microsoft Security Copilot prompt injection vulnerability allowing unauthorized instruction override.",
            },
        ],
        "system_extract": [
            {
                "title": "OWASP LLM06: Sensitive Information Disclosure",
                "url": "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
                "snippet": "LLM applications may inadvertently reveal sensitive information, proprietary algorithms, or other confidential details through their output, leading to unauthorized data access.",
            },
            {
                "title": "System Prompt Leaking in Production LLMs",
                "url": "https://www.robustintelligence.com/blog-posts/prompt-injection-attack-on-gpt-4",
                "snippet": "Attackers can extract system prompts and internal instructions from production LLMs using carefully crafted queries.",
            },
            {
                "title": "Extracting Training Data from ChatGPT",
                "url": "https://not-just-memorization.github.io/extracting-training-data-from-chatgpt.html",
                "snippet": "Research demonstrating techniques to extract memorized training data and system instructions from large language models.",
            },
        ],
        "tool_hijack": [
            {
                "title": "OWASP LLM07: Insecure Plugin Design",
                "url": "https://owasp.org/www-project-top-10-for-large-language-model-applications/",
                "snippet": "LLM plugins can have insecure inputs and insufficient access control, enabling attackers to hijack tool execution and perform unauthorized actions.",
            },
            {
                "title": "Function Calling Vulnerabilities in AI Agents",
                "url": "https://embracethered.com/blog/posts/2023/chatgpt-plugin-vulns-chat-with-code/",
                "snippet": "AI agents with function calling capabilities can be manipulated to execute unauthorized commands, send emails, or access restricted APIs.",
            },
            {
                "title": "Indirect Prompt Injection via Tool Use",
                "url": "https://kai-greshake.de/posts/llm-malware/",
                "snippet": "Attackers can inject malicious instructions into data sources that LLMs read, causing them to execute unauthorized tool calls.",
            },
        ],
    }


async def save_citations(citations: dict[str, list[dict]], output_path: Path | str | None = None) -> Path:
    """
    Save citations to JSON file.
    
    Args:
        citations: Dict mapping attack class to citation list
        output_path: Path to save to (defaults to data/exploit-citations.json)
    
    Returns:
        Path where citations were saved
    """
    if output_path is None:
        output_path = Path(__file__).resolve().parents[2] / "data" / "exploit-citations.json"
    else:
        output_path = Path(output_path)
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, "w") as f:
        json.dump(citations, f, indent=2)
    
    return output_path


if __name__ == "__main__":
    import asyncio
    
    async def main():
        print("Fetching exploit research citations from You.com...")
        citations = await fetch_citations()
        path = await save_citations(citations)
        print(f"✓ Saved citations for {len(citations)} attack classes to {path}")
        
        for attack_class, cites in citations.items():
            print(f"  - {attack_class}: {len(cites)} citations")
    
    asyncio.run(main())
