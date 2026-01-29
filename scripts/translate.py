
import sys
import json
import io
from googletrans import Translator

# Force stdio to use utf-8, avoiding Windows charmap errors
sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def translate_text(text, target_lang):
    translator = Translator()
    try:
        # Translate to target language
        translated = translator.translate(text, dest=target_lang)
        # Translate to English (for reference)
        english = translator.translate(text, dest='en')
        
        return {
            "original": text,
            "translated": translated.text,
            "english": english.text,
            "targetLang": target_lang
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    # Read from stdin to avoid command line escaping issues on Windows
    try:
        # Check if input is coming from stdin or argv (backward capability optional)
        if not sys.stdin.isatty():
            input_str = sys.stdin.read()
            if not input_str.strip():
                 # Fallback/Debug
                 print(json.dumps({"error": "Empty input"}))
                 sys.exit(0)
            input_data = json.loads(input_str)
        else:
             # Fallback to argv if provided (for testing)
             if len(sys.argv) > 1:
                 input_data = json.loads(sys.argv[1])
             else:
                 print(json.dumps({"error": "No input provided"}))
                 sys.exit(0)

        text = input_data.get("text")
        target = input_data.get("target")
        
        if not text or not target:
            print(json.dumps({"error": "Missing text or target"}))
        else:
            result = translate_text(text, target)
            # Ensure we print utf-8 to stdout
            print(json.dumps(result, ensure_ascii=False))
            
    except Exception as e:
        print(json.dumps({"error": str(e)}))
