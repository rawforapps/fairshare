#!/usr/bin/env python3
"""
FairShare Local PWA Server
Zero-dependency HTTP server to test FairShare PWA on desktop and mobile devices.
Run: python serve.py
"""

import http.server
import socketserver
import socket
import os
import sys

PORT = 8080

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and caching headers for PWA
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

if __name__ == '__main__':
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)

    ip = get_local_ip()

    print("=" * 65)
    print(" 🚀 FairShare Local PWA & Web Server Running!")
    print("=" * 65)
    print(f" • Local Desktop URL : http://localhost:{PORT}/")
    print(f" • Mobile Device URL  : http://{ip}:{PORT}/")
    print("-" * 65)
    print(" 📱 To test on iPhone or Android:")
    print(f"   1. Connect phone to the same Wi-Fi.")
    print(f"   2. Open Safari / Chrome: http://{ip}:{PORT}/")
    print(f"   3. Tap 'Add to Home Screen' to install as a native PWA app!")
    print("=" * 65)
    print(" Press Ctrl+C to stop the server.\n")

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), CustomHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
            sys.exit(0)
