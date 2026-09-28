from pathlib import Path
from typing import TypedDict

from fastapi import FastAPI
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader
from langgraph.graph import StateGraph, START, END
from dotenv import load_dotenv
import os


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv(
    "OPENROUTER_MODEL",
    "google/gemini-2.5-flash"
)

# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

PDF_PATH = BASE_DIR / "data" / "knowledge.pdf"
CHROMA_DIR = BASE_DIR / "chroma_db"


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(title="RideRent RAG Agent")


# ============================================================
# EMBEDDING MODEL
# ============================================================

embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-small-en-v1.5"
)


# ============================================================
# LOAD PDF
# ============================================================

def load_pdf():

    loader = PyPDFLoader(str(PDF_PATH))

    documents = loader.load()

    return documents


# ============================================================
# SPLIT PDF INTO CHUNKS
# ============================================================

def create_chunks(documents):

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=150
    )

    chunks = splitter.split_documents(documents)

    return chunks


# ============================================================
# CREATE / LOAD CHROMA VECTOR DATABASE
# ============================================================

def create_vector_database():

    # If Chroma database already exists,
    # load it instead of embedding the PDF again.

    if CHROMA_DIR.exists():

        vectorstore = Chroma(
            collection_name="riderent_pdf",
            embedding_function=embeddings,
            persist_directory=str(CHROMA_DIR)
        )

        return vectorstore

    # Load PDF
    documents = load_pdf()

    # Split PDF
    chunks = create_chunks(documents)

    # Create Chroma database
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        collection_name="riderent_pdf",
        persist_directory=str(CHROMA_DIR)
    )

    return vectorstore


# ============================================================
# INITIALIZE VECTOR DATABASE
# ============================================================

vectorstore = create_vector_database()

retriever = vectorstore.as_retriever(
    search_kwargs={
        "k": 4
    }
)


# ============================================================
# OPENROUTER LLM
# ============================================================

llm = ChatOpenAI(
    model=OPENROUTER_MODEL,
    api_key=OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1",
    temperature=0.2,
    max_tokens=1000
)


# ============================================================
# LANGGRAPH STATE
# ============================================================

class AgentState(TypedDict):

    question: str
    context: list[Document]
    answer: str


# ============================================================
# RETRIEVE NODE
# ============================================================

def retrieve_documents(state: AgentState):

    question = state["question"]

    documents = retriever.invoke(question)

    return {
        "context": documents
    }


# ============================================================
# GENERATE NODE
# ============================================================

def generate_answer(state: AgentState):

    question = state["question"]

    documents = state["context"]

    # Combine retrieved PDF chunks
    context = "\n\n".join(
        document.page_content
        for document in documents
    )

    prompt = f"""
You are the RideRent AI assistant.

Answer the user's question using ONLY the information
provided in the PDF context below.

If the answer cannot be found in the PDF, say:

"I couldn't find that information in the provided document."

Do not invent information.

Keep the answer clear and concise.

PDF CONTEXT:
----------------
{context}
----------------

USER QUESTION:
{question}
"""

    response = llm.invoke(prompt)

    return {
        "answer": response.content
    }


# ============================================================
# BUILD LANGGRAPH
# ============================================================

graph_builder = StateGraph(AgentState)

graph_builder.add_node(
    "retrieve",
    retrieve_documents
)

graph_builder.add_node(
    "generate",
    generate_answer
)

graph_builder.add_edge(
    START,
    "retrieve"
)

graph_builder.add_edge(
    "retrieve",
    "generate"
)

graph_builder.add_edge(
    "generate",
    END
)

graph = graph_builder.compile()


# ============================================================
# API REQUEST MODEL
# ============================================================

class ChatRequest(BaseModel):

    question: str


# ============================================================
# CHAT ENDPOINT
# ============================================================

@app.post("/chat")
async def chat(request: ChatRequest):

    result = graph.invoke(
        {
            "question": request.question,
            "context": [],
            "answer": ""
        }
    )

    sources = []

    for document in result["context"]:

        page = document.metadata.get("page")

        sources.append({
            "page": page + 1 if page is not None else None,
            "source": document.metadata.get(
                "source",
                "knowledge.pdf"
            )
        })

    return {
        "answer": result["answer"],
        "sources": sources
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
async def health():

    return {
        "status": "ok",
        "pdf_loaded": PDF_PATH.exists(),
        "vector_database": "ChromaDB",
        "embedding_model": "BAAI/bge-small-en-v1.5",
        "llm": OPENROUTER_MODEL
    }