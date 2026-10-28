import os
from pinecone import Pinecone, SchemaBuilder
from dotenv import load_dotenv
load_dotenv()

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

# schema for the user-data index
schema = (
    SchemaBuilder()
      # .add_string_field(name="title", full_text_search={})
      .add_string_field(name="created", full_text_search={ "language": "en","stemming": True,"stop_words": True})
      .add_string_field(name="body", full_text_search={"language": "en","stemming": True,"stop_words": True})
      # .add_string_field(name="summary", full_text_search={})
      .build()
)

pc.indexes.create(name="user-data", schema=schema)