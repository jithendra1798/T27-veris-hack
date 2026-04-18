#!/usr/bin/env python3
"""
Generate demo data for GAUNTLET competition.

Runs Veris-style scenario generation and You.com citation fetching.
"""

import asyncio
import sys
from pathlib import Path

# Add parent to path so we can import from services
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services.orchestrator.citation_fetcher import fetch_citations, save_citations
from services.orchestrator.veris_generator import generate_scenarios, save_scenarios


async def main():
    print("=" * 60)
    print("GAUNTLET Demo Data Generator")
    print("=" * 60)
    print()
    
    # Generate Veris scenarios
    print("📝 Generating Veris-style attack scenarios...")
    try:
        scenarios = await generate_scenarios(count=10)
        scenario_path = await save_scenarios(scenarios)
        print(f"✅ Saved {len(scenarios)} scenarios to {scenario_path}")
        print()
        print("Scenarios:")
        for s in scenarios:
            print(f"  • {s['id']}: {s['persona']} ({s['class']})")
        print()
    except Exception as exc:
        print(f"❌ Failed to generate scenarios: {exc}")
        print("   Make sure OPENAI_API_KEY is set in .env")
        return 1
    
    # Fetch You.com citations
    print("🔍 Fetching exploit research citations...")
    try:
        citations = await fetch_citations()
        citation_path = await save_citations(citations)
        print(f"✅ Saved citations for {len(citations)} attack classes to {citation_path}")
        print()
        print("Citations:")
        for attack_class, cites in citations.items():
            print(f"  • {attack_class}: {len(cites)} citations")
            for cite in cites:
                print(f"    - {cite['title'][:60]}...")
        print()
    except Exception as exc:
        print(f"⚠️  Citation fetch failed (using fallbacks): {exc}")
        print()
    
    print("=" * 60)
    print("✅ Demo data generation complete!")
    print("=" * 60)
    print()
    print("Next steps:")
    print("  1. Restart the orchestrator: python -m uvicorn services.orchestrator.main:app --reload")
    print("  2. Reload scenarios: curl -X POST http://localhost:8000/scenarios/reload")
    print("  3. Run an attack: curl -X POST http://localhost:8000/attack/run -H 'Content-Type: application/json' -d '{\"max_attacks\": 5}'")
    print()
    
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
