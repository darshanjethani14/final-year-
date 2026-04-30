"""
Flask AI Server for IELTS Evaluation
=====================================
Serves 3 endpoints:
  POST /evaluate          → Speaking evaluation  (Final_Speaking_Model)
  POST /evaluate-writing  → Writing evaluation   (Final_Writing_Model)
  POST /evaluate-reading  → Reading band score   (rule-based, no model needed)
  GET  /health            → Health check

Run:  python app.py
Port: 5001
"""

import os
import gc
import re
import json
import torch
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForCausalLM
import requests as http_client
import azure.cognitiveservices.speech as speechsdk
import time
import uuid
import urllib3
from dotenv import load_dotenv

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
load_dotenv()
AZURE_SPEECH_KEY    = os.getenv("AZURE_SPEECH_KEY", "")
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION", "")

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# ── Model paths (relative to this file) ──────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SPEAKING_MODEL_PATH = os.path.join(BASE_DIR, "Final_Speaking_Model", "content", "drive", "MyDrive", "IELTS_Project_Speaking", "Final_Speaking_Model")
WRITING_MODEL_PATH  = os.path.join(BASE_DIR, "Final_Writing_Model")  # new fine-tuned writing model
MERGED_MODEL_PATH   = os.path.join(BASE_DIR, "merged_model")

# Force CPU (no GPU on this machine)
DEVICE = "cpu"

def score_to_band(score: int, total: int) -> float:
    """Convert raw reading score to IELTS band using the specific mapping table."""
    if total <= 0: return 2.0
    
    # Scale to 40 and round to nearest 0.5 increment
    scaled_score = round(((score / total) * 40) * 2) / 2
    
    if scaled_score >= 39: return 9.0
    elif scaled_score >= 37: return 8.5
    elif scaled_score >= 35: return 8.0
    elif scaled_score >= 33: return 7.5
    elif scaled_score >= 30: return 7.0
    elif scaled_score >= 27: return 6.5
    elif scaled_score >= 23: return 6.0
    elif scaled_score >= 19: return 5.5
    elif scaled_score >= 15: return 5.0
    elif scaled_score >= 13: return 4.5
    elif scaled_score >= 10: return 4.0
    elif scaled_score >= 8:  return 3.5
    elif scaled_score >= 6:  return 3.0
    elif scaled_score >= 4:  return 2.5
    else: return 2.0


def band_to_feedback(band: float) -> str:
    if band >= 8.5:
        return "Excellent! You have demonstrated near-perfect reading comprehension."
    if band >= 7.5:
        return "Very Good. You show strong understanding of complex academic texts."
    if band >= 6.5:
        return "Good. You handle most academic reading well. Focus on inference and detail questions."
    if band >= 5.5:
        return "Competent. You understand overall meaning but miss important details. Practice skimming & scanning."
    if band >= 4.5:
        return "Modest. You grasp main ideas but struggle with specific details. Work on vocabulary and reading speed."
    return "Limited. Focus on building vocabulary and practising with graded reading materials."


# ── Lazy model loader ─────────────────────────────────────────────────────────

def load_model(model_path: str):
    """Load tokenizer + model from path, returns (tokenizer, model)."""
    print(f"[Flask] Loading tokenizer from: {model_path}")
    tokenizer = AutoTokenizer.from_pretrained(model_path)

    print(f"[Flask] Loading model from: {model_path}  (this may take ~1–2 min)")
    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        torch_dtype=torch.float32,  # float32 is necessary for CPU
        low_cpu_mem_usage=True,
    ).to(DEVICE)
    model.eval()
    print(f"[Flask] ✅ Model loaded successfully.")
    return tokenizer, model


def unload_model(tokenizer, model):
    """Free model from RAM."""
    del model
    del tokenizer
    gc.collect()
    torch.cuda.empty_cache()  # no-op on CPU but kept for safety


def generate(tokenizer, model, prompt: str, max_new_tokens: int = 200) -> str:
    """Run inference and return only the newly generated text."""
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1024).to(DEVICE)
    with torch.no_grad():
        output = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            temperature=0.3,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
            repetition_penalty=1.1,
        )
    new_tokens = output[0][inputs["input_ids"].shape[1]:]
    return tokenizer.decode(new_tokens, skip_special_tokens=True).strip()


# ── Prompt builders ───────────────────────────────────────────────────────────

def build_speaking_prompt(question: str, answer: str) -> str:
    return f"""You are a certified IELTS speaking examiner. Evaluate the candidate's response strictly.

Question: {question}

Candidate Response: {answer}

Provide numeric scores (0-9) and brief feedback for each criterion in JSON format:
{{
  "fluency": <score>,
  "fluency_feedback": "<one sentence>",
  "lexical": <score>,
  "lexical_feedback": "<one sentence>",
  "grammar": <score>,
  "grammar_feedback": "<one sentence>",
  "pronunciation": <score>,
  "pronunciation_feedback": "<one sentence>",
  "overall": <average band score>,
  "summary": "<2-3 sentences of overall feedback>"
}}

JSON Output:"""


# ── Official IELTS rubrics ────────────────────────────────────────────────────

TASK1_RUBRIC = """IELTS Writing Task 1 — Official Scoring Criteria (Band 1–9):
1. TASK ACHIEVEMENT: Covers all requirements; key features selected and illustrated.
2. COHERENCE & COHESION: Message easy to follow; paragraphing logical.
3. LEXICAL RESOURCE: Range and accuracy of vocabulary.
4. GRAMMATICAL RANGE & ACCURACY: Range and accuracy of grammar."""

TASK2_RUBRIC = """IELTS Writing Task 2 — Official Scoring Criteria (Band 1–9):
1. TASK RESPONSE: Addresses prompt fully; clear position presented and supported.
2. COHERENCE & COHESION: Logical flow; cohesive devices used effectively.
3. LEXICAL RESOURCE: Range and accuracy of vocabulary.
4. GRAMMATICAL RANGE & ACCURACY: Range and accuracy of grammar."""

# Per-criterion descriptor so the model knows exactly what to look for
CRITERION_DESC = {
    "Task Achievement": (
        "Does the response cover ALL key features of the task? Are the main trends/comparisons "
        "highlighted and supported with data? Is the response at least 150 words?"
    ),
    "Task Response": (
        "Does the essay address ALL parts of the question? Is there a clear position/argument "
        "that is developed and supported throughout? Is the response at least 250 words?"
    ),
    "Coherence & Cohesion": (
        "Is the message easy to follow? Are ideas logically sequenced? Are cohesive devices "
        "(e.g., however, furthermore, in contrast) used accurately and not overused? "
        "Is paragraphing appropriate?"
    ),
    "Lexical Resource": (
        "Is there a wide range of vocabulary? Are words used with correct collocation and spelling? "
        "Are less common or topic-specific words used appropriately?"
    ),
    "Grammatical Range & Accuracy": (
        "Is there a mix of simple and complex sentence structures? Are grammar and punctuation "
        "mostly accurate? Do errors affect communication?"
    ),
}

# ── Writing: tightly-targeted prompt helpers ──────────────────────────────────

def _essay_header(task: str, answer: str) -> str:
    """Shared essay context block, trimmed to avoid context overflow."""
    essay_trimmed = str(answer).strip()[:450]
    return (
        f"### Essay Prompt\n{str(task).strip()}\n\n"
        f"### Student Essay\n{essay_trimmed}\n\n"
    )


def build_band_prompt(task: str, answer: str, criterion: str, task_type=2) -> str:
    """Ask for ONLY a band score (1-9) for one criterion.
    Includes the official rubric + per-criterion descriptor so scoring is grounded."""
    rubric = TASK1_RUBRIC if str(task_type) == "1" else TASK2_RUBRIC
    desc   = CRITERION_DESC.get(criterion, "")
    return (
        f"You are a certified IELTS examiner.\n\n"
        f"### Official Scoring Rubric\n{rubric}\n\n"
        f"### Criterion Being Scored\n{criterion}: {desc}\n\n"
        + _essay_header(task, answer)
        + f"### {criterion} Band Score (1–9, use 0.5 increments):\n"
    )

def build_overall_band_prompt(task: str, answer: str, task_type=2) -> str:
    """Ask for a single overall band score (1-9) for the entire essay."""
    rubric = TASK1_RUBRIC if str(task_type) == "1" else TASK2_RUBRIC
    return (
        f"You are a certified IELTS examiner.\n\n"
        f"### Official Scoring Rubric\n{rubric}\n\n"
        + _essay_header(task, answer)
        + f"### Overall IELTS Writing Band Score (STRICTLY 1.0 to 9.0, e.g., 6.5):\n"
    )


def build_feedback_prompt(task: str, answer: str, criterion: str, band: float, task_type=2) -> str:
    """Ask for 1-2 sentences of specific, essay-grounded feedback for a criterion."""
    rubric = TASK1_RUBRIC if str(task_type) == "1" else TASK2_RUBRIC
    desc   = CRITERION_DESC.get(criterion, "")
    return (
        f"You are a certified IELTS examiner.\n\n"
        f"### Official Scoring Rubric\n{rubric}\n\n"
        f"### Criterion\n{criterion} (Band {band}): {desc}\n\n"
        + _essay_header(task, answer)
        + f"### {criterion} Feedback — 1 to 2 sentences referencing specific parts of the essay above:\n"
    )




def _extract_band(text: str) -> float:
    """Pull the first valid IELTS band number (1.0 – 9.0) from text."""
    for m in re.findall(r'\b(\d+(?:\.5)?)', text):
        v = float(m)
        if 1.0 <= v <= 9.0:
            return round(v * 2) / 2   # snap to nearest 0.5
    return 5.0   # safe default


def _clean_feedback(text: str) -> str:
    """Strip markup artifacts and take only the first 2 sentences."""
    # Remove repeating markdown headers like '### …'
    text = re.sub(r'#+\s*\S.*', '', text)
    # Remove lines that start with repeated punctuation / numeric patterns
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    # Drop lines that look like new prompt headers
    lines = [l for l in lines if not re.match(r'^(Overall|Band|###|Essay|Student|Prompt|Feedback)', l, re.I)]
    combined = ' '.join(lines)
    # Take first 2 sentences
    sentences = re.split(r'(?<=[.!?])\s+', combined)
    return ' '.join(sentences[:2]).strip() or combined[:200].strip()




# ── JSON parser with fallback ─────────────────────────────────────────────────

def extract_json(text: str) -> dict:
    """Try to parse JSON from model output, with regex fallback."""
    import json, re
    clean = re.sub(r'```(?:json)?|```', '', text).strip()
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        pass

    start = clean.find('{')
    end = clean.rfind('}')
    if start != -1 and end != -1 and start < end:
        substr = clean[start:end+1]
        try:
            return json.loads(substr)
        except json.JSONDecodeError:
            try:
                fixed = re.sub(r',\s*}', '}', substr)
                return json.loads(fixed)
            except json.JSONDecodeError:
                pass

    # Fallback: parse values using regex if JSON fails
    def extract_val(pattern):
        m = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        return m.group(1).strip() if m else None

    # Try to get overall score first
    overall = (
        extract_val(r'"overall"\s*:\s*([\d.]+)')
        or extract_val(r'overall\s*(?:band)?\s*(?:score)?\s*[:\-]\s*([\d.]+)')
    )
    
    # Build a dictionary by scanning for common keys
    res = {
        "overall": float(overall) if overall else 5.0,
        "fluency": extract_val(r'fluency["\s]*[:\-]\s*([\d.]+)'),
        "fluency_feedback": extract_val(r'fluency_feedback["\s]*[:\-]\s*["\']?(.*?)["\']?(?:\n|,|$)'),
        "lexical": extract_val(r'lexical["\s]*[:\-]\s*([\d.]+)'),
        "lexical_feedback": extract_val(r'lexical_feedback["\s]*[:\-]\s*["\']?(.*?)["\']?(?:\n|,|$)'),
        "grammar": extract_val(r'grammar["\s]*[:\-]\s*([\d.]+)'),
        "grammar_feedback": extract_val(r'grammar_feedback["\s]*[:\-]\s*["\']?(.*?)["\']?(?:\n|,|$)'),
        "pronunciation": extract_val(r'pronunciation["\s]*[:\-]\s*([\d.]+)'),
        "pronunciation_feedback": extract_val(r'pronunciation_feedback["\s]*[:\-]\s*["\']?(.*?)["\']?(?:\n|,|$)'),
        "summary": extract_val(r'(?:summary|feedback)["\s]*[:\-]\s*["\']?(.*?)["\']?(?:\n|}|$)'),
    }
    return res


def parse_speaking_result(text: str) -> dict:
    data = extract_json(text)
    overall = float(data.get("overall", 5.0))
    def _fmt(key):
        score = data.get(key)
        feedback = data.get(f"{key}_feedback")
        if not score and not feedback: return ""
        return f"{score if score else ''}. {feedback if feedback else ''}".strip()

    criteria = {
        "fluency": _fmt("fluency"),
        "lexical": _fmt("lexical"),
        "grammar": _fmt("grammar"),
        "pronunciation": _fmt("pronunciation"),
    }
    feedback = data.get("summary") or data.get("feedback")
    if not feedback:
        import re
        feedback = re.sub(r'["{}]', '', text[:800]).strip()
    return {
        "band_score": round(min(max(overall, 1.0), 9.0) * 2) / 2,  # round to nearest 0.5
        "feedback": feedback,
        "criteria": {k: (str(v) if v is not None else "") for k, v in criteria.items()},
        "raw_output": text,
    }



def parse_writing_result(band_text: str, criteria_text: str = "") -> dict:
    """Legacy – kept for compatibility. Not used by the new multi-pass route."""
    band = None
    for m in re.findall(r'\b(\d+(?:\.[05])?)', band_text):
        v = float(m)
        if 1.0 <= v <= 9.0:
            band = round(v * 2) / 2
            break
    feedback = band_text.strip()
    return {
        "band_score": min(band if band is not None else 5.0, 9.0),
        "feedback":   feedback,
        "criteria":   {},
        "raw_output": band_text.strip(),
    }




# ── Azure Speech-to-Text with Pronunciation Assessment ─────────────────────────

def transcribe_audio(audio_bytes: bytes) -> dict:
    if not AZURE_SPEECH_KEY or not AZURE_SPEECH_REGION:
        raise RuntimeError("Azure credentials missing in environment variables (.env file).")

    temp_filename = f"temp_speaking_{uuid.uuid4().hex}.wav"
    try:
        with open(temp_filename, "wb") as f:
            f.write(audio_bytes)

        speech_config = speechsdk.SpeechConfig(subscription=AZURE_SPEECH_KEY, region=AZURE_SPEECH_REGION)
        audio_config = speechsdk.audio.AudioConfig(filename=temp_filename)
        
        # 1. Setup Pronunciation Assessment
        # We use 'Enabling' for various assessments
        pron_config = speechsdk.PronunciationAssessmentConfig(
            grading_system=speechsdk.PronunciationAssessmentGradingSystem.HundredMark,
            granularity=speechsdk.PronunciationAssessmentGranularity.Phoneme,
            enable_miscue=True
        )
        
        speech_recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)
        pron_config.apply_to(speech_recognizer)

        full_transcript = []
        scores = {"pronunciation": 0, "accuracy": 0, "fluency": 0, "completeness": 0}
        done = False
        error_msg = None

        def recognized_cb(evt):
            if evt.result.reason == speechsdk.ResultReason.RecognizedSpeech:
                print(f"[Azure-Pro] Recognized: {evt.result.text}")
                full_transcript.append(evt.result.text)
                
                # Extract pronunciation scores
                pron_result = speechsdk.PronunciationAssessmentResult(evt.result)
                if pron_result:
                    scores["pronunciation"] = (scores["pronunciation"] + pron_result.pronunciation_score) / 2 if scores["pronunciation"] else pron_result.pronunciation_score
                    scores["accuracy"] = (scores["accuracy"] + pron_result.accuracy_score) / 2 if scores["accuracy"] else pron_result.accuracy_score
                    scores["fluency"] = (scores["fluency"] + pron_result.fluency_score) / 2 if scores["fluency"] else pron_result.fluency_score
                    scores["completeness"] = (scores["completeness"] + pron_result.completeness_score) / 2 if scores["completeness"] else pron_result.completeness_score

        def canceled_cb(evt):
            nonlocal done, error_msg
            if evt.reason == speechsdk.CancellationReason.Error:
                error_msg = f"Azure Error: {evt.error_details}"
            done = True

        def stop_cb(evt):
            nonlocal done
            done = True

        # Connect events
        speech_recognizer.recognized.connect(recognized_cb)
        speech_recognizer.session_stopped.connect(stop_cb)
        speech_recognizer.canceled.connect(canceled_cb)

        print(f"[Azure-Pro] Starting evaluation for {len(audio_bytes)} bytes...")
        speech_recognizer.start_continuous_recognition()
        
        start_time = time.time()
        while not done and (time.time() - start_time < 130):
            time.sleep(0.5)

        speech_recognizer.stop_continuous_recognition()
        
        # EXPLICITLY delete the recognizer and config to release the file handle on Windows
        del speech_recognizer
        del audio_config
        
    finally:
        # Cleanup temp file
        if os.path.exists(temp_filename):
            try:
                os.remove(temp_filename)
            except Exception as e:
                print(f"[Flask-STT] Warning: Could not remove temp file {temp_filename}: {e}")

    transcript = " ".join(full_transcript).strip()
    return {
        "transcript": transcript,
        "scores": scores
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "service": "IELTS AI Flask Server"})


@app.route("/evaluate", methods=["POST"])
def evaluate_speaking():
    """Evaluate an IELTS Speaking response."""
    body = request.get_json(silent=True) or {}
    question = (body.get("question") or "").strip()
    answer   = (body.get("answer")   or "").strip()

    if not question or not answer:
        return jsonify({"error": "Both 'question' and 'answer' are required."}), 400
    if len(answer) < 5:
        return jsonify({"error": "Answer is too short."}), 400

    tokenizer, model = None, None
    try:
        tokenizer, model = load_model(SPEAKING_MODEL_PATH)
        prompt  = build_speaking_prompt(question, answer)
        raw_out = generate(tokenizer, model, prompt, max_new_tokens=400)
        result  = parse_speaking_result(raw_out)
        return jsonify(result)
    except Exception as e:
        print(f"[Flask] Speaking evaluation error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if model is not None:
            unload_model(tokenizer, model)


@app.route("/evaluate-speaking-audio", methods=["POST"])
def evaluate_speaking_audio():
    """Evaluate an IELTS Speaking response from an audio file."""
    question = (request.form.get("question") or "").strip()
    
    if not question:
        return jsonify({"error": "'question' is required in form data."}), 400
        
    if "audio" not in request.files:
        return jsonify({"error": "No 'audio' file uploaded."}), 400
        
    audio_file = request.files["audio"]
    audio_bytes = audio_file.read()
    content_type = audio_file.content_type or "audio/webm"
    
    # 1. Transcribe audio with Pronunciation Assessment
    try:
        transcript_data = transcribe_audio(audio_bytes)
        transcript = transcript_data["transcript"]
        azure_scores = transcript_data["scores"]
    except Exception as e:
        print(f"[Flask] Azure SDK STT error: {e}")
        return jsonify({"error": f"Speech Recognition failed: {str(e)}"}), 500
        
    print(f"[Flask] Transcript: {transcript}")
    print(f"[Flask] Azure Scores: {azure_scores}")
        
    if len(transcript) < 5:
        return jsonify({
            "error": "Answer is too short or audio was not understood. Please speak clearly and in sentences.", 
            "transcript": transcript
        }), 400

    tokenizer, model = None, None
    try:
        tokenizer, model = load_model(SPEAKING_MODEL_PATH)
        # Inject Azure scores into the prompt for better LLM evaluation
        prompt  = build_speaking_prompt(question, transcript)
        # We can optionally add the azure scores to the prompt here if needed
        raw_out = generate(tokenizer, model, prompt, max_new_tokens=400)
        result  = parse_speaking_result(raw_out)
        
        # ── Fallback for Pronunciation Card ──────────────────────────────────
        # If the LLM didn't provide pronunciation feedback, use Azure scores
        if not result["criteria"].get("pronunciation") or result["criteria"]["pronunciation"].strip() == "":
            azure_pron = azure_scores.get("pronunciation", 0)
            # Convert 0-100 to 0-9 Band
            band = round((azure_pron / 100) * 9 * 2) / 2
            band = max(1.0, min(9.0, band))
            result["criteria"]["pronunciation"] = f"{band}. Pronunciation assessment by Azure Speech SDK."

        result["transcript"] = transcript
        result["azure_scores"] = azure_scores # Include pro scores in response
        return jsonify(result)
    except Exception as e:
        print(f"[Flask] Speaking audio evaluation error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if model is not None:
            unload_model(tokenizer, model)


@app.route("/evaluate-writing", methods=["POST"])
@app.route("/score", methods=["POST"])   # also expose /score for the new model's original route
def evaluate_writing():
    """Evaluate an IELTS Writing task response using the fine-tuned Final_Writing_Model.
    Runs two inference passes:
      Pass 1 → overall band score + narrative feedback
      Pass 2 → structured per-criterion feedback (Task Achievement/Response,
                Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy)
    """
    body      = request.get_json(silent=True) or {}
    question  = (body.get("question") or body.get("task") or "").strip()
    answer    = (body.get("answer")   or body.get("essay") or "").strip()
    task_type = body.get("task_type", 2)

    if not question or not answer:
        return jsonify({"error": "Both 'question'/'task' and 'answer'/'essay' are required."}), 400
    if len(answer.split()) < 50:
        return jsonify({"error": "Essay too short. Minimum 50 words required."}), 400

    tokenizer, model = None, None
    try:
        tokenizer, model = load_model(WRITING_MODEL_PATH)

        def run_inference(prompt_text, max_tokens=250):
            inputs = tokenizer(
                prompt_text,
                return_tensors="pt",
                truncation=True,
                max_length=512,
            )
            if torch.cuda.is_available():
                inputs = {k: v.cuda() for k, v in inputs.items()}
            with torch.no_grad():
                outputs = model.generate(
                    **inputs,
                    max_new_tokens=max_tokens,
                    do_sample=False,
                    pad_token_id=tokenizer.eos_token_id,
                    eos_token_id=tokenizer.eos_token_id,
                    repetition_penalty=1.1,
                )
            return tokenizer.decode(
                outputs[0][inputs["input_ids"].shape[1]:],
                skip_special_tokens=True
            )

        # ── Helper: run a short, capped inference call ──────────────────────
        def run_inference(prompt_text, max_tokens=80):
            inputs = tokenizer(
                prompt_text,
                return_tensors="pt",
                truncation=True,
                max_length=640,   # larger context to fit rubric + essay
            )
            if torch.cuda.is_available():
                inputs = {k: v.cuda() for k, v in inputs.items()}
            with torch.no_grad():
                outputs = model.generate(
                    **inputs,
                    max_new_tokens=max_tokens,
                    do_sample=False,
                    pad_token_id=tokenizer.eos_token_id,
                    eos_token_id=tokenizer.eos_token_id,
                    repetition_penalty=1.3,
                )
            return tokenizer.decode(
                outputs[0][inputs["input_ids"].shape[1]:],
                skip_special_tokens=True
            )

        # ── Single Pass: Overall Band Score (max 15 tokens — just a number) ────────────
        print("[Flask-Writing] Running single-pass overall scoring ...")
        overall_raw = run_inference(build_overall_band_prompt(question, answer, task_type), max_tokens=15)
        overall_band = _extract_band(overall_raw)
        # Final safety clamp
        overall_band = min(max(overall_band, 1.0), 9.0)

        print(f"[Flask-Writing] Overall Band Score → {overall_band}")

        # ── Criteria: Mocked for Node (Node/Groq will handle individual feedback) ──
        criteria = {
            "task_achievement": {"band": overall_band, "feedback": ""},
            "coherence":        {"band": overall_band, "feedback": ""},
            "lexical":          {"band": overall_band, "feedback": ""},
            "grammar":          {"band": overall_band, "feedback": ""},
        }

        # Overall narrative feedback
        if overall_band >= 7.5:
            overall_narrative = "Excellent work — the essay demonstrates strong command across all four IELTS criteria."
        elif overall_band >= 6.0:
            overall_narrative = "Good effort — focus on developing your weakest criterion to raise your overall band."
        elif overall_band >= 4.5:
            overall_narrative = "Satisfactory — targeted practice on lower-scoring criteria will significantly improve your band."
        else:
            overall_narrative = "Keep practising — work on task response, coherence, vocabulary and grammar systematically."

        overall_feedback = f"Overall Band {overall_band}: {overall_narrative}"

        return jsonify({
            "band_score":  overall_band,
            "feedback":    overall_feedback,
            "criteria":    criteria,
            "raw_output":  f"Overall:{overall_raw}",
        })


    except Exception as e:
        print(f"[Flask] Writing evaluation error: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if model is not None:
            unload_model(tokenizer, model)



# Global cache for the reading model to avoid loading it on every request
_reading_tokenizer = None
_reading_model = None

def get_reading_model():
    global _reading_tokenizer, _reading_model
    if _reading_model is None:
        _reading_tokenizer, _reading_model = load_model(MERGED_MODEL_PATH)
    return _reading_tokenizer, _reading_model

@app.route("/evaluate-reading", methods=["POST"])
def evaluate_reading():
    """Convert raw reading score to IELTS band and generate AI feedback using merged_model."""
    body  = request.get_json(silent=True) or {}
    score = body.get("score")
    total = body.get("total", 40)
    passages = body.get("passages", [])
    answers = body.get("answers", {})

    if score is None:
        return jsonify({"error": "'score' is required."}), 400

    try:
        score = int(score)
        total = int(total)
        band  = score_to_band(score, total)
        overall_feedback = band_to_feedback(band)
        
        detailed_feedback = []
        q_idx = 1
        
        for p in passages:
            passage_feedback = {
                "title": p.get("passage_title", "Passage"),
                "questions": []
            }
            for q in p.get("questions", []):
                q_id = str(q.get("_id", ""))
                user_ans = str(answers.get(q_id, "")).strip().upper()
                correct_label = str(q.get("correct_answer", "")).strip().upper()
                
                # Determine is_correct
                is_eval_correct = user_ans == correct_label
                
                # Resolve option text for display
                options = q.get("options", {})
                correct_text = ""
                if isinstance(options, dict):
                    correct_text = options.get(correct_label, "")
                
                # Construct display string (e.g. "A. Greenhouse gas emissions")
                display_correct = f"{correct_label}. {correct_text}" if correct_text else correct_label
                display_user = user_ans
                if user_ans and isinstance(options, dict) and user_ans in options:
                    display_user = f"{user_ans}. {options[user_ans]}"

                passage_feedback["questions"].append({
                    "question_number": q_idx,
                    "question_text": q.get('question', ''),
                    "user_answer": display_user or "Not Answered",
                    "correct_answer": display_correct,
                    "is_correct": is_eval_correct,
                    "explanation": q.get("explanation", "")
                })
                q_idx += 1
            detailed_feedback.append(passage_feedback)
                
        # AI Model inference has been completely bypassed to solve the 10+ minute hang.
        # Generating text with a locally hosted LLaMA model on a standard CPU causes severe 
        # memory thrashing (swapping), bringing the server to a crawl.

        return jsonify({
            "band_score": band,
            "feedback": overall_feedback,
            "detailed_feedback": detailed_feedback,
            "raw_score": score,
            "out_of": total,
        })
    except Exception as e:
        print(f"[Flask] Reading evaluation error: {e}")
        return jsonify({"error": str(e)}), 500


# ── Entrypoint ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("  IELTS AI Flask Server")
    print("  Listening on http://localhost:5001")
    print("  Endpoints:")
    print("    POST /evaluate          → Speaking")
    print("    POST /evaluate-writing  → Writing")
    print("    POST /evaluate-reading  → Reading (rule-based)")
    print("    GET  /health            → Health check")
    print("=" * 60)
    app.run(host="0.0.0.0", port=7860, debug=False)
