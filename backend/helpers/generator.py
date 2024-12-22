from mistralai import Mistral
from .retriever import Retriever
from .vectorizer import TextVectorizer


class Generator:
    def __init__(
        self,
        api_key,
        index_path="embeddings.index",
        chunks_path="chunks.txt",
        model="mistral-large-latest",
    ):
        self.api_key = api_key
        self.client = Mistral(api_key=api_key)
        self.vectorizer = TextVectorizer(api_key=api_key)
        self.retriever = Retriever(index_path=index_path, vectorizer=self.vectorizer)
        self.chunks = open(chunks_path).read().splitlines()
        self.model = model

    def retrieve_chunks(self, question, chunks, k=1):
        return self.retriever.retrieve(question, chunks, k)

    def generate_prompt(self, retrieved_chunks, question):
        return f"""
        Context information is below.
        ---------------------
        {retrieved_chunks[0]}
        ---------------------
        Given the context information and not prior knowledge, answer the query.
        Query: {question}
        Answer:
        """

    def generate(self, prompt):
        messages = [
            {
                "role": "system",
                "content": "You are an expert document analyst with a focus on legal documents from public municipalities. You answer only to pertinent questions - in European Portuguese (PT-PT)",
            },
            {"role": "user", "content": prompt},
        ]
        chat_response = self.client.chat.complete(model=self.model, messages=messages)
        return chat_response.choices[0].message.content
