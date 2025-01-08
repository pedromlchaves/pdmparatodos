import faiss
import numpy as np


class Retriever:
    def __init__(self, index_path, vectorizer):
        self.index = faiss.read_index(index_path)
        self.vectorizer = vectorizer

    def retrieve(self, input, chunks, k=2):
        question_embeddings = self.vectorizer.get_text_embedding(input)

        D, I = self.index.search(np.array(question_embeddings), k)
        indexes = I.flatten()

        retrieved_chunk = [chunks[i] for i in indexes]

        return retrieved_chunk
