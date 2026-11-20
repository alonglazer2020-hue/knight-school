# Local server for Knight School. Tells the browser to revalidate files so updates show up immediately.
# Usage: python serve.py [port]   (then open http://localhost:8765)
import http.server, os, sys

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

os.chdir(os.path.dirname(os.path.abspath(__file__)))
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
print(f'Knight School running at http://localhost:{port}  (close this window to stop)')
http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
