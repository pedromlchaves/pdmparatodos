import faiss
import numpy as np


class Retriever:
    def __init__(self, index_path, vectorizer):
        self.index = faiss.read_index(index_path)
        self.vectorizer = vectorizer

    def retrieve(self, question, chunks, k=2):
        question_embeddings = self.vectorizer.get_text_embedding(question)
        D, I = self.index.search(np.array(question_embeddings).reshape(1, -1), k)
        retrieved_chunk = [chunks[i] for i in I.tolist()[0]]
        return retrieved_chunk
