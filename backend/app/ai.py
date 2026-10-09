import json
import os
from pathlib import Path
import time

from dotenv import load_dotenv
from google import genai
from google.genai import types


# ---------------------------------------------------------
# Load environment variables
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"

load_dotenv(ENV_FILE)

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError(
        f"GEMINI_API_KEY not found. Expected .env at: {ENV_FILE}"
    )


# ---------------------------------------------------------
# Gemini client
# ---------------------------------------------------------

client = genai.Client(
    api_key=api_key
)


# ---------------------------------------------------------
# Models
# ---------------------------------------------------------

PRIMARY_MODEL = "gemini-3.8-flash"

FALLBACK_MODEL = "gemini-3.5-flash-lite"


# ---------------------------------------------------------
# AI Requirement Analysis
# ---------------------------------------------------------

def analyze_workload_with_ai(prompt: str):

    system_instruction = """
You are the AI requirement-analysis component of FortiAccess,
an adaptive cloud architecture optimization platform.

Your job is ONLY to convert a user's natural-language cloud
application description into structured workload requirements.

Do NOT choose an AWS architecture.

Do NOT recommend EC2, ECS, Lambda, DynamoDB, RDS,
API Gateway, or any other specific AWS service.

Do NOT make security access decisions.

Do NOT generate Terraform.

Do NOT generate AWS credentials.

Return ONLY valid JSON matching the requested schema.

If a value is not explicitly provided, make a reasonable
conservative estimate and clearly mention that the value
was inferred in the reasoning field.

Priority values must be between 1 and 5.

Availability must be between 90 and 99.99.

Users must be greater than 0.

Monthly budget must be greater than 0.
"""


    # -----------------------------------------------------
    # Structured output schema
    # -----------------------------------------------------

    schema = {
        "type": "OBJECT",

        "properties": {

            "application_name": {
                "type": "STRING"
            },

            "users": {
                "type": "INTEGER"
            },

            "traffic_level": {
                "type": "STRING",
                "enum": [
                    "low",
                    "medium",
                    "high"
                ]
            },

            "monthly_budget": {
                "type": "NUMBER"
            },

            "availability_required": {
                "type": "NUMBER"
            },

            "data_sensitivity": {
                "type": "STRING",
                "enum": [
                    "low",
                    "medium",
                    "high"
                ]
            },

            "performance_priority": {
                "type": "INTEGER"
            },

            "scalability_priority": {
                "type": "INTEGER"
            },

            "security_priority": {
                "type": "INTEGER"
            },

            "reasoning": {
                "type": "STRING"
            }
        },

        "required": [
            "application_name",
            "users",
            "traffic_level",
            "monthly_budget",
            "availability_required",
            "data_sensitivity",
            "performance_priority",
            "scalability_priority",
            "security_priority",
            "reasoning"
        ]
    }


    # -----------------------------------------------------
    # Try primary model
    # -----------------------------------------------------

    try:

        response = client.models.generate_content(
            model=PRIMARY_MODEL,

            contents=prompt,

            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=schema
            )
        )

        return json.loads(response.text)


    except Exception as primary_error:

        primary_error_text = str(primary_error)

        # -------------------------------------------------
        # Only fallback for temporary availability errors
        # -------------------------------------------------

        if (
            "503" not in primary_error_text
            and "UNAVAILABLE" not in primary_error_text
        ):
            raise


        # -------------------------------------------------
        # Small delay before fallback
        # -------------------------------------------------

        time.sleep(1)


        # -------------------------------------------------
        # Try lightweight fallback model
        # -------------------------------------------------

        try:

            response = client.models.generate_content(
                model=FALLBACK_MODEL,

                contents=prompt,

                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=schema
                )
            )

            return json.loads(response.text)


        except Exception as fallback_error:

            raise RuntimeError(
                "Gemini AI service is temporarily unavailable. "
                f"Primary model error: {primary_error_text}. "
                f"Fallback model error: {str(fallback_error)}"
            )