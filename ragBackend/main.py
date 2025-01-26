from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
from openai import OpenAI
import os
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import Pinecone as LangchainPinecone
from pinecone import Pinecone

# Load environment variables
load_dotenv()

# FastAPI app
app = FastAPI()

class QueryRequest(BaseModel):
    question: str

class RAGService:
    _instance = None

    def __init__(self):
        # OpenAI client
        self.openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        # Pinecone setup
        pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
        
        # OpenAI embeddings
        embeddings = OpenAIEmbeddings()
        
        # Langchain Pinecone index
        self.index = LangchainPinecone(
            index_name="blockchain-rag",
            embedding=embeddings
        )
        
        # Retriever
        self.retriever = self.index.as_retriever(search_kwargs={"k": 3})

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def query(self, question: str) -> Dict[str, Any]:
        # Retrieve relevant documents
        docs = self.retriever.get_relevant_documents(question)
        
        # Construct context from retrieved docs
        context = "\n\n".join([doc.page_content for doc in docs])
        
        # Generate response using OpenAI
        response = self.openai_client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that answers questions based on the given context."},
                {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}\n\nAnswer the question using only the provided context."}
            ]
        )
        
        return {
            "answer": response.choices[0].message.content,
            "sources": [{"content": doc.page_content, "metadata": doc.metadata} for doc in docs]
        }

@app.post("/api/rag-query")
async def rag_query(request: QueryRequest):
    try:
        rag_service = RAGService.get_instance()
        result = rag_service.query(request.question)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Additional CORS and other configurations would be added here