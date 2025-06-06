from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager
from flask import Flask
from pymongo import MongoClient
from datetime import datetime, timedelta,timezone
import requests
from flask_cors import CORS
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

def get_available_doctors(specialist: str, location: str) -> dict:
    """Retrieve available slots for doctors based on specialist and location."""
    specialist = specialist.lower()
    location = location.lower()
    
    doctors = list(doctors_collection.find({"specialist": specialist, "location": location}, {"_id": 0}))
    
    if not doctors:
        return {"message": "No available doctors found for this specialist in your location."}
    
    available_doctors = {}
    for doctor in doctors:
        available_doctors[doctor['name']] = doctor.get('available_slots', {
            "slot1": [], "slot2": [], "slot3": [], "slot4": [],
            "slot5": [], "slot6": [], "slot7": [], "slot8": []
        })
    
    return available_doctors


def book_appointment(user_id: str, doctor_name: str, date: str, slot: int) -> dict:
    """Book an appointment ensuring slot availability constraints."""
    if slot < 1 or slot > 8:
        return {"message": "Invalid slot number."}
    
    doctor = doctors_collection.find_one({"name": doctor_name})
    if not doctor:
        return {"message": "Doctor not found."}
    
    appointment = appointments_collection.find_one({"doctor_name": doctor_name, "date": date})
    
    if not appointment:
        appointment = {
            "doctor_name": doctor_name,
            "date": date,
            "slots": {"slot1": [], "slot2": [], "slot3": [], "slot4": [],
                       "slot5": [], "slot6": [], "slot7": [], "slot8": []}
        }
    
    # Check if user already booked another slot with this doctor on the same day
    if any(user_id in users for users in appointment["slots"].values()):
        return {"message": "User already booked an appointment with this doctor on this day."}
    
    # Check if slot is full
    if len(appointment["slots"][f"slot{slot}"]) >= 4:
        return {"message": "Slot is full."}
    
    # Book the slot
    appointment["slots"][f"slot{slot}"].append(user_id)
    appointments_collection.update_one(
        {"doctor_name": doctor_name, "date": date},
        {"$set": {"slots": appointment["slots"]}},
        upsert=True
    )
    
    return {"message": "Appointment booked successfully."}


    
print(get_available_doctors("Cardiologist", "New York"))

def new_print_received_message(self, message, sender):

    if sender.name == "User_Proxy":
        return
    if isinstance(message, str):
        print(f"PATCHED {sender.name}: {message}")
        socketio.emit("message", {"sender": sender.name, "content": message,"agent": sender.name})  # Send incremental update
    else:
        print(f"PATCHED {sender.name}: {message.get('content')}")
        socketio.emit("message", {"sender": sender.name, "content": message.get('content'),"agent": sender.name})

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
    "1. If the user has a health-related query, provide accurate and concise answers.You're a health expert you can solve user health related queries also.Provide solution for the user health care before suggesting to book an appointment."
    "2. If the user wants to book an appointment, ask for their location and health query. "
    "3. Only use the `get_available_doctors` function to retrieve available doctors based on their specialty and location.Don't do manual searching for doctors. "
    "4. Present the options to the user and use the `book_appointment` function to confirm the booking.Only use the `book_appointment` function to book."
    "5. If the user expresses gratitude (e.g., says 'thanks'), respond with a polite closing message like, 'You're welcome! Let us know if you need further assistance.' "
    "6. Stay within your role, be concise, and avoid unnecessary details.",
    llm_config={"config_list": [{"model": "llama-3.2-90b-vision-preview",
        "api_key": "your-api-key",
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
        llm_config={"config_list": [{"model": "llama-3.2-90b-vision-preview",
        "api_key": "your-api-key",
        "api_type": "groq"}]},
        human_input_mode="NEVER",
        )


@socketio.on("message")
def handle_message(data):
    """Handles incoming chat messages via WebSockets."""
    user_message = data.get("message", "")
    print(f"Received message: {user_message}")
    user_proxy.initiate_chat(manager, message=user_message, clear_history=False)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True, use_reloader=False)
