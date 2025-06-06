from pymongo import MongoClient
# MongoDB Connection
client = MongoClient("mongodb://localhost:27017/")
db = client["HALWA"]
doctors_collection = db["doctors"]
appointments_collection = db["appointment"]

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

print(get_available_doctors("Neurologist","Bhimavaram"))