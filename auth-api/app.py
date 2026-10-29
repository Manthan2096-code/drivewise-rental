"""Small Flask service for DriveWise Experiment 8: JWT authentication."""

from datetime import datetime, timedelta, timezone
import os

import jwt
from flask import Flask, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)
SECRET_KEY = os.environ.get("DRIVEWISE_JWT_SECRET", "drivewise-local-experiment-secret")
# shortcut: accounts live only until this process stops, matching the lab exercise; use a database for persistent accounts.
users = {}


@app.post("/register")
@app.post("/auth/register")
def register():
    details = request.get_json(silent=True) or {}
    name = details.get("name")
    email = details.get("email")
    password = details.get("password")

    if not all(isinstance(value, str) and value.strip() for value in (name, email, password)):
        return jsonify(error="Name, email, and password are required."), 400
    email = email.strip().lower()
    if "@" not in email or "." not in email.rsplit("@", 1)[-1] or len(password) < 8:
        return jsonify(error="Enter a valid email and a password with at least 8 characters."), 400
    if email in users:
        return jsonify(error="An account with this email already exists."), 409

    users[email] = {"name": name.strip(), "passwordHash": generate_password_hash(password)}
    return jsonify(message="User registered successfully.", name=name.strip(), email=email), 201


@app.post("/login")
@app.post("/auth/login")
def login():
    details = request.get_json(silent=True) or {}
    email = details.get("email")
    password = details.get("password")
    if not isinstance(email, str) or not isinstance(password, str):
        return jsonify(error="Email and password are required."), 400

    user = users.get(email.strip().lower())
    if not user or not check_password_hash(user["passwordHash"], password):
        return jsonify(error="Invalid email or password."), 401

    token = jwt.encode(
        {"sub": email.strip().lower(), "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
        SECRET_KEY,
        algorithm="HS256",
    )
    return jsonify(message="Login successful.", token=token, tokenType="Bearer"), 200


@app.get("/dashboard")
@app.get("/auth/dashboard")
def dashboard():
    authorization = request.headers.get("Authorization", "")
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return jsonify(error="A Bearer token is required."), 401

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.InvalidTokenError:
        return jsonify(error="The token is invalid or expired."), 401

    user = users.get(payload.get("sub"))
    if not user:
        return jsonify(error="The account is no longer available. Please log in again."), 401
    return jsonify(message=f"Welcome, {user['name']}!", email=payload["sub"]), 200


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
