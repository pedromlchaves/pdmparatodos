from mistralai import Mistral
from fastapi.responses import StreamingResponse


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
        You are an expert document analyst with a focus on legal documents from public municipalities called Plano Director Municipal.
        
        I will provide you with:
        1 - the classification of the location according to the Plano Director Municipal
        2 - a series of relevant articles from the Plano Director Municipal that describe the details about the classification above
        3 - a question about that particular location that I need an answer to, based on its location classification and the articles provided
        
        You answer only to pertinent questions.
        For every answer, always provide the article numbers ("Artigo"), sections ("SECÇÃO") or subsections ("SUBSECÇÃO") that support your answer and a summmarized explanation.
        Every reference to the articles should be done in ascending order. A paragraph per article reference is ideal.
        Create clear paragraphs delimited by new lines, using markdown to bolden the article references.
        You answer only in European Portuguese (PT-PT).
        """

        self.system_prompt_chat = """
        You are an expert document analyst with a focus on legal documents from public municipalities called Plano Director Municipal.
        
        I will provide you with:
        1 - a series of relevant articles from the Plano Director Municipal that describe the context for the question being made
        2 - a question that I need an answer to, based on the articles provided
        
        You answer only to pertinent questions.
        For every answer, always provide the article numbers ("Artigo"), sections ("SECÇÃO") or subsections ("SUBSECÇÃO") that support your answer and a summmarized explanation.
        Every reference to the articles should be done in ascending order. A paragraph per article reference is ideal.
        Create clear paragraphs delimited by new lines, using markdown to bolden the article references.
        You answer only in European Portuguese (PT-PT).
        """

    def generate_prompt(self, layers_formatted, all_relevant_chunks, question):
        return f"""
                In the Plano Director Municipal, the location is classified as:

                {layers_formatted}

                The relevant texts for the classification of this location are below:

                ---------------------
                {all_relevant_chunks}
                ---------------------

                Given the the location classification and the texts from the Plano Director Municipal that are provided, answer the question.

                Question: {question}
                Answer:
                """

    def generate_chat_prompt(self, all_relevant_chunks, question):
        return f"""
                The relevant articles for this question are below:

                ---------------------
                {all_relevant_chunks}
                ---------------------

                Given the texts from the Plano Director Municipal that are provided, answer the question.

                Question: {question}
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

    def generate_chat_streaming(self, prompt):
        messages = [
            {
                "role": "system",
                "content": self.system_prompt_chat,
            },
            {"role": "user", "content": prompt},
        ]

        stream = self.client.chat.stream(
            model=self.model, messages=messages, temperature=0
        )

        async def generator():
            for chunk in stream:
                yield chunk.data.choices[0].delta.content or ""

        response_messages = generator()

        return StreamingResponse(response_messages, media_type="text/event-stream")
