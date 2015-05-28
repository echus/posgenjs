from flask import Flask
app = Flask(__name__)

@app.route("/posgenjs/api/hello")
def hello_world():
    return "Hello World!"
