from flask import Flask, request, jsonify
from flask_cors import CORS
import fitz  # PyMuPDF
from PIL import Image
import io
import base64
import os
import uuid
import asyncio
from functools import lru_cache
from langchain.schema.output_parser import StrOutputParser
import time
from langchain.schema.document import Document
from langchain_chroma import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.storage import InMemoryStore
from langchain_community.embeddings import GPT4AllEmbeddings
from langchain.retrievers.multi_vector import MultiVectorRetriever
from langchain.schema.messages import HumanMessage
from langchain_openai import ChatOpenAI
from langchain.schema.runnable import RunnablePassthrough, RunnableLambda
from base64 import b64decode

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize lists to store text and image data
text_data = []
img_base64_list = []
image_summaries = []

# Initialize the model and chain outside the route
model = ChatOpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key="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",
    model="llama3-70b-8192",
)

def split_image_text_types(docs):
    b64 = []
    text = []
    for doc in docs:
        try:
            b64decode(doc)
            b64.append(doc)
        except Exception as e:
            text.append(doc)
    return {"images": b64, "texts": text}

def prompt_func(dict):
    format_texts = "\n".join(dict["context"]["texts"])
    message_content = [
        {"type": "text", "text": f"""You are a medical assistant. Your task is to summarize medical records or answer questions based on the following context:
Question: {dict["question"]}

Text and tables:
{format_texts}
Give short and concise response.
"""}
    ]
    if dict["context"]["images"]:
        image_data = dict["context"]["images"][0]
        message_content.append(
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}}
        )
    return [HumanMessage(content=message_content)]

# Initialize the chain outside the route
retriever = None
chain = None

def setup_rag():
    global retriever, chain
    persist_directory = "C:/Users/Akhil/OneDrive/Desktop/HealthAgent/backend"
    embedding_model = GPT4AllEmbeddings()

    # Load the document with metadata
    docs_list = [Document(page_content=text['response'], metadata={"source": f"page_{i}"}) for i, text in enumerate(text_data)]
    img_list = [Document(page_content=img_summary['response'], metadata={"source": f"image_{i}"}) for i, img_summary in enumerate(image_summaries)]

    # Split documents
    text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
        chunk_size=3000, chunk_overlap=50
    )
    doc_splits = text_splitter.split_documents(docs_list)
    img_splits = text_splitter.split_documents(img_list)

    # Initialize vectorstore and store
    vectorstore = Chroma(
        collection_name="multi_modal_rag",
        embedding_function=embedding_model,
        persist_directory=persist_directory,
    )
    store = InMemoryStore()
    id_key = "doc_id"
    retriever = MultiVectorRetriever(
        vectorstore=vectorstore,
        docstore=store,
        id_key=id_key,
    )

# Add text splits
    doc_ids = [str(uuid.uuid4()) for _ in doc_splits]
    summary_texts = [
    Document(page_content=s.page_content, metadata={id_key: doc_ids[i], **s.metadata})
    for i, s in enumerate(doc_splits)
]
    retriever.vectorstore.add_documents(summary_texts)
    retriever.docstore.mset(list(zip(doc_ids, [s.page_content for s in doc_splits])))
    print(f"Added {len(summary_texts)} text documents to the retriever.")

# Debug: Check if documents are added to the vectorstore
    added_docs = retriever.vectorstore.get(include=["documents", "metadatas"])
    print(f"Added documents to vectorstore: {added_docs['documents'][:2]}")  # Print first 2 documents
    print(f"Added metadata to vectorstore: {added_docs['metadatas'][:2]}")  # Print first 2 metadata

# Debug: Check if documents are added to the docstore
    stored_docs = retriever.docstore.mget(doc_ids[:2])  # Retrieve first 2 documents    
    print(f"Stored documents in docstore: {stored_docs}")

    # Add image splits
    img_ids = [str(uuid.uuid4()) for _ in img_splits]
    summary_img = [
        Document(page_content=s.page_content, metadata={id_key: img_ids[i], **s.metadata})
        for i, s in enumerate(img_splits)
    ]
    if summary_img:
        retriever.vectorstore.add_documents(summary_img)
        retriever.docstore.mset(list(zip(img_ids, [s.page_content for s in img_splits])))
        print(f"Added {len(summary_img)} image summaries to the retriever.")
    else:
        print("No image summaries to add to the retriever.")

    # Initialize the chain
    chain = (
        {"context": retriever | RunnableLambda(split_image_text_types), "question": RunnablePassthrough()}
        | RunnableLambda(prompt_func)
        | model
        | StrOutputParser()
    )
    print("RAG pipeline initialized successfully.")

# Function to encode image to base64
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def image_captioning(img_base64, prompt):
    try:
        msg = model.invoke(
            [
                HumanMessage(
                    content=[
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{img_base64}"
                            },
                        },
                    ]
                )
            ]
        )
        print(f"Caption generated: {msg.content}")  # Debug: Print generated caption
        return msg.content
    except Exception as e:
        print(f"Error in image_captioning: {e}")
        return ""

# Function to process PDF and extract text/images
# from langchain.text_splitter import RecursiveCharacterTextSplitter

def process_pdf(pdf_path):
    global text_data, img_base64_list, image_summaries
    text_data = []
    img_base64_list = []
    image_summaries = []

    with fitz.open(pdf_path) as pdf_file:
        if not os.path.exists("extracted_images"):
            os.makedirs("extracted_images")

        for page_number in range(len(pdf_file)):
            page = pdf_file[page_number]
            text = page.get_text().strip()
            text_data.append({"response": text, "name": page_number+1})
            images = page.get_images(full=True)
            for image_index, img in enumerate(images, start=1):
                xref = img[0]
                base_image = pdf_file.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                image = Image.open(io.BytesIO(image_bytes))
                image_path = f"extracted_images/image_{page_number + 1}_{image_index}.{image_ext}"
                image.save(image_path)
                print(f"Saved image: {image_path}")

    # Process images and generate captions
    for img_file in sorted(os.listdir("extracted_images")):
        if img_file.endswith('.png') or img_file.endswith('.jpg'):
            img_path = os.path.join("extracted_images", img_file)
            try:
                base64_image = encode_image(img_path)
                img_base64_list.append(base64_image)
                img_capt = image_captioning(base64_image, "Describe the image in detail.")
                time.sleep(5)  # Sleep to avoid rate limiting
                image_summaries.append(img_capt)
                print(f"Caption generated for image {img_file}: {img_capt}")
            except Exception as e:
                print(f"Error processing image {img_file}: {e}")
    print(f"Total text data extracted: {len(text_data)}")
    print(f"Total images extracted: {len(img_base64_list)}")
    print(f"Total image summaries generated: {len(image_summaries)}")

# Flask route to handle PDF upload and processing
@app.route('/upload', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        print("No file uploaded")  # Debug statement
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    if file.filename == '':
        print("No file selected")  # Debug statement
        return jsonify({"error": "No file selected"}), 400

    print(f"Received file: {file.filename}")  # Debug statement

    # Save the file temporarily
    upload_folder = "uploads"
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    file_path = os.path.join(upload_folder, file.filename)
    file.save(file_path)

    print(f"File saved to: {file_path}")  # Debug statement

    # Process the PDF and set up RAG
    process_pdf(file_path)
    setup_rag()

    return jsonify({"message": "PDF uploaded and processed successfully"}), 200

@app.route('/upload_image', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        print("No file uploaded")  # Debug statement
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    if file.filename == '':
        print("No file selected")  # Debug statement
        return jsonify({"error": "No file selected"}), 400

    print(f"Received image: {file.filename}")  # Debug statement

    # Save the image temporarily
    upload_folder = "uploads"
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
    file_path = os.path.join(upload_folder, file.filename)
    file.save(file_path)

    print(f"Image saved to: {file_path}")  # Debug statement

    # Encode the image to base64
    try:
        with open(file_path, "rb") as image_file:
            img_base64 = base64.b64encode(image_file.read()).decode('utf-8')

        # Generate a caption for the image using the vision model
        img_caption = image_captioning(img_base64, "Describe the image in detail.")
        time.sleep(5)  # Sleep to avoid rate limiting

        return jsonify({
            "message": "Image uploaded and processed successfully",
            "image_base64": img_base64,
            "caption": img_caption,
        }), 200
    except Exception as e:
        print(f"Error processing image: {e}")
        return jsonify({"error": "Failed to process image"}), 500

# Flask route to ask questions about the uploaded image
@app.route('/ask_image', methods=['POST'])
def ask_image():
    data = request.json
    question = data.get("question")
    image_base64 = data.get("image_base64")  # Add support for image-based questions

    print("Received question:", question)

    if not question:
        return jsonify({"error": "No question provided"}), 400

    try:
        if image_base64:
            # Handle image-based questions using the vision model
            response = asyncio.run(process_image_question(question, image_base64))
            return jsonify({"answer": response}), 200
        else:
            # Handle text-based questions using the RAG pipeline
            if not chain:
                return jsonify({"error": "RAG pipeline not initialized"}), 500

            result = chain.invoke(question)
            return jsonify({"answer": result}), 200
    except Exception as e:
        print(f"Error in ask_question: {e}")
        return jsonify({"error": "Failed to process question"}), 500

@lru_cache(maxsize=100)
async def process_image_question(question, image_base64):
    response = model.invoke(
        [
            HumanMessage(
                content=[
                    {"type": "text", "text": question},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_base64}"
                        },
                    },
                ]
            )
        ]
    )
    return response.content


# Flask route to handle questions
@app.route('/ask', methods=['POST'])
def ask_question():
    global text_data
    data = request.json
    question = data.get("question")
    if not question:
        return jsonify({"error": "No question provided"}), 400

    if not chain:
        return jsonify({"error": "RAG pipeline not initialized"}), 500

    try:
        # Debug: Print the question
        print(f"Question received: {question}")

        # Check if the user is asking for a summary
        if "summarize" in question.lower() or "summary" in question.lower():
            # Generate a summary of the medical record
            if text_data and isinstance(text_data[0], dict):
                text_data = [item.get("response", "") for item in text_data]

            # Handle empty text_data
            if not text_data:
                return jsonify({"error": "No text data found in the document"}), 404
            summary_prompt = "Summarize the following medical record in a concise and clear manner:"
            summary_context = "\n".join(text_data)
            summary = model.invoke(
                [
                    HumanMessage(
                        content=[
                            {"type": "text", "text": f"{summary_prompt}\n{summary_context}"}
                        ]
                    )
                ]
            )
            return jsonify({"answer": summary.content}), 200
        else:
            # Handle regular questions
            # Debug: Retrieve context and print it
            retrieved_context = retriever.invoke(question)
            print(f"Retrieved context: {retrieved_context}")

            # Debug: Check if the context is empty
            if not retrieved_context:
                print("No context retrieved from the retriever.")
                return jsonify({"error": "No relevant context found"}), 404

            # Debug: Print the split context (texts and images)
            split_context = split_image_text_types(retrieved_context)
            print(f"Split context - Texts: {split_context['texts']}")
            print(f"Split context - Images: {split_context['images']}")

            # Debug: Print the prompt generated by prompt_func
            prompt = prompt_func({"context": split_context, "question": question})
            print(f"Generated prompt: {prompt}")

            # Invoke the chain
            result = chain.invoke(question)
            print(f"Chain result: {result}")

            return jsonify({"answer": result}), 200
    except Exception as e:
        print(f"Error in ask_question: {e}")
        return jsonify({"error": "Failed to process question"}), 500
if __name__ == '__main__':
    if not os.path.exists("uploads"):
        os.makedirs("uploads")
    app.run(host='0.0.0.0', port=5001, debug=True)