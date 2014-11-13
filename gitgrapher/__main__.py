import os
import sys
import signal
import threading
import argparse
import atexit
from wsgiref.simple_server import make_server
from gitgrapher import make_app



HERE = os.path.dirname(os.path.abspath(__file__))


@atexit.register
def goodbye():
    sys.stdout.write('goodbye!\n')
    sys.stdout.flush()


# args
parser = argparse.ArgumentParser()
parser.add_argument('--host', default='')
parser.add_argument('--port', type=int, default=8000)
args = parser.parse_args()

# server
def run_server():
    static_root = os.path.join(HERE, 'static')
    app = make_app(os.getcwd(), static_root)
    httpd = make_server(args.host, args.port, app)
    httpd.serve_forever()
server_thread = threading.Thread(target=run_server)
server_thread.daemon = True
server_thread.start()
sys.stdout.write('Server running at {}:{}\n'.format(args.host, args.port))
sys.stdout.flush()

# loopty-loop
try:
    while True:
        server_thread.join(timeout=1)
except (KeyboardInterrupt, SystemExit):
    pass
