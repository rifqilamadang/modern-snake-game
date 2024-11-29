import http.server
import socketserver
import os

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        print(f"Requested path: {self.path}")
        print(f"Current directory: {os.getcwd()}")
        return super().do_GET()

    def guess_type(self, path):
        """Overrides SimpleHTTPRequestHandler.guess_type to handle JavaScript modules"""
        if path.endswith('.js'):
            return 'application/javascript'
        return super().guess_type(path)

# Change to the directory containing the script
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)
print(f"Server root directory: {script_dir}")

PORT = 8000
print(f"Starting server at http://localhost:{PORT}")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    try:
        print("Server is running. Press Ctrl+C to stop.")
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
