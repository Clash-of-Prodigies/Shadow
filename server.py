from flask import Flask, jsonify, request, send_from_directory, abort
from flask_cors import CORS
import json
import os
import datetime

app = Flask(__name__)
CORS(app)

file_path = os.path.join("Shadow", "data.json")
with open(file_path, "r") as f: data: dict = json.load(f)

@app.route("/data")
def get_data(): return jsonify({'info': data['user']})
    
@app.route("/broadcast")
def get_news(): return jsonify({
    'news': data['news'],
    'avatars': data['avatars'],
    'playlists': data['playlists'],
    'events': data['events'],
    'shop': data['shop']
    })

@app.route("/caleendar")
def get_schedule():
    month = request.args.get('month', default=str(datetime.datetime.now().month), type=str)
    return jsonify(data['calendar'][month])

@app.route("/update", methods=["POST"])
def update_details():
    global data, file_path
    user_data = request.get_json()
    print(user_data)
    allowed = ['name', 'bio', 'avatar', 'playlist', 'song']
    original_user: dict = data['user']
    updated_user = original_user.copy()
    for key in original_user:
        if key in allowed:
            new_value = user_data.get(key)
            if new_value is not None and updated_user[key] != new_value:
                print(key, new_value)
                updated_user[key] = new_value

    if updated_user != original_user:
        data['user'] = updated_user
        with open(file_path, "w") as f:
            f.write(json.dumps(data))

    return jsonify({})

@app.route('/media/<path:filename>')
def serve_file(filename):
    try:
        return send_from_directory('media', filename)
    except FileNotFoundError:
        abort(404)

if __name__ == "__main__":
    app.run(debug=True)
