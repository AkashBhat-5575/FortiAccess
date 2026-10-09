def generate_architectures():
    return [
        {
            "id": "A",
            "name": "Traditional AWS Architecture",
            "services": [
                "EC2",
                "RDS",
                "Application Load Balancer",
                "CloudFront"
            ],
            "type": "IaaS"
        },
        {
            "id": "B",
            "name": "Containerized AWS Architecture",
            "services": [
                "ECS",
                "RDS",
                "Application Load Balancer",
                "CloudFront"
            ],
            "type": "Container"
        },
        {
            "id": "C",
            "name": "Serverless AWS Architecture",
            "services": [
                "API Gateway",
                "Lambda",
                "DynamoDB",
                "CloudFront"
            ],
            "type": "Serverless"
        }
    ]