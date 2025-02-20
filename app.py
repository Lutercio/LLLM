from flask import Flask, render_template, request, jsonify, session
import requests

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Required for session management

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        text = request.form.get("text")
        
        # Retrieve existing context from session
        current_context = session.get('context', None)
        
        # Prepare API request payload
        data = {
            "model": "deepseek-r1:14b",
            "prompt": text,
            "stream": False,
        }
        
        # Add context if available
        if current_context:
            data["context"] = current_context
        
        try:
            # Send request to Ollama API
            response = requests.post(
                "http://localhost:11434/api/generate",
                json=data,
                timeout=90
            )
            response.raise_for_status()
            
            result = response.json()
            
            # Update session with new context
            session['context'] = result.get('context')
            
            # Get the actual response text
            answer = result.get('response', 'No response received')
            
        except requests.exceptions.RequestException as e:
            answer = f"API Error: {str(e)}"
            session.pop('context', None)  # Reset context on error
        
        return jsonify({"message": text, "response": answer})
    
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)