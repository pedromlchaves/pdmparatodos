import faiss


class Retriever:
    def __init__(self, index_path, vectorizer):
        self.index = faiss.read_index(index_path)
        self.vectorizer = vectorizer

    def retrieve(self, question, chunks, k=2):
        question_embeddings = self.vectorizer.transform([question])
        D, I = self.index.search(question_embeddings, k)
        retrieved_chunk = [chunks[i] for i in I.tolist()[0]]
        return retrieved_chunk
