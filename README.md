# FastAPI Project

This project provides an API to interact with a Web Map Service (WMS) and answer questions based on geographical coordinates.

## Getting Started

### Prerequisites

- Python 3.7+
- pip (Python package installer)

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/yourusername/yourrepository.git
   cd yourrepository/backend

2. Create a virtual environment and activate it:
   ```sh
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`

3. Install the required dependencies:
   ```sh
   pip install -r requirements.txt

### Running and testing the API
1. Run main.py
   ```sh
   uvicorn main:app --reload
   
2. Check Swagger and test the endooints:
   ```sh
   http://127.0.0.1:8000/docs