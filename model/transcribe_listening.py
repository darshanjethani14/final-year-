import os
import json
from pathlib import Path
from dotenv import load_dotenv
from groq import Groq

# Load keys from the backend .env
load_dotenv(dotenv_path=r"D:\FYP BASED IELTS\backend\.env")

AUDIO_DIR = r"D:\FYP BASED IELTS\backend\Listening_audios"
OUTPUT_FILE = r"D:\FYP BASED IELTS\backend\listening_transcripts.json"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def transcribe_with_groq():
    if not GROQ_API_KEY:
        print("❌ GROQ_API_KEY missing in .env")
        return

    client = Groq(api_key=GROQ_API_KEY)
    
    audio_files = list(Path(AUDIO_DIR).glob("*.mp3")) + list(Path(AUDIO_DIR).glob("*.wav"))
    if not audio_files:
        print(f"❌ No audio files found in {AUDIO_DIR}")
        return

    results = {}
    print(f"🚀 Starting GROQ Whisper Transcription for {len(audio_files)} files...")

    for audio_path in audio_files:
        # Check file size (Groq limit is 25MB)
        file_size_mb = os.path.getsize(audio_path) / (1024 * 1024)
        if file_size_mb > 25:
            print(f"⚠️ Skipping {audio_path.name}: File is {file_size_mb:.1f}MB (Max 25MB for Groq)")
            continue

        print(f"🎧 Transcribing: {audio_path.name} ({file_size_mb:.1f}MB)...")
        
        try:
            with open(audio_path, "rb") as file:
                transcription = client.audio.transcriptions.create(
                    file=(audio_path.name, file.read()),
                    model="whisper-large-v3-turbo", # The fastest Whisper model
                    response_format="text",
                )
                results[audio_path.name] = transcription
                print(f"✅ Success: {audio_path.name}")
        except Exception as e:
            print(f"❌ Failed {audio_path.name}: {e}")

    # Save to JSON
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n✨ DONE! Transcripts saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    transcribe_with_groq()
