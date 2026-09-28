
# Import Path for working with file and directory paths in a platform-independent way.
from pathlib import Path

# Import TypedDict for defining the expected structure of the LangGraph state.
from typing import TypedDict

# Import FastAPI to create the web API application.
from fastapi import FastAPI

# Import BaseModel to define and validate incoming API request data.
from pydantic import BaseModel

# Import ChatOpenAI, which provides an interface for calling OpenAI-compatible chat models.
from langchain_openai import ChatOpenAI

# Import Document, which represents a document/chunk and its metadata in LangChain.
from langchain_core.documents import Document

# Import HuggingFaceEmbeddings for converting text into numerical vector embeddings.
from langchain_huggingface import HuggingFaceEmbeddings

# Import Chroma, the vector database used to store and search document embeddings.
from langchain_chroma import Chroma

# Import RecursiveCharacterTextSplitter for splitting large documents into smaller chunks.
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Import PyPDFLoader for reading PDF files and converting their pages into LangChain documents.
from langchain_community.document_loaders import PyPDFLoader

# Import LangGraph components used to create the retrieval and generation workflow.
from langgraph.graph import StateGraph, START, END

# Import load_dotenv so variables from the .env file can be loaded into the environment.
from dotenv import load_dotenv

# Import os so the program can read environment variables.
import os


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

# Read the variables stored inside the .env file and make them available through os.getenv().
load_dotenv()

# Read the OpenRouter API key from the OPENROUTER_API_KEY environment variable.
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Read the model name from the OPENROUTER_MODEL environment variable.
# If OPENROUTER_MODEL does not exist, Gemini 2.5 Flash will be used as the default.
OPENROUTER_MODEL = os.getenv(
    "OPENROUTER_MODEL",
    "google/gemini-2.5-flash"
)


# ============================================================
# PATHS
# ============================================================

# Get the absolute path of the directory containing this main.py file.
BASE_DIR = Path(__file__).resolve().parent

# Build the path to the PDF knowledge file.
PDF_PATH = BASE_DIR / "data" / "knowledge.pdf"

# Build the path where the Chroma vector database will be stored.
CHROMA_DIR = BASE_DIR / "chroma_db"


# ============================================================
# FASTAPI
# ============================================================

# Create the FastAPI application and give it the title "RideRent RAG Agent".
app = FastAPI(title="RideRent RAG Agent")


# ============================================================
# EMBEDDING MODEL
# ============================================================

# Create the Hugging Face embedding model.
# This model converts text into numerical vectors that Chroma can search.
embeddings = HuggingFaceEmbeddings(
    # Specify the BAAI BGE Small English embedding model.
    model_name="BAAI/bge-small-en-v1.5"
)


# ============================================================
# LOAD PDF
# ============================================================

# Define a function that loads the knowledge PDF.
def load_pdf():

    # Create a PDF loader using the path of knowledge.pdf.
    loader = PyPDFLoader(str(PDF_PATH))

    # Read the PDF and convert its pages into LangChain Document objects.
    documents = loader.load()

    # Return the loaded documents.
    return documents


# ============================================================
# SPLIT PDF INTO CHUNKS
# ============================================================

# Define a function that splits the PDF documents into smaller pieces.
def create_chunks(documents):

    # Create a text splitter that recursively divides large text into smaller chunks.
    splitter = RecursiveCharacterTextSplitter(
        # Each chunk can contain approximately 800 characters.
        chunk_size=800,

        # Keep 150 characters from the previous chunk in the next chunk.
        # This helps preserve context between chunks.
        chunk_overlap=150
    )

    # Split the documents into smaller chunks.
    chunks = splitter.split_documents(documents)

    # Return the generated chunks.
    return chunks


# ============================================================
# CREATE / LOAD CHROMA VECTOR DATABASE
# ============================================================

# Define a function that either loads an existing Chroma database
# or creates a new one from the PDF.
def create_vector_database():

    # Check whether the Chroma database directory already exists.
    if CHROMA_DIR.exists():

        # Open the existing Chroma vector database.
        vectorstore = Chroma(
            # Use "riderent_pdf" as the Chroma collection name.
            collection_name="riderent_pdf",

            # Tell Chroma which embedding model should be used for queries.
            embedding_function=embeddings,

            # Tell Chroma where the persistent database is stored.
            persist_directory=str(CHROMA_DIR)
        )

        # Return the existing vector database.
        return vectorstore

    # Load the PDF because no existing Chroma database was found.
    documents = load_pdf()

    # Split the PDF documents into smaller chunks.
    chunks = create_chunks(documents)

    # Create a new Chroma vector database from the document chunks.
    vectorstore = Chroma.from_documents(
        # Provide the chunks that should be stored.
        documents=chunks,

        # Use the Hugging Face embedding model to convert chunks into vectors.
        embedding=embeddings,

        # Give the Chroma collection a name.
        collection_name="riderent_pdf",

        # Store the database permanently in the specified directory.
        persist_directory=str(CHROMA_DIR)
    )

    # Return the newly created vector database.
    return vectorstore


# ============================================================
# INITIALIZE VECTOR DATABASE
# ============================================================

# Create the vector database or load the existing one.
vectorstore = create_vector_database()

# Create a retriever from Chroma.
retriever = vectorstore.as_retriever(
    # Configure the retriever.
    search_kwargs={
        # Return the 4 most relevant document chunks for each question.
        "k": 4
    }
)


# ============================================================
# OPENROUTER LLM
# ============================================================

# Create the chat language model that will generate the final answer.
llm = ChatOpenAI(
    # Use the model specified by OPENROUTER_MODEL in the .env file.
    model=OPENROUTER_MODEL,

    # Provide the OpenRouter API key for authentication.
    api_key=OPENROUTER_API_KEY,

    # Tell ChatOpenAI to send requests to OpenRouter instead of OpenAI directly.
    base_url="https://openrouter.ai/api/v1",

    # Set a low temperature so answers are more consistent and less random.
    temperature=0.2,

    # Limit the generated response to a maximum of 1000 tokens.
    max_tokens=1000
)


# ============================================================
# LANGGRAPH STATE
# ============================================================

# Define the structure of the state that moves through the LangGraph workflow.
class AgentState(TypedDict):

    # Store the user's question.
    question: str

    # Store the document chunks retrieved from Chroma.
    context: list[Document]

    # Store the final answer generated by the LLM.
    answer: str


# ============================================================
# RETRIEVE NODE
# ============================================================

# Define the retrieval step of the RAG pipeline.
def retrieve_documents(state: AgentState):

    # Extract the user's question from the current LangGraph state.
    question = state["question"]

    # Search Chroma for the document chunks most relevant to the question.
    documents = retriever.invoke(question)

    # Return the retrieved documents so they become the context for the next node.
    return {
        "context": documents
    }


# ============================================================
# GENERATE NODE
# ============================================================

# Define the generation step of the RAG pipeline.
def generate_answer(state: AgentState):

    # Extract the user's question from the LangGraph state.
    question = state["question"]

    # Extract the document chunks retrieved by the retrieval node.
    documents = state["context"]

    # Combine the text from all retrieved document chunks into one string.
    context = "\n\n".join(
        # Take the actual text content from each retrieved Document.
        document.page_content
        # Iterate through every retrieved document.
        for document in documents
    )

    # Create the prompt that will be sent to the language model.
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

    # Send the prompt to the configured OpenRouter model.
    response = llm.invoke(prompt)

    # Return the generated answer so it becomes part of the LangGraph state.
    return {
        "answer": response.content
    }


# ============================================================
# BUILD LANGGRAPH
# ============================================================

# Create a LangGraph state graph using AgentState as the state structure.
graph_builder = StateGraph(AgentState)

# Add the document retrieval function as a node named "retrieve".
graph_builder.add_node(
    "retrieve",
    retrieve_documents
)

# Add the answer generation function as a node named "generate".
graph_builder.add_node(
    "generate",
    generate_answer
)

# Connect the START of the graph to the retrieval node.
graph_builder.add_edge(
    START,
    "retrieve"
)

# Connect the retrieval node to the generation node.
graph_builder.add_edge(
    "retrieve",
    "generate"
)

# Connect the generation node to the END of the graph.
graph_builder.add_edge(
    "generate",
    END
)

# Compile the graph into an executable LangGraph application.
graph = graph_builder.compile()


# ============================================================
# API REQUEST MODEL
# ============================================================

# Define the structure of data expected by the /chat endpoint.
class ChatRequest(BaseModel):

    # The API request must contain a question as a string.
    question: str


# ============================================================
# CHAT ENDPOINT
# ============================================================

# Register a POST endpoint at /chat.
@app.post("/chat")

# Define the asynchronous function that handles chat requests.
async def chat(request: ChatRequest):

    # Execute the LangGraph workflow.
    result = graph.invoke(
        # Provide the initial state to the graph.
        {
            # Put the user's question into the state.
            "question": request.question,

            # Start with an empty context because retrieval has not happened yet.
            "context": [],

            # Start with an empty answer because generation has not happened yet.
            "answer": ""
        }
    )

    # Create an empty list that will contain source information.
    sources = []

    # Loop through every document retrieved by the RAG system.
    for document in result["context"]:

        # Get the PDF page number from the document metadata.
        page = document.metadata.get("page")

        # Add the source information to the sources list.
        sources.append({

            # Convert the zero-based PDF page number into a human-readable page number.
            "page": page + 1 if page is not None else None,

            # Get the source filename from metadata.
            # Use "knowledge.pdf" if the metadata doesn't contain a source.
            "source": document.metadata.get(
                "source",
                "knowledge.pdf"
            )
        })

    # Return the generated answer and the retrieved source information as JSON.
    return {
        # Return the final LLM-generated answer.
        "answer": result["answer"],

        # Return the PDF sources used to generate the answer.
        "sources": sources
    }


# ============================================================
# HEALTH CHECK
# ============================================================

# Register a GET endpoint at /health.
@app.get("/health")

# Define the health-check function.
async def health():

    # Return information about the current application status.
    return {

        # Indicate that the API is running.
        "status": "ok",

        # Check whether the knowledge.pdf file exists.
        "pdf_loaded": PDF_PATH.exists(),

        # Tell the client which vector database is being used.
        "vector_database": "ChromaDB",

        # Tell the client which embedding model is being used.
        "embedding_model": "BAAI/bge-small-en-v1.5",

        # Tell the client which LLM was loaded from the environment.
        "llm": OPENROUTER_MODEL
    }

