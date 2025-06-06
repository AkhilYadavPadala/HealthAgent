from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager
from flask import Flask
from pymongo import MongoClient
from datetime import datetime, timedelta,timezone
import requests
from flask_socketio import emit
import base64
import os
import sounddevice as sd
from scipy.io.wavfile import write
from flask_cors import CORS
from groq import Groq
from flask_socketio import SocketIO
from typing import Union, List, Dict, Any
from pydantic import BaseModel, Field

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# MongoDB Connection
client = MongoClient("mongodb://localhost:27017/")
db = client["healthcare"]
doctors_collection = db["doctors"]
appointments_collection = db["appointments"]

def get_available_doctors(specialty: str, location: str) -> Union[List[Dict[str, Any]], str]:
    """Retrieve doctors based on specialization and location."""
    specialty = specialty.lower()
    location = location.lower()

    doctors = list(doctors_collection.find({"specialty": specialty, "location": location}, {"_id": 0}))
    
    if not doctors:
        return "No available doctors found for this specialty in your location."
    
    return doctors


def book_appointment(user_name: str, doctor_name: str, appointment_time: str) -> str:
    """Book an appointment with a doctor and update their availability."""
    doctor = doctors_collection.find_one({"name": doctor_name})
    
    if doctor and appointment_time in doctor.get("available_slots", []):
        ist = timezone(timedelta(hours=5, minutes=30))
        ist_time = datetime.now(ist)
        appointment_data = {
            "user_name": user_name,
            "doctor_name": doctor_name,
            "appointment_time": appointment_time,
            "status": "confirmed",
            "timestamp": ist_time
        }
        appointments_collection.insert_one(appointment_data)
        
        # Remove the booked slot from available slots
        doctors_collection.update_one(
            {"name": doctor_name},
            {"$pull": {"available_slots": appointment_time}}
        )
        
        return f"Appointment confirmed with {doctor_name} on {appointment_time}."
    else:
        return f"Dr. {doctor_name} has no available slot at {appointment_time}. Please choose another time."

    
print(get_available_doctors("neurologist","san francisco"))

def new_print_received_message(self, message, sender):
    if sender.name == "User_Proxy":
        return
    if isinstance(message, str):
        print(f"PATCHED {sender.name}: {message}")
        socketio.emit("message", {"sender": sender.name, "content": message, "agent": sender.name})
    elif isinstance(message, dict) and "content" in message:
        print(f"PATCHED {sender.name}: {message.get('content')}")
        socketio.emit("message", {"sender": sender.name, "content": message.get('content'), "agent": sender.name})
    elif isinstance(message, list):  # Handle list of doctors
        print(f"PATCHED {sender.name}: {message}")
        socketio.emit("doctors_list", {"sender": sender.name, "doctors": message, "agent": sender.name})

GroupChatManager._print_received_message = new_print_received_message

functions = [
    {
        "name": "get_available_doctors",
        "description": "Fetch a list of doctors based on the specified medical specialty and location. Returns doctor details including available appointment slots.",
        "parameters": {
            "type": "object",
            "properties": {
                "specialty": {
                    "type": "string",
                    "description": "The medical specialty required (e.g., Cardiologist, Dermatologist)."
                },
                "location": {
                    "type": "string",
                    "description": "The city or region where the user wants to find a doctor."
                }
            },
            "required": ["specialty", "location"]
        }
    },
    {
        "name": "book_appointment",
        "description": "Schedule an appointment for a user with a specific doctor at a given time. The function checks doctor availability and confirms the booking if the slot is open.",
        "parameters": {
            "type": "object",
            "properties": {
                "user_name": {
                    "type": "string",
                    "description": "The full name of the user booking the appointment."
                },
                "doctor_name": {
                    "type": "string",
                    "description": "The full name of the doctor with whom the appointment is being booked."
                },
                "appointment_time": {
                    "type": "string",
                    "description": "The preferred appointment time (must match an available slot from the doctor’s schedule)."
                }
            },
            "required": ["user_name", "doctor_name", "appointment_time"]
        }
    }
]


doctor_halwa = AssistantAgent(
    name="Doctor_Halwa",
    system_message="You are a Unified Agent responsible for handling both health-related queries and appointment bookings. "
    "1. If the user has a health-related query, provide accurate and concise answers.You're a health expert you can solve user health related queries also.Provide solution for the user health care before suggesting to book an appointment. User will log their symptoms and severity solve their health query using those symptoms.Include an extra section titled 'Remedies' where you suggest some remedies or lifestyle adjustments that the user can follow to help alleviate or cure their condition before asking if they want to book an appointment.Don't ask additional questions."
    "2. If the user wants to book an appointment ask for their location before calling book_appointment function. If the user doesn't enters his location ask the user to enter location."
    "3. Only use the get_available_doctors function to retrieve available doctors based on their specialty and location.Don't do manual searching for doctors. "
    "4. Suggest the appropriate specialist based on the user's health query before retrieving available doctors. we have only 'cardiologist','general physician','dermatologist','orthopedic','pediatrician','neurologist','gynecologist','ent specialist','psychiatrist','gastroenterologist','cardiology','neurology','infectious diseases specialist','endocrinologist' in our database so don't suggest other specialists."
    "5. Present the options to the user and use the book_appointment function to confirm the booking.Only use the book_appointment function to book."
    "6. If the user expresses gratitude (e.g., says 'thanks'), respond with a polite closing message like, 'You're welcome! Let us know if you need further assistance.' "
    "7. Stay within your role, be concise, and avoid unnecessary details."
    "8. Don't say in response that you're calling a function.It's unecessary to user.",
    llm_config={"config_list": [{"model": "llama3-70b-8192",
        "api_key": "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",
        "api_type": "groq"}],
        "functions": functions,
        "stream": True},
)

doctor_halwa.register_for_llm(name="get_available_doctors",description="Fetch a list of doctors based on the specified medical specialty and location. Returns doctor details including available appointment slots.")(get_available_doctors)
doctor_halwa.register_for_llm(name="book_appointment",description="Books an appointment for a user with a specified doctor at a given time. The function checks whether the doctor is available at the requested time and, if available, confirms the appointment while updating the doctor's available slots.")(book_appointment)

user_proxy = UserProxyAgent(
    name="User_Proxy",
    human_input_mode="ALWAYS",
    code_execution_config=False,
    )

doctor_halwa.register_for_execution(name="get_available_doctors")(get_available_doctors)
doctor_halwa.register_for_execution(name="book_appointment")(book_appointment)

groupchat = GroupChat(
    agents=[user_proxy, doctor_halwa],
    messages=[],
    max_round=120,
    speaker_selection_method='round_robin')

manager = GroupChatManager(groupchat=groupchat,     
        llm_config={"config_list": [{"model": "llama3-70b-8192",
        "api_key": "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",
        "api_type": "groq"}]},
        human_input_mode="NEVER",
        )


@socketio.on("audio")
def handle_audio(data):
    """Handles incoming audio data via WebSockets."""
    try:
        print("Received audio data")
        audio_data = data.get("audio")
        if not audio_data:
            print("No audio data received")
            return

        # Decode the base64 audio data
        audio_bytes = base64.b64decode(audio_data)

        # Save the audio to a temporary file
        temp_audio_path = "temp_audio.m4a"
        with open(temp_audio_path, "wb") as audio_file:
            audio_file.write(audio_bytes)

        print(f"Audio saved to {temp_audio_path}")

        # Transcribe the audio using Groq API
        client = Groq(
            base_url="https://api.groq.com",
            api_key="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"
        )
        with open(temp_audio_path, "rb") as file:
            transcription = client.audio.transcriptions.create(
                file=(temp_audio_path, file.read()),
                model="distil-whisper-large-v3-en",
                response_format="verbose_json",
            )

        # transcribed_text = transcription['text']
        print("Transcription response:",transcription)

        # Extract the transcribed text
        if hasattr(transcription, 'text'):
            transcribed_text = transcription.text
        elif hasattr(transcription, 'results') and len(transcription.results) > 0:
            transcribed_text = transcription.results[0].alternatives[0].transcript
        else:
            raise ValueError("Unable to extract transcribed text from response")

        print(f"Transcribed text: {transcribed_text}")

            # Send the transcribed text back to the frontend
        emit("message", {"sender": "User", "content": transcribed_text})

        user_proxy.initiate_chat(manager, message=transcribed_text, clear_history=False)

        # Clean up the temporary audio file
        os.remove(temp_audio_path)
        print("Temporary audio file removed")

    except Exception as e:
        print(f"Error processing audio: {e}")
        emit("error", {"message": "Failed to process audio"})

# Modify the WebSocket handler to support both text and audio inputs
@socketio.on("message")
def handle_message(data):
    """Handles incoming chat messages via WebSockets."""
    message_type = data.get("type", "text")  # Default to text if type is not specified
    if message_type == "text":
        user_message = data.get("message", "")
        print(f"Received text message: {user_message}")
        user_proxy.initiate_chat(manager, message=user_message, clear_history=False)
    elif message_type == "audio":
        print("Received audio message, transcribing...")
        handle_audio(data)
        print(f"Transcribed text: {user_message}")
        # user_proxy.initiate_chat(manager, message=user_message, clear_history=False)
    else:
        print(f"Unsupported message type: {message_type}")

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True, use_reloader=False)