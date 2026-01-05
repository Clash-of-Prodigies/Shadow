from flask import Flask, jsonify, request, send_from_directory, abort
from flask_cors import CORS
import json
import datetime

app = Flask(__name__)
CORS(app)

with open("data.json", "r") as f: data: dict = json.load(f)

@app.before_request
def before():
    print(f"Received {request.method} request for {request.url}")
    if request.method == "OPTIONS":
        return "", 204

@app.route("/data")
def get_data(): return jsonify({'info': data['user']})

@app.route("/news", methods=['GET'])
def newscaster():
    return jsonify(data['news'])

@app.route("/broadcast")
def broadcast(): return jsonify({
    'avatars': data['avatars'],
    'playlists': data['playlists'],
    'events': data['events']
    })

@app.route("/calendar")
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
        with open("data.json", "w") as f:
            f.write(json.dumps(data))

    return jsonify({})

@app.route('/media/<path:filename>')
def serve_file(filename):
    try:
        return send_from_directory('media', filename)
    except FileNotFoundError:
        abort(404)

@app.route('/shop/items', methods=['GET'])
def showcase():
    return jsonify(data['shop'])

@app.route('/shop/checkout', methods=['POST'])
def checkout():
    allItems = {} 
    for category in data['shop']:
        for collection in category['collections']:
            for product in collection['products']:
                allItems[product['id']] = product['price']

    cart = []
    cart = request.get_json()
    total = {"coin": 0, "ticket": 0}
    for cartItem in cart:
        if cartItem['id'] in allItems:
            total['coin'] += allItems[cartItem['id']].get('coin', 0) * cartItem['qty']
            total['ticket'] += allItems[cartItem['id']].get('ticket', 0) * cartItem['qty']

    if total['coin'] <= data['user']['coins'] and total['coin'] >= 0: data['user']['coins'] -= total['coin']
    else: return jsonify({"success": False, "message": "Insufficient Coin Balance"})

    if total['ticket'] <= data['user']['tickets'] and total['ticket'] >= 0: data['user']['tickets'] -= total['ticket']
    else: return jsonify({"success": False, "message": "Insufficient Ticket Balance"})

    return jsonify({
        "success": True,
        "message": f"""Total Expense => Coin: {total['coin']}, Ticket: {total['ticket']}\n
                    Remaining Balance => Coin: {data['user']['coins']}, Ticket {data['user']['tickets']}"""
    })

if __name__ == "__main__":
    app.run(port=5000, debug=True)
