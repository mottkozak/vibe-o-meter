Data Contracts

All quiz data must be loaded from JSON files located in:
public/data/

compasses.json

Defines axes and compass structure.

Example:
{
  "axes": {
    "VW": { "posLabel": "Viking", "negLabel": "Wizard" }
  }
}

questions.json

Contains the entire quiz.

Structure:
{
  "id": "q01",
  "compassId": "power",
  "prompt": "A crisis appears. What do you do?",
  "answers": [
    {
      "text": "Jump in and help",
      "delta": { "VW": 2, "HG": 2 }
    }
  ]
}

type-titles.json

Defines archetype titles.

Structure:
{
  "families": {
    "VH": {
      "familyName": "Warrior Hero",
      "titles16": []
    }
  }
}

quadrant_writeups.json

Defines descriptions used to generate results.

Structure:
{
  "power.warriorHero": {
    "headline": "...",
    "strengths": [],
    "pitfalls": [],
    "oneLiner": "...",
    "celebs": []
  }
}

results-content.json (optional)

General UI text for results and landing (e.g. disclaimer, button text). Use sensible defaults if missing.

