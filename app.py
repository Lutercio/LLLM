from flask import Flask, render_template, request, jsonify, session, Response, stream_with_context
import requests
import json

app = Flask(__name__)
app.secret_key = 'your_secret_key_here'  # Necessário para gerenciamento de sessão

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        text = request.form.get("text")
        
        # Recupera o contexto atual da sessão, se houver
        current_context = session.get('context', None)
        
        # Prepara o payload para a API com streaming habilitado
        data = {
            "model": "deepseek-r1:1.5b",
            "prompt": text,
            "stream": True,
        }
        
        # Inclui o contexto, se disponível
        if current_context:
            data["context"] = current_context
        
        try:
            # Faz a requisição para a API do Ollama com stream=True
            api_response = requests.post(
                "http://localhost:11434/api/generate",
                json=data,
                timeout=90,
                stream=True
            )
            api_response.raise_for_status()
            
            @stream_with_context
            def generate():
                final_context = None
                # Itera sobre as linhas da resposta (assumindo que cada linha seja um JSON)
                for line in api_response.iter_lines():
                    if line:
                        try:
                            # Decodifica e converte cada chunk de JSON
                            chunk = line.decode('utf-8')
                            data_chunk = json.loads(chunk)
                            delta = data_chunk.get('response', '')
                            
                            # Atualiza o contexto se presente no chunk
                            if data_chunk.get('context'):
                                final_context = data_chunk.get('context')
                            
                            # Envia o chunk como SSE (Server-Sent Event)
                            yield f"data: {delta}\n\n"
                        except Exception as e:
                            yield f"data: [Erro ao processar chunk: {str(e)}]\n\n"
                # Atualiza a sessão com o contexto final, se disponível
                if final_context:
                    session['context'] = final_context
            
            # Retorna uma resposta em streaming com o MIME type adequado para SSE
            return Response(generate(), mimetype='text/event-stream')
        
        except requests.exceptions.RequestException as e:
            # Em caso de erro, remove o contexto da sessão
            session.pop('context', None)
            return jsonify({"message": text, "response": f"API Error: {str(e)}"}), 500
    
    return render_template("index.html")

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True)
