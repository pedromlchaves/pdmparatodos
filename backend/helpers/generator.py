from mistralai import Mistral
from retriever import Retriever
from vectorizer import TextVectorizer


class Generator:
    def __init__(
        self,
        api_key,
        model="mistral-large-latest",
    ):
        self.api_key = api_key
        self.client = Mistral(api_key=api_key)
        self.model = model

        self.system_prompt = """
        You are an expert document analyst with a focus on legal documents from public municipalities.
        I will provide you with a context and a question.
        The context will be a series of relevant articles from the Plano Director Municipal which characterizes the location that the question pertains to.
        You answer only to pertinent questions
        You answer only in European Portuguese (PT-PT).
        """

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
                "content": self.system_prompt,
            },
            {"role": "user", "content": prompt},
        ]
        chat_response = self.client.chat.complete(
            model=self.model, messages=messages, temperature=0
        )
        return chat_response.choices[0].message.content
