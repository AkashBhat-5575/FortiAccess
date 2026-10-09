from pydantic import BaseModel, Field


class WorkloadRequest(BaseModel):
    application_name: str = "My Application"

    users: int = Field(gt=0)

    traffic_level: str = "medium"

    monthly_budget: float = Field(gt=0)

    availability_required: float = Field(
        default=99.9,
        ge=90,
        le=99.99
    )

    data_sensitivity: str = "medium"

    performance_priority: int = Field(
        default=3,
        ge=1,
        le=5
    )

    scalability_priority: int = Field(
        default=3,
        ge=1,
        le=5
    )

    security_priority: int = Field(
        default=3,
        ge=1,
        le=5
    )

    role: str = "cloud_engineer"

    device_trusted: bool = True

    network_trusted: bool = True


class AIWorkloadRequest(BaseModel):
    prompt: str