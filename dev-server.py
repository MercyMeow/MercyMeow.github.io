#!/usr/bin/env python3
"""
Development server for Single Page Application (SPA)
This server handles client-side routing by serving index.html for all routes
that don't correspond to actual files.
"""

import http.server
import socketserver
import os
import mimetypes
from urllib.parse import urlparse

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler that serves index.html for SPA routes"""
    
    def do_GET(self):
        # Parse the URL
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Remove leading slash and decode
        if path.startswith('/'):
            path = path[1:]
        
        # If path is empty, serve index.html
        if not path:
            path = 'index.html'
        
        # Check if the requested file exists
        if os.path.isfile(path):
            # File exists, serve it normally
            return super().do_GET()
        
        # Check if it's a directory
        if os.path.isdir(path):
            # Try to serve index.html from the directory
            index_path = os.path.join(path, 'index.html')
            if os.path.isfile(index_path):
                self.path = '/' + index_path
                return super().do_GET()
        
        # Check if it looks like a SPA route (contains no file extension)
        if '.' not in os.path.basename(path):
            # Check if it's a /lol/ route
            if path.startswith('lol/') or path.startswith('lol'):
                # Serve the LoL app index.html
                self.path = '/lol/index.html'
                return super().do_GET()
            else:
                # Serve main index.html for other routes
                self.path = '/index.html'
                return super().do_GET()
        
        # File doesn't exist and doesn't look like a SPA route
        # Send 404
        self.send_error(404, "File not found")
    
    def end_headers(self):
        # Add CORS headers for development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        # Add cache control headers
        if self.path.endswith(('.css', '.js')):
            self.send_header('Cache-Control', 'no-cache')
        
        super().end_headers()
    
    def log_message(self, format, *args):
        # Custom log format
        print(f"[{self.log_date_time_string()}] {format % args}")

def run_server(port=8000):
    """Run the development server"""
    handler = SPAHandler
    
    try:
        with socketserver.TCPServer(("", port), handler) as httpd:
            print(f"🚀 Development server running at http://localhost:{port}/")
            print(f"📁 Serving files from: {os.getcwd()}")
            print("🔄 SPA routing enabled - all routes will serve index.html")
            print("Press Ctrl+C to stop the server")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {port} is already in use. Try a different port:")
            print(f"   python dev-server.py {port + 1}")
        else:
            print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    import sys
    
    # Get port from command line argument or use default
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("❌ Invalid port number. Using default port 8000.")
    
    run_server(port)
