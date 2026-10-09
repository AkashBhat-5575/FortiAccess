from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .terraform import generate_terraform
from .models import WorkloadRequest, AIWorkloadRequest
from .ai import analyze_workload_with_ai
from .architecture import generate_architectures
from .scoring import (
    calculate_cost,
    calculate_scores,
    calculate_overall_score
)
from .security import (
    calculate_risk_score,
    architecture_security_score
)


app = FastAPI(
    title="FortiAccess",
    description="Adaptive Cloud Architecture and Access Optimization Platform",
    version="1.0.0"
)


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "project": "FortiAccess",
        "status": "running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/architectures")
def architectures():
    return generate_architectures()

def run_architecture_analysis(request: WorkloadRequest):
    architectures = generate_architectures()

    risk = calculate_risk_score(
        request.role,
        request.device_trusted,
        request.network_trusted,
        request.data_sensitivity
    )

    results = []

    for architecture in architectures:

        architecture_id = architecture["id"]

        cost = calculate_cost(
            architecture_id,
            request
        )

        scores = calculate_scores(
            architecture_id,
            request
        )

        security_score = architecture_security_score(
            architecture_id
        )

        overall_score = calculate_overall_score(
            cost,
            scores,
            request
        )

        results.append({
            **architecture,

            "estimated_monthly_cost": cost,

            "performance_score": scores["performance"],

            "scalability_score": scores["scalability"],

            "availability_score": scores["availability"],

            "security_score": security_score,

            "risk_score": risk["risk_score"],

            "risk_level": risk["risk_level"],

            "access_decision": risk["decision"],

            "overall_score": overall_score
        })

    results.sort(
        key=lambda x: x["overall_score"],
        reverse=True
    )

    return {
        "application": request.application_name,

        "access_risk": risk,

        "recommendation": results[0],

        "architectures": results
    }

@app.post("/analyze")
def analyze(request: WorkloadRequest):

    architectures = generate_architectures()

    # Calculate access/security risk once
    risk = calculate_risk_score(
        request.role,
        request.device_trusted,
        request.network_trusted,
        request.data_sensitivity
    )

    results = []

    for architecture in architectures:

        architecture_id = architecture["id"]

        # Cost calculation
        cost = calculate_cost(
            architecture_id,
            request
        )

        # Performance, scalability and availability
        scores = calculate_scores(
            architecture_id,
            request
        )

        # Architecture security score
        security_score = architecture_security_score(
            architecture_id
        )

        # Overall architecture score
        overall_score = calculate_overall_score(
            cost,
            scores,
            request
        )

        results.append({
            **architecture,

            "estimated_monthly_cost": cost,

            "performance_score": scores["performance"],
            "scalability_score": scores["scalability"],
            "availability_score": scores["availability"],

            "security_score": security_score,

            "risk_score": risk["risk_score"],
            "risk_level": risk["risk_level"],
            "access_decision": risk["decision"],

            "overall_score": overall_score
        })

    # Highest overall score = recommended architecture
    results.sort(
        key=lambda x: x["overall_score"],
        reverse=True
    )

    return run_architecture_analysis(request)

@app.post("/simulate")
def simulate(request: WorkloadRequest):

    architectures = generate_architectures()

    results = []

    for architecture in architectures:

        architecture_id = architecture["id"]

        cost = calculate_cost(
            architecture_id,
            request
        )

        scores = calculate_scores(
            architecture_id,
            request
        )

        security_score = architecture_security_score(
            architecture_id
        )

        overall_score = calculate_overall_score(
            cost,
            scores,
            request
        )

        results.append({
            "id": architecture_id,
            "name": architecture["name"],
            "type": architecture["type"],
            "estimated_monthly_cost": cost,
            "performance_score": scores["performance"],
            "scalability_score": scores["scalability"],
            "availability_score": scores["availability"],
            "security_score": security_score,
            "overall_score": overall_score
        })

    results.sort(
        key=lambda x: x["overall_score"],
        reverse=True
    )

    return {
        "simulation": {
            "users": request.users,
            "traffic_level": request.traffic_level,
            "monthly_budget": request.monthly_budget
        },
        "recommended_architecture": results[0],
        "architectures": results
    }

@app.get("/terraform/{architecture_id}")
def terraform_generator(architecture_id: str):

    terraform_code = generate_terraform(architecture_id.upper())

    return {
        "architecture_id": architecture_id.upper(),
        "terraform": terraform_code
    }

@app.post("/ai/analyze")
def ai_analyze(request: AIWorkloadRequest):

    try:

        # -------------------------------------------------
        # STEP 1: Gemini understands the natural language
        # -------------------------------------------------

        ai_result = analyze_workload_with_ai(
            request.prompt
        )

        # -------------------------------------------------
        # STEP 2: Validate Gemini output
        # using our WorkloadRequest model
        # -------------------------------------------------

        workload = WorkloadRequest(
            application_name=ai_result["application_name"],

            users=ai_result["users"],

            traffic_level=ai_result["traffic_level"],

            monthly_budget=ai_result["monthly_budget"],

            availability_required=ai_result["availability_required"],

            data_sensitivity=ai_result["data_sensitivity"],

            performance_priority=ai_result["performance_priority"],

            scalability_priority=ai_result["scalability_priority"],

            security_priority=ai_result["security_priority"]
        )

        # -------------------------------------------------
        # STEP 3: Run FortiAccess deterministic engine
        # -------------------------------------------------

        analysis = run_architecture_analysis(
            workload
        )

        # -------------------------------------------------
        # STEP 4: Return AI + FortiAccess results
        # -------------------------------------------------

        return {
            "success": True,

            "ai_requirements": ai_result,

            "validated_workload": workload.model_dump(),

            "analysis": analysis
        }

    except Exception as error:

        return {
            "success": False,

            "error": str(error)
        }