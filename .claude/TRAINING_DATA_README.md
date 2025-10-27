# Dark Renaissance Training Data - Gemini Format

## Overview
This directory contains training data for fine-tuning Gemini models with the Dark Renaissance corpus focused on ecological collapse, decolonial futures, and systems thinking.

## Files

### `model_finetune_darkregenaissance.json`
- **Format**: Standard JSON
- **Content**: Complete corpus with 26 sources including metadata and extracted content
- **Size**: ~932 KB
- **Sources Included**:
  - Jem Bendell (4 sources): Deep Adaptation, climate trauma, collapse acceptance
  - Nora Bateson (3 sources): Symmathesy, warm data, systems thinking
  - Vandana Shiva (4 sources): Biopiracy, seed sovereignty, ecofeminism
  - GTDF Collective (4 sources): Hospicing modernity, decolonial futures
  - adrienne maree brown (4 sources): Emergent strategy, transformative justice
  - Starhawk (5 sources): Earth activism, permaculture, magical activism
  - Aiden Cinnamon Tea (2 sources): Decolonial AI perspectives

### `SFT Train Data.jsonl`
- **Format**: JSON Lines (JSONL) - Gemini training format
- **Content**: 75 training examples derived from the corpus
- **Size**: Variable, each line is a complete JSON object
- **Structure**: Each line contains:
  ```json
  {
    "contents": [
      {"role": "user", "parts": [{"text": "question prompt"}]},
      {"role": "model", "parts": [{"text": "response content"}]}
    ]
  }
  ```

## Training Examples

The JSONL file contains 3 types of training examples for each source:

1. **Direct Content Query**: "What does [author] say about [topics] in '[title]'?"
2. **Perspective Explanation**: "Explain [author]'s perspective on [topic] from '[title]'."
3. **Theme Summary**: "What are the key themes in [author]'s work on [topics]?"

## Thematic Focus

The corpus covers these interconnected themes:
- Ecological collapse and regeneration
- Systems thinking and complexity
- Decolonial perspectives
- Ecofeminism and primordial feminine
- Hospicing modernity
- Indigenous wisdom
- Critique of extractive capitalism
- Deep time perspectives
- Mycological network intelligence
- Subversive movements

## Usage

### For Gemini Fine-Tuning

1. The `SFT Train Data.jsonl` file is ready to use with Google's Gemini fine-tuning API
2. Each line represents a complete training example
3. The format follows Gemini's supervised fine-tuning (SFT) requirements

### Validation

To validate the JSONL format:
```bash
# Check line count
wc -l "SFT Train Data.jsonl"

# Validate JSON on first line
head -n 1 "SFT Train Data.jsonl" | python3 -m json.tool
```

## Content Extraction

Content was extracted from the following URL types:
- Academic papers (PDF and HTML)
- Blog posts and essays
- Interview transcripts
- Podcast transcripts
- Academic journal articles

All content was cleaned and formatted to remove:
- Excessive whitespace
- Navigation elements
- Headers and footers
- Script and style tags

## Limitations

- One source (GTDF-001: Rizoma Freireano article) failed during extraction due to connection issues
- PDF content was processed using PyPDF2 for text extraction
- Some sources contain very large amounts of text (>100K characters) and were chunked appropriately

## License & Attribution

All sources are publicly available materials. Each entry in `model_finetune_darkregenaissance.json` includes:
- Original source URL
- Author attribution
- Publication date
- Copyright status
- Significance notes

Users should respect the original authors' copyright and licensing terms.

## Last Updated

October 27, 2025

## Contact

For questions about this training data or the Dark Renaissance project, refer to the project README.

