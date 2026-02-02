#!/usr/bin/env python3
"""
AI SOAP Generator Service
=========================
Generates SOAP notes from voice transcripts or text input using OpenAI.
Handles audio transcription via Whisper and note generation via GPT-4.
"""

import os
import logging
import asyncio
import tempfile
import time
from typing import Optional, Dict, Any, Tuple
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)

# Try to import OpenAI
try:
    from openai import AsyncOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logger.warning("OpenAI package not available - using mock responses")


@dataclass
class SOAPNote:
    """Structured SOAP note data"""
    subjective: str
    objective: str
    assessment: str
    plan: str
    chief_complaint: str = ""
    diagnoses: list = None
    treatments: list = None
    medications: list = None
    follow_up_required: bool = False
    confidence: float = 0.0

    def __post_init__(self):
        if self.diagnoses is None:
            self.diagnoses = []
        if self.treatments is None:
            self.treatments = []
        if self.medications is None:
            self.medications = []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "subjective": self.subjective,
            "objective": self.objective,
            "assessment": self.assessment,
            "plan": self.plan,
            "chief_complaint": self.chief_complaint,
            "diagnoses": self.diagnoses,
            "treatments": self.treatments,
            "medications": self.medications,
            "follow_up_required": self.follow_up_required,
            "confidence": self.confidence
        }


class AISOAPGenerator:
    """
    AI-powered SOAP note generator for veterinary medical records.
    Uses OpenAI Whisper for transcription and GPT-4 for note generation.
    """

    def __init__(self):
        self.openai_client = None
        self._initialized = False

        # SOAP generation system prompt
        self.system_prompt = """You are an expert veterinary medical scribe. Your task is to convert clinical notes,
voice transcripts, or patient encounter descriptions into properly formatted SOAP notes.

SOAP Format Guidelines:
- Subjective (S): Patient history, owner's observations, symptoms reported, duration of illness
- Objective (O): Physical exam findings, vital signs, test results, observable clinical signs
- Assessment (A): Diagnosis or differential diagnoses, clinical reasoning
- Plan (P): Treatment plan, medications, follow-up instructions, recommendations

Veterinary-specific considerations:
- Include species-appropriate terminology
- Note patient species, breed, age, and weight when available
- Use standard veterinary abbreviations (BAR, QAR, NSF, etc.)
- Include pertinent negatives in the objective section
- List differential diagnoses in order of likelihood

Output format: Provide structured JSON with the following fields:
{
  "chief_complaint": "Brief description of main concern",
  "subjective": "Patient history and owner observations",
  "objective": "Physical exam findings and vitals",
  "assessment": "Diagnosis/differential diagnoses",
  "plan": "Treatment plan and recommendations",
  "diagnoses": ["Primary diagnosis", "Secondary diagnosis"],
  "treatments": ["Treatment 1", "Treatment 2"],
  "medications": [{"name": "Drug", "dose": "dose", "frequency": "freq", "duration": "days"}],
  "follow_up_required": true/false,
  "confidence": 0.0-1.0
}"""

    async def initialize(self):
        """Initialize OpenAI client"""
        if self._initialized:
            return

        if OPENAI_AVAILABLE:
            api_key = os.getenv("OPENAI_API_KEY")
            if api_key:
                self.openai_client = AsyncOpenAI(api_key=api_key)
                self._initialized = True
                logger.info("AI SOAP Generator initialized with OpenAI")
            else:
                logger.warning("OPENAI_API_KEY not set - using mock responses")
        else:
            logger.warning("OpenAI not available - using mock responses")

    async def transcribe_audio(self, audio_data: bytes, filename: str = "audio.wav") -> Tuple[str, float]:
        """
        Transcribe audio using OpenAI Whisper.

        Args:
            audio_data: Raw audio bytes
            filename: Original filename for format detection

        Returns:
            Tuple of (transcript text, processing time in seconds)
        """
        start_time = time.time()

        if not self.openai_client:
            await self.initialize()

        if not self.openai_client:
            # Return mock transcript for development
            logger.info("Using mock transcription (OpenAI not available)")
            await asyncio.sleep(0.5)  # Simulate processing
            return self._get_mock_transcript(), time.time() - start_time

        try:
            # Write audio to temp file for OpenAI
            suffix = "." + filename.split(".")[-1] if "." in filename else ".wav"
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp_file:
                temp_file.write(audio_data)
                temp_path = temp_file.name

            try:
                with open(temp_path, "rb") as audio_file:
                    response = await self.openai_client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        language="en",
                        response_format="text"
                    )

                transcript = response if isinstance(response, str) else response.text
                processing_time = time.time() - start_time

                logger.info(f"Transcribed {len(audio_data)} bytes in {processing_time:.2f}s")
                return transcript, processing_time

            finally:
                # Cleanup temp file
                os.unlink(temp_path)

        except Exception as e:
            logger.error(f"Transcription error: {e}")
            raise ValueError(f"Failed to transcribe audio: {str(e)}")

    async def generate_soap_from_transcript(
        self,
        transcript: str,
        patient_info: Optional[Dict[str, Any]] = None,
        record_type: str = "exam"
    ) -> SOAPNote:
        """
        Generate SOAP note from transcript using GPT-4.

        Args:
            transcript: Voice transcript or clinical notes text
            patient_info: Optional patient context (species, breed, age, etc.)
            record_type: Type of medical record (exam, consultation, etc.)

        Returns:
            Structured SOAPNote object
        """
        if not self.openai_client:
            await self.initialize()

        if not self.openai_client:
            # Return mock SOAP for development
            logger.info("Using mock SOAP generation (OpenAI not available)")
            return self._get_mock_soap(transcript, patient_info)

        # Build context-aware prompt
        context = self._build_context(patient_info, record_type)

        user_prompt = f"""Convert the following clinical notes/transcript into a structured SOAP note.

{context}

Clinical Notes/Transcript:
{transcript}

Generate a complete SOAP note in JSON format."""

        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            import json
            result = json.loads(response.choices[0].message.content)

            return SOAPNote(
                subjective=result.get("subjective", ""),
                objective=result.get("objective", ""),
                assessment=result.get("assessment", ""),
                plan=result.get("plan", ""),
                chief_complaint=result.get("chief_complaint", ""),
                diagnoses=result.get("diagnoses", []),
                treatments=result.get("treatments", []),
                medications=result.get("medications", []),
                follow_up_required=result.get("follow_up_required", False),
                confidence=result.get("confidence", 0.85)
            )

        except Exception as e:
            logger.error(f"SOAP generation error: {e}")
            raise ValueError(f"Failed to generate SOAP note: {str(e)}")

    async def process_voice_to_soap(
        self,
        audio_data: bytes,
        filename: str,
        patient_info: Optional[Dict[str, Any]] = None,
        record_type: str = "exam"
    ) -> Dict[str, Any]:
        """
        Complete pipeline: audio -> transcript -> SOAP note.

        Args:
            audio_data: Raw audio bytes
            filename: Audio filename
            patient_info: Optional patient context
            record_type: Type of medical record

        Returns:
            Dict with transcript, soap_note, and processing metrics
        """
        total_start = time.time()

        # Step 1: Transcribe audio
        transcript, transcription_time = await self.transcribe_audio(audio_data, filename)

        # Step 2: Generate SOAP
        soap_start = time.time()
        soap_note = await self.generate_soap_from_transcript(transcript, patient_info, record_type)
        soap_time = time.time() - soap_start

        total_time = time.time() - total_start

        return {
            "transcript": transcript,
            "soap_note": soap_note.to_dict(),
            "processing_metrics": {
                "transcription_time_ms": int(transcription_time * 1000),
                "soap_generation_time_ms": int(soap_time * 1000),
                "total_time_ms": int(total_time * 1000)
            },
            "confidence": soap_note.confidence
        }

    def _build_context(self, patient_info: Optional[Dict], record_type: str) -> str:
        """Build context string for SOAP generation"""
        context_parts = [f"Record Type: {record_type}"]

        if patient_info:
            if patient_info.get("name"):
                context_parts.append(f"Patient Name: {patient_info['name']}")
            if patient_info.get("species"):
                context_parts.append(f"Species: {patient_info['species']}")
            if patient_info.get("breed"):
                context_parts.append(f"Breed: {patient_info['breed']}")
            if patient_info.get("age"):
                context_parts.append(f"Age: {patient_info['age']}")
            if patient_info.get("weight"):
                context_parts.append(f"Weight: {patient_info['weight']}")
            if patient_info.get("sex"):
                context_parts.append(f"Sex: {patient_info['sex']}")

        return "\n".join(context_parts) if context_parts else ""

    def _get_mock_transcript(self) -> str:
        """Return mock transcript for development"""
        return """Owner reports that Buddy has been vomiting intermittently for the past two days.
Started after eating grass in the backyard. Not eating well, drinking normal amounts of water.
No diarrhea observed. Last bowel movement was this morning, appeared normal.
Physical exam: Temperature 101.5, heart rate 90, respiratory rate 20.
Abdomen slightly tense on palpation but no obvious pain response.
Mucous membranes pink and moist, CRT less than 2 seconds.
Recommend supportive care with bland diet, monitor for 24-48 hours."""

    def _get_mock_soap(self, transcript: str, patient_info: Optional[Dict]) -> SOAPNote:
        """Return mock SOAP note for development"""
        patient_name = patient_info.get("name", "Patient") if patient_info else "Patient"

        return SOAPNote(
            chief_complaint="Intermittent vomiting x 2 days",
            subjective=f"Owner reports {patient_name} has been vomiting intermittently for 2 days. "
                      "Started after eating grass. Decreased appetite, normal water intake. "
                      "No diarrhea. Normal BM this morning.",
            objective="T: 101.5F, HR: 90 bpm, RR: 20 brpm. "
                     "Abdomen slightly tense on palpation, no pain response. "
                     "MM pink, moist, CRT < 2s. Hydration adequate.",
            assessment="Acute gastritis, likely secondary to dietary indiscretion (grass ingestion). "
                      "DDx: Foreign body, pancreatitis, infectious gastroenteritis.",
            plan="1. NPO for 12 hours then bland diet (boiled chicken/rice) for 3-5 days\n"
                "2. Cerenia 1mg/kg SQ once daily x 3 days PRN vomiting\n"
                "3. Monitor hydration status\n"
                "4. Recheck if vomiting persists >48 hours or new symptoms develop",
            diagnoses=["Acute gastritis", "Dietary indiscretion"],
            treatments=["NPO 12 hours", "Bland diet 3-5 days", "Antiemetic therapy"],
            medications=[{
                "name": "Cerenia (maropitant)",
                "dose": "1mg/kg",
                "route": "SQ",
                "frequency": "Once daily",
                "duration": "3 days PRN"
            }],
            follow_up_required=True,
            confidence=0.92
        )


# Global instance
soap_generator = AISOAPGenerator()
