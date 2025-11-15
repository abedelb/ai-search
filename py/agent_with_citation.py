# citation_cleaner.py

import re

# Fuzzy UUID pattern:
# - Detects malformed brackets
# - Allows garbage before/after the UUID
# - Only group(1) is the real UUID
UUID_FUZZY_REGEX = re.compile(
    r"[^\w]*("
    r"[0-9a-fA-F]{8}-"
    r"(?:[0-9a-fA-F]{4}-){3}"
    r"[0-9a-fA-F]{12}"
    r")[^\w]*"
)


class CitationRewriter:
    """
    Streaming-safe UUID → (n) replacer.
    - Prevents UUIDs from appearing in output
    - Handles malformed citations
    - Prevents streaming stalls
    """

    def __init__(self):
        self.uuid_map = {}          # {uuid: number}
        self.counter = 1            # next number to assign
        self.buffer = ""            # rolling buffer for partial tokens

    def process_token(self, token: str) -> str:
        """
        Accepts a new model token and returns "clean" output with UUID replaced.
        Never lets UUID appear in output.
        """
        self.buffer += token
        output = ""

        while True:
            match = UUID_FUZZY_REGEX.search(self.buffer)
            if not match:
                # Prevent buffer from growing forever.
                # Keep last 50 chars for potential partial UUIDs.
                if len(self.buffer) > 50:
                    output += self.buffer[:-50]
                    self.buffer = self.buffer[-50:]
                return output

            uuid = match.group(1)

            # Assign number for new UUID
            if uuid not in self.uuid_map:
                self.uuid_map[uuid] = self.counter
                self.counter += 1

            num = self.uuid_map[uuid]
            start, end = match.span()

            # Text before UUID → safe to output
            output += self.buffer[:start]

            # Output replacement
            output += f"({num})"

            # Remove processed chunk
            self.buffer = self.buffer[end:]

# NODE
# graph_rag.py
from langgraph.graph import StateGraph, END
from typing import List, Dict
from pydantic import BaseModel
from langchain.vectorstores import FAISS
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.llms import OpenAI

class RAGState(BaseModel):
    query: str
    documents: List[Dict] = []
    answer: str = ""

# --- Load retriever ---
emb = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
db = FAISS.load_local("db_index", emb)
retriever = db.as_retriever(k=3)

llm = OpenAI(model="gpt-4o-mini")

# --- Nodes ---
def retrieve_node(state: RAGState):
    docs = retriever.get_relevant_documents(state.query)

    sources = []
    for i, d in enumerate(docs, start=1):
        sources.append({
            "id": i,
            "content": d.page_content,
            "source": d.metadata.get("source", f"doc{i}.png"),
        })
    return {"documents": sources}

def generate_node(state: RAGState):
    citation_text = ""
    for doc in state.documents:
        citation_text += f"({doc['id']}) {doc['content']}\n\n"

    prompt = f"""
    Answer the question using the documents and cite them using (1), (2), ...

    Question: {state.query}

    Documents:
    {citation_text}

    Final answer with inline citations:
    """

    answer = llm(prompt)
    return {"answer": answer}

# --- Build graph ---
graph = StateGraph(RAGState)
graph.add_node("retrieve", retrieve_node)
graph.add_node("generate", generate_node)

graph.set_entry_point("retrieve")
graph.add_edge("retrieve", "generate")
graph.add_edge("generate", END)

app = graph.compile()

# STREAMLIT


# app.py
import streamlit as st
from graph_rag import app, RAGState
import base64
import re
import os

st.title("RAG with Hover Citations")

query = st.text_input("Ask something:")

def encode_img(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()

def render_with_hover_images(answer, documents):
    html = answer

    for doc in documents:
        cid = doc["id"]
        img_path = os.path.join("citations", doc["source"])

        if os.path.exists(img_path):
            img_b64 = encode_img(img_path)
            tooltip = f"""
            <span class='cite'>( {cid} )
                <span class='tooltip'>
                    <img src='data:image/png;base64,{img_b64}' width='250'>
                </span>
            </span>
            """
        else:
            tooltip = f"( {cid} )"

        html = re.sub(rf"\({cid}\)", tooltip, html)

    return html

if query:
    result = app.invoke({"query": query})
    styled = render_with_hover_images(result.answer, result.documents)

    st.markdown(
        """
        <style>
        .cite {
            position: relative;
            cursor: pointer;
            color: #0077ff;
            font-weight: bold;
        }
        .tooltip {
            visibility: hidden;
            position: absolute;
            background: white;
            padding: 6px;
            border: 1px solid #ccc;
            border-radius: 6px;
            z-index: 10;
            top: 20px;
            left: 0px;
        }
        .cite:hover .tooltip {
            visibility: visible;
        }
        </style>
        """,
        unsafe_allow_html=True
    )

    st.markdown(styled, unsafe_allow_html=True)