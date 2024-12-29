import fitz
import re


class PDFChunker:
    def __init__(self, pdf_path):
        self.pdf_path = pdf_path
        self.pdf_document = fitz.open(pdf_path)

    def split_pdf_by_articles(self):
        text = ""
        for page in self.pdf_document:
            text += page.get_text("text")  # Options: "text", "html", "xml"

        text = text.split(
            "Republicação do Regulamento do Plano Diretor Municipal do Porto"
        )[1]
        # Split the text by the pattern "Artigo" followed by some numbering
        pattern = r"Artigo[\s\S]*?(?=TÍTULO|CAPÍTULO|SECÇÃO|SUBSECÇÃO|Artigo|ANEXOS)"
        matches = re.findall(pattern, text)

        clean_matches = []

        for match in matches:
            # The regex pattern to match the target text
            pattern = r"N\.º 20\s+27 de janeiro de 2023\s+Pág\. .*?\s+Diário da República, 2\.\ª série\s+PARTE .*"

            # Remove the matched pattern
            clean_match = re.sub(pattern, "", match)
            clean_matches.append(clean_match)

        return clean_matches

    def save_chunks_to_file(self, chunks, output_path):
        with open(output_path, "w") as f:
            for chunk in chunks:
                f.write(chunk + "\n\n")
        print(f"Chunks saved to {output_path}")
