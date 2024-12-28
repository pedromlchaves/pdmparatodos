from mistralai import Mistral
import requests
import numpy as np
import faiss
import os
import time


class TextVectorizer:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv("MISTRAL_API_KEY")
        self.client = Mistral(api_key=self.api_key)

    def get_text_embedding(self, input):
        embeddings_batch_response = self.client.embeddings.create(
            model="mistral-embed", inputs=input
        )

        return embeddings_batch_response.data[0].embedding

    def get_embeddings(self, chunks):
        return np.array([self.get_text_embedding(chunk) for chunk in chunks])

    def save_embeddings_to_db(self, text_embeddings, db_path):
        d = text_embeddings.shape[1]
        index = faiss.IndexFlatL2(d)
        index.add(text_embeddings)
        faiss.write_index(index, db_path)


# Usage example:
# vectorizer = TextVectorizer()
# text_embeddings = vectorizer.get_embeddings(chunks)
# vectorizer.save_embeddings_to_db(text_embeddings, "embeddings.index")
