import requests
from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

flight_plans = {}

def fetch_flight_plan(user):
    """Request flight plan from the other server."""
    url = f"https://bedsworldbot.onrender.com/flightplan/{user}"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json().get("flight_plan", {})
        if data:
            # Store and broadcast update
            flight_plans[user] = data
            socketio.emit("new_flight", data)
            return data
    return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route("/fetch/<user>", methods=["GET"])
def fetch_and_broadcast(user):
    """Fetch a flight plan for a given user and broadcast it."""
    user = user.strip().lower()
    flight = fetch_flight_plan(user)
    
    if not flight:
        return jsonify({"error": "No flight plan found"}), 404
    
    return jsonify({"message": "Flight plan added", "flight_plan": flight}), 200

@socketio.on('move_flight')
def handle_move_flight(data):
    """Handles dragging flight strips."""
    emit("update_flight", data, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=3200)