# pip install --upgrade pinecone
import os
from pinecone import Pinecone
from dotenv import load_dotenv
load_dotenv()




def data_entry():
  pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
  index = pc.index(name="user-data")

  NAMESPACE = "test-data"

  docs = [
      {
          "_id": "journal-001",
          "created": "2026-10-16T20:30:00+05:30",
          "body": "Today I worked on a Python project and learned how to structure code into reusable functions. I also explored how environment variables can be used to store API keys securely. For breakfast, I had oatmeal and a banana. Lunch was rice with grilled chicken and vegetables, and dinner was chapati with dal. In the evening, I did a chest workout consisting of bench press, incline dumbbell press, and cable flyes, followed by 10 minutes of walking."
      },
      {
          "_id": "journal-002",
          "created": "2026-10-17T20:45:00+05:30",
          "body": "Today I studied retrieval-augmented generation and learned why RAG systems retrieve relevant documents before sending context to an LLM. I implemented a basic text search using Pinecone and tested it with different queries. For breakfast, I had eggs and toast. Lunch was rice with paneer curry, and dinner was vegetable pulao with yogurt. I completed a back workout with lat pulldowns, seated rows, and dumbbell rows, then cycled for 15 minutes."
      },
      {
          "_id": "journal-003",
          "created": "2026-10-18T21:00:00+05:30",
          "body": "Today I explored Python exception handling and practiced using try-except blocks to handle API errors. I also reviewed the difference between lexical search and semantic search. Breakfast was idli with sambar, lunch was chicken biryani, and dinner was chapati with mixed vegetable curry. I trained legs today, including squats, leg presses, Romanian deadlifts, and calf raises. I finished with a short stretching session."
      },
      {
          "_id": "journal-004",
          "created": "2026-10-19T20:15:00+05:30",
          "body": "Today I worked on Docker fundamentals. I created a Dockerfile for a small Python application and learned how to build an image and run a container. I also studied how environment variables can be passed into containers. For breakfast, I had yogurt with oats and fruit. Lunch was rice with fish curry, and dinner was dosa with chutney. I did a shoulder and triceps workout consisting of overhead presses, lateral raises, triceps pushdowns, and overhead triceps extensions."
      },
      {
          "_id": "journal-005",
          "created": "2026-10-20T20:40:00+05:30",
          "body": "Today I learned about vector embeddings and how they represent the semantic meaning of text as numerical vectors. I experimented with the sentence-transformers library and read about the all-MiniLM-L6-v2 model, which generates 384-dimensional embeddings. Breakfast was scrambled eggs with toast, lunch was rice with dal and vegetables, and dinner was grilled chicken with chapati. I completed a chest and biceps workout, including bench press, incline dumbbell press, barbell curls, and hammer curls."
      },
      {
          "_id": "journal-006",
          "created": "2026-10-21T20:50:00+05:30",
          "body": "Today I explored how to deploy Python applications using cloud hosting and Docker. I reviewed how a platform such as Railway runs a container and injects environment variables at runtime. I also learned why application code should listen on the port provided by the hosting platform. For breakfast, I had poha and a glass of milk. Lunch was chapati with paneer curry, and dinner was rice with grilled fish and vegetables. I trained my back with pull-ups, lat pulldowns, cable rows, and face pulls, followed by 12 minutes on the treadmill."
      },
      {
          "_id": "journal-007",
          "created": "2026-10-22T20:25:00+05:30",
          "body": "Today I studied database indexing and learned how indexes can improve the speed of data retrieval. I compared the purpose of a database index with a vector search index and reviewed the differences between metadata filtering and namespace-based separation in Pinecone. Breakfast was oatmeal with a banana, lunch was chicken and rice, and dinner was lentil soup with chapati. I completed a leg workout with squats, lunges, leg curls, and calf raises. I also walked for 20 minutes after the workout."
      },
      {
          "_id": "journal-008",
          "created": "2026-10-23T21:10:00+05:30",
          "body": "Today I implemented a basic API endpoint using FastAPI and tested it with sample JSON requests. I learned how request bodies are validated and how an endpoint can return structured responses. I also reviewed how to separate application logic into different Python modules. For breakfast, I had dosa with sambar. Lunch was rice with chicken curry, and dinner was a paneer wrap with vegetables. I trained shoulders and arms with shoulder presses, lateral raises, dumbbell curls, and triceps pushdowns."
      },
      {
          "_id": "journal-009",
          "created": "2026-10-24T20:35:00+05:30",
          "body": "Today I focused on improving my RAG pipeline. I tested several questions against a collection of sample documents and noticed that retrieving only the first search result can cause incomplete answers. I learned why sending multiple relevant documents to the LLM can improve answer quality, provided irrelevant context is filtered out. Breakfast was eggs with toast, lunch was vegetable fried rice, and dinner was chapati with chicken curry. I completed a back and biceps workout with seated rows, lat pulldowns, dumbbell curls, and hammer curls."
      },
      {
          "_id": "journal-010",
          "created": "2026-10-25T20:45:00+05:30",
          "body": "Today I reviewed the architecture of my prototype second-brain application. I considered storing original journal entries with timestamps and using a local embedding model for semantic retrieval. I also learned that embeddings do not generate titles or summaries; they represent text numerically for similarity search. For breakfast, I had idli with sambar and fruit. Lunch was rice with grilled chicken and vegetables, and dinner was chapati with paneer curry. I completed a full-body workout with squats, bench press, seated rows, shoulder presses, and planks. I ended the day by reviewing the concepts I learned throughout the week."
      }
  ]

  try : 
    index.documents.upsert(
        namespace=NAMESPACE,
        documents=docs,
    )
  except Exception as e:
    print("ERROR IN DATA ENTRY:", e)

  
data_entry()