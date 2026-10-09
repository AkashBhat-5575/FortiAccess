def calculate_cost(architecture_id, request):
    users = request.users
    traffic = request.traffic_level

    if architecture_id == "A":
        base_cost = 180
        user_cost = users / 1000 * 2
        traffic_cost = {
            "low": 20,
            "medium": 50,
            "high": 100
        }.get(traffic, 50)

    elif architecture_id == "B":
        base_cost = 220
        user_cost = users / 1000 * 1.8
        traffic_cost = {
            "low": 25,
            "medium": 60,
            "high": 120
        }.get(traffic, 60)

    else:
        base_cost = 80
        user_cost = users / 1000 * 1.2
        traffic_cost = {
            "low": 15,
            "medium": 35,
            "high": 70
        }.get(traffic, 35)

    return round(base_cost + user_cost + traffic_cost, 2)


def calculate_scores(architecture_id, request):

    scores = {
        "A": {
            "performance": 82,
            "scalability": 75,
            "availability": 85,
            "security": 82
        },
        "B": {
            "performance": 88,
            "scalability": 90,
            "availability": 90,
            "security": 87
        },
        "C": {
            "performance": 80,
            "scalability": 96,
            "availability": 92,
            "security": 85
        }
    }

    return scores[architecture_id]


def calculate_overall_score(
    cost,
    scores,
    request
):

    # Higher score = better
    budget_score = max(
        0,
        min(
            100,
            (request.monthly_budget / max(cost, 1)) * 50
        )
    )

    performance_weight = request.performance_priority
    scalability_weight = request.scalability_priority
    security_weight = request.security_priority

    availability_weight = 3
    cost_weight = 3

    total_weight = (
        performance_weight
        + scalability_weight
        + security_weight
        + availability_weight
        + cost_weight
    )

    overall = (
        scores["performance"] * performance_weight
        + scores["scalability"] * scalability_weight
        + scores["security"] * security_weight
        + scores["availability"] * availability_weight
        + budget_score * cost_weight
    ) / total_weight

    return round(overall, 2)