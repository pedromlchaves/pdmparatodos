import fitz


class PDFChunker:
    def __init__(self, pdf_path):
        self.pdf_path = pdf_path
        self.pdf_document = fitz.open(pdf_path)

    def split_pdf_by_sections(self, pattern):
        sections = []
        current_section = []
        for page_num in range(len(self.pdf_document)):
            page = self.pdf_document.load_page(page_num)
            text = page.get_text("text")
            lines = text.split("\n")
            for line in lines:
                if line.startswith(pattern):
                    if current_section:
                        sections.append("\n".join(current_section))
                    current_section = [line]
                else:
                    current_section.append(line)
        if current_section:
            sections.append("\n".join(current_section))
        return sections

    def save_chunks_to_file(self, chunks, output_path):
        with open(output_path, "w") as f:
            for chunk in chunks:
                f.write(chunk + "\n\n")
        print(f"Chunks saved to {output_path}")
