#!/usr/bin/env python3
"""
Run script for FPK Exam Guard Backend
"""

import os
from app import app

if __name__ == '__main__':
    # Get configuration from environment
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'true').lower() == 'true'
    
    print("=" * 60)
    print("FPK Exam Guard Backend Server")
    print("=" * 60)
    print(f"Starting server on {host}:{port}")
    print(f"Debug mode: {debug}")
    print("\nAPI Endpoints:")
    print("  POST  /api/auth/login              - User login")
    print("  GET   /api/auth/me                 - Get current user")
    print("  GET   /api/dashboard/overview       - Dashboard overview")
    print("  GET   /api/professors              - List professors")
    print("  GET   /api/exams                   - List exams")
    print("  GET   /api/departments             - List departments")
    print("  GET   /api/salles                  - List salles")
    print("  GET   /api/assignments              - List assignments")
    print("  GET   /api/incidents                - List incidents")
    print("\nDefault credentials:")
    print("  Admin: admin/admin")
    print("  Professor: prof/prof")
    print("=" * 60)
    
    app.run(host=host, port=port, debug=debug)
