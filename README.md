# FortiAccess

FortiAccess is a cloud architecture and risk-based access optimization platform.

Current scaffold:
- FastAPI backend
- React + Vite frontend
- Data, Terraform, and documentation directories
- Security and cloud service modules prepared for implementation

## Development order
1. Backend setup
2. Database
3. Authentication
4. RBAC
5. Risk engine
6. Cloud architecture engine
7. Optimization
8. Frontend integration

## Run later
Backend:
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Linux/macOS: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```
