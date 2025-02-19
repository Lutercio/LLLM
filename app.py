from flask import Flask, render_template, request, jsonify
import json
import subprocess
import time
import re

app = Flask(__name__)

# Inicia o processo do Ollama
process = subprocess.Popen(
    ["ollama", "run", "deepseek-r1:14b"],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True,
    encoding="utf-8",
    errors="ignore"
)

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        text = request.form.get("text")
        json_data = json.dumps({"message": text}, indent=4)
        
        # Envia o JSON para o processo
        process.stdin.write(json_data + "\n")
        process.stdin.flush()
        process.stdin.close()
        
        # Lê a saída do processo por até 60 segundos
        output_lines = []
        start_time = time.time()
        timeout = 60  # segundos
        while time.time() - start_time < timeout:
            line = process.stdout.readline()
            if line:
                output_lines.append(line)
            else:
                if process.poll() is not None:
                    break
                time.sleep(0.1)
        
        full_output = "".join(output_lines)
        print("Output completo:\n", full_output)  # Para debug
        
        # Tenta extrair o trecho desejado:
        # Procuramos pelo trecho entre aspas logo após a tag </think>
        match = re.search(r'</think>\s*"([^"]+)"', full_output, re.DOTALL)
        if match:
            answer = match.group(1).strip()
        else:
            # Se não encontrar, pega a última linha não vazia
            lines = [line.strip() for line in full_output.splitlines() if line.strip()]
            answer = lines[-1] if lines else "[Nenhuma resposta capturada]"
        
        return jsonify({"message": text, "response": answer})
    
    return render_template("index.html")

if __name__ == "__main__":
    app.run(debug=True)
