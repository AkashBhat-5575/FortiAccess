"""Minimal origin-protected GET API; proves Lambda → DynamoDB without fake data."""
import hmac
import json
import os
import boto3


def lambda_handler(event, context):
    supplied = event.get("headers", {}).get("x-fortiaccess-origin", "")
    if not hmac.compare_digest(supplied, os.environ["ORIGIN_SECRET"]):
        return {"statusCode": 403, "body": "Origin access denied"}
    if event.get("requestContext", {}).get("http", {}).get("method") != "GET":
        return {"statusCode": 405, "body": "Only GET is supported"}
    item_id = (event.get("queryStringParameters") or {}).get("id")
    if not item_id:
        return {"statusCode": 400, "body": "Supply ?id=<record-id>"}
    response = boto3.client("dynamodb").get_item(TableName=os.environ["TABLE_NAME"], Key={"id": {"S": item_id}})
    return {"statusCode": 200 if "Item" in response else 404, "headers": {"content-type": "application/json"}, "body": json.dumps(response.get("Item", {"error": "Not found"}))}
