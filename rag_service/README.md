# RideRent RAG Agent

This is the LangGraph + OpenRouter RAG service used by the RideRent frontend.

## 1. Python environment

Use Python 3.11 or 3.12 for the RAG service for the widest compatibility with the AI packages.

```powershell
cd rag_service
py -3.12 -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Add the PDF

Put the PDF you want the agent to answer from here:

```text
rag_service/data/knowledge.pdf
```

The filename can be changed with `PDF_PATH` in `.env`.

## 3. Configure OpenRouter

Copy `.env.example` to `.env` and set:

```env
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=...
```

The model can be any OpenRouter chat model available to your account.

## 4. Start the service

```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

The service will load the PDF when it starts.

## Architecture

```text
React floating chat
        |
        v
Laravel /api/agent/chat
        |
        v
FastAPI RAG service
        |
        v
LangGraph
  retrieve -> generate
        |
        +--> BM25 retrieval from PDF chunks
        |
        +--> OpenRouter chat model
```

The OpenRouter key stays inside this Python service and is never sent to the browser.
