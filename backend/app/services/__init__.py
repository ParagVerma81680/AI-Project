# app/services/__init__.py
#
# Service layer — pure business logic, independent of HTTP.
# Each service module wraps one domain area:
#
#   product_service.py   — CRUD for products
#   policy_service.py    — Store-policy look-ups and RAG retrieval
#   route_service.py     — Dijkstra / A* path-finding
#   ai_service.py        — Thin wrapper around the Claude API client
