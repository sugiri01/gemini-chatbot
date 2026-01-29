
import sys
import os
import json
import io
import warnings

# Suppress FP16 warning on CPU
warnings.filterwarnings("ignore")

# Force utf-8
sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding='utf-8')
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Configure FFmpeg Path
if sys.platform == "win32":
    user_ffmpeg_path = r"H:\2024 Downloads\ffmpeg-8.0.1-essentials_build\ffmpeg-8.0.1-essentials_build\bin"
    user_ffmpeg_exe = os.path.join(user_ffmpeg_path, "ffmpeg.exe")
else:
    # Linux/Mac: Assume ffmpeg is in PATH
    user_ffmpeg_path = ""
    user_ffmpeg_exe = "ffmpeg"

# Set PATH with FFmpeg at the front (only for Windows or if path is set)
if user_ffmpeg_path and os.path.exists(user_ffmpeg_path):
    os.environ["PATH"] = user_ffmpeg_path + os.pathsep + os.environ.get("PATH", "")
    
# Also set FFMPEG_BINARY for libraries that look for it
if sys.platform == "win32" and os.path.exists(user_ffmpeg_exe):
    os.environ["FFMPEG_BINARY"] = user_ffmpeg_exe
    os.environ["FFMPEG"] = user_ffmpeg_exe

def text_to_speech(text, lang='en', filename='output.mp3'):
    try:
        from gtts import gTTS  # Lazy import to speed up startup
        tts = gTTS(text=text, lang=lang, slow=False)
        tts.save(filename)
        return {"success": True, "file": filename}
    except Exception as e:
        return {"error": str(e)}

def speech_to_text(audio_path):
    try:
        # Explicitly set ffmpeg path before importing whisper
        import subprocess
        
        # Verify ffmpeg works before loading whisper
        try:
            result = subprocess.run(
                [user_ffmpeg_exe, "-version"],
                capture_output=True,
                timeout=5
            )
            if result.returncode != 0:
                return {"error": f"FFmpeg test failed: {result.stderr.decode()}"}
        except Exception as e:
            return {"error": f"FFmpeg not accessible: {str(e)}. Path: {user_ffmpeg_exe}"}
        
        # Now import and use whisper
        import whisper
        
        # Monkey-patch whisper to use our ffmpeg
        # Whisper uses ffmpeg-python which looks for ffmpeg in PATH
        # We've already set PATH, but let's also try setting it in whisper's subprocess calls
        original_popen = subprocess.Popen
        def patched_popen(*args, **kwargs):
            if 'env' not in kwargs:
                kwargs['env'] = os.environ.copy()
            kwargs['env']['PATH'] = user_ffmpeg_path + os.pathsep + kwargs['env'].get('PATH', '')
            return original_popen(*args, **kwargs)
        
        subprocess.Popen = patched_popen
        
        model = whisper.load_model("base")
        result = model.transcribe(audio_path)
        
        # Restore original Popen
        subprocess.Popen = original_popen
        
        return {"text": result["text"]}
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Invalid arguments"}))
        sys.exit(1)

    command = sys.argv[1]

    if command == "tts":
        if len(sys.argv) < 4: 
             print(json.dumps({"error": "Missing TTS args"}))
        else:
             text = sys.argv[2]
             if len(sys.argv) >= 5:
                lang = sys.argv[3]
                filename = sys.argv[4]
             else:
                lang = 'en'
                filename = sys.argv[3]
                
             res = text_to_speech(text, lang, filename)
             print(json.dumps(res))

    elif command == "stt":
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Missing STT args"}))
        else:
            audio_path = sys.argv[2]
            res = speech_to_text(audio_path)
            print(json.dumps(res))
    
    else:
        print(json.dumps({"error": "Unknown command"}))
