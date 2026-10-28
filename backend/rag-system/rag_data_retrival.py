import os

from google import genai
from pinecone import Pinecone
from dotenv import load_dotenv

load_dotenv()


def llm(context_from_rag, question):
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

    interaction = client.interactions.create(
        model="gemini-3.6-flash",
        system_instruction=(
            "You are a RAG summarization assistant. "
            "Summarize the provided context clearly and concisely "
            "without adding information that is not present in the context."
            "You need to use the context provided to answer the question. "
            "You are not supposed to make up any information that is not present in the context."
        ),
        input="Question: " + question + "\nContext: " + context_from_rag,
    )

    print("LLM OUTPUT:", interaction.output_text)


NAMESPACE = "test-data"
QUESTION = "what did i do on oct 21"


def retrieve_context(index, question):
    response = index.documents.search(
        namespace=NAMESPACE,
        top_k=5,
        score_by=[{"type": "text", "fields": ["body"], "query": question}],
        include_fields=["created", "body"],
    )

    context = []
    for match in response.matches:
        created = match.get("created")
        body = match.get("body")
        print(f"Match: id={match.id}, score={match.score}, created={created}")
        if body:
            context.append(f"Date: {created}\n{body}" if created else body)

    return "\n\n".join(context)


def main():
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    index = pc.index(name="user-data")

    print("Searching...")
    context = retrieve_context(index, QUESTION)
    if not context:
        print("No matching documents found.")
        return

    llm(context, QUESTION)


if __name__ == "__main__":
    main()