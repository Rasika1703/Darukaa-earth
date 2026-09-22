import json
import re
from pathlib import Path

from fastapi import APIRouter
from pydantic import BaseModel, Field


router = APIRouter(prefix="/api/intelligence", tags=["TerraNexus"])


KNOWLEDGE_FILE = Path(__file__).resolve().parent.parent / "knowledge" / "environmental.json"


class ChatRequest(BaseModel):
    message: str = Field(min_length=2)
    conversation_id: str | None = None


def load_knowledge():
    with open(KNOWLEDGE_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


def retrieve_knowledge(message: str):
    text = message.lower()
    knowledge = load_knowledge()

    matches = []

    for item in knowledge:
        score = 0

        for keyword in item["keywords"]:
            if keyword.lower() in text:
                score += 2

        if item["topic"].lower() in text:
            score += 3

        if score > 0:
            matches.append((score, item))

    matches.sort(key=lambda x: x[0], reverse=True)

    return [item for _, item in matches[:4]]


def extract_variables(message: str):
    text = message.lower()

    variables = {
        "soil_organic_carbon": None,
        "soil_ph": None,
        "rainfall": None,
        "temperature": None,
        "land_use": None,
        "biodiversity": None,
        "pollution": None,
    }

    carbon = re.search(r"(?:organic carbon|soc)\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)\s*%?", text)
    if carbon:
        variables["soil_organic_carbon"] = float(carbon.group(1))

    ph = re.search(r"(?:ph)\s*(?:is|=|:)?\s*(\d+(?:\.\d+)?)", text)
    if ph:
        variables["soil_ph"] = float(ph.group(1))

    temp = re.search(r"(\d+(?:\.\d+)?)\s*(?:°c|celsius)", text)
    if temp:
        variables["temperature"] = float(temp.group(1))

    if any(word in text for word in ["low rainfall", "low rain", "dry", "semi-arid"]):
        variables["rainfall"] = "low"

    if any(word in text for word in ["monoculture", "single crop"]):
        variables["land_use"] = "monoculture"

    if "wheat" in text:
        variables["land_use"] = "wheat monoculture"

    if any(word in text for word in ["biodiversity decline", "biodiversity is declining", "species decline"]):
        variables["biodiversity"] = "declining"

    if any(word in text for word in ["pollution", "pesticide", "chemical"]):
        variables["pollution"] = "present"

    return variables


def build_analysis(message: str, variables: dict, evidence: list):
    text = message.lower()

    relationships = []

    if variables["soil_organic_carbon"] is not None and variables["rainfall"] == "low":
        relationships.append(
            "Low soil organic carbon combined with limited rainfall can increase pressure on soil water retention and resilience."
        )

    if variables["land_use"] and "monoculture" in variables["land_use"]:
        relationships.append(
            "Continuous monoculture reduces vegetation and habitat diversity compared with more diversified land-use systems."
        )

    if variables["biodiversity"] == "declining" and variables["land_use"]:
        relationships.append(
            "Biodiversity decline should be assessed together with land-use pattern and habitat availability rather than as an isolated metric."
        )

    if variables["pollution"] == "present":
        relationships.append(
            "Pollution pressure can interact with soil and water conditions and should be considered alongside biodiversity indicators."
        )

    if not evidence:
        return {
            "recommendation": "I need more environmental information before making an evidence-backed recommendation.",
            "reasoning": "The current query does not contain enough identifiable environmental variables.",
            "impacted_metrics": [],
            "time_horizon": "Not determined",
            "confidence": 0.35,
            "relationships": [],
        }

    primary = evidence[0]

    metrics = []
    for item in evidence:
        for metric in item["metrics"]:
            if metric not in metrics:
                metrics.append(metric)

    return {
        "recommendation": primary["action"],
        "reasoning": " ".join(
            [primary["reason"]] + relationships
        ),
        "impacted_metrics": metrics[:6],
        "time_horizon": primary["time_horizon"],
        "confidence": min(0.95, 0.60 + (len(evidence) * 0.08)),
        "relationships": relationships,
    }


@router.post("/chat")
def chat(request: ChatRequest):
    variables = extract_variables(request.message)
    evidence = retrieve_knowledge(request.message)
    analysis = build_analysis(request.message, variables, evidence)

    return {
        "product": "TerraNexus",
        "conversation_id": request.conversation_id,
        "query": request.message,
        "variables": variables,
        **analysis,
        "evidence": [
            {
                "topic": item["topic"],
                "source": item["source"],
                "url": item["source_url"],
                "reason": item["reason"],
            }
            for item in evidence
        ],
        "retrieval_count": len(evidence),
    }