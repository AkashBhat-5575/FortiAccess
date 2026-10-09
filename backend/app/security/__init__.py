def calculate_risk_score(
    role: str,
    device_trusted: bool,
    network_trusted: bool,
    data_sensitivity: str
):
    risk = 0

    role_risk = {
        "admin": 10,
        "cloud_engineer": 15,
        "viewer": 20
    }

    risk += role_risk.get(role.lower(), 25)

    if not device_trusted:
        risk += 25

    if not network_trusted:
        risk += 20

    sensitivity_risk = {
        "low": 5,
        "medium": 15,
        "high": 25
    }

    risk += sensitivity_risk.get(
        data_sensitivity.lower(),
        15
    )

    risk = min(risk, 100)

    if risk <= 30:
        decision = "ALLOW"
    elif risk <= 60:
        decision = "STEP-UP AUTHENTICATION"
    else:
        decision = "RESTRICT"

    return {
        "risk_score": risk,
        "risk_level": (
            "LOW"
            if risk <= 30
            else "MEDIUM"
            if risk <= 60
            else "HIGH"
        ),
        "decision": decision
    }


def architecture_security_score(architecture_id):

    scores = {
        "A": 82,
        "B": 87,
        "C": 85
    }

    return scores.get(architecture_id, 70)