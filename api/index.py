"""Vercel serverless entry point — re-exports the Flask WSGI app."""
import sys
import os

# Ensure project root and src/ are on the Python path
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
for p in (ROOT, SRC):
    if p not in sys.path:
        sys.path.insert(0, p)

from src.app import app
