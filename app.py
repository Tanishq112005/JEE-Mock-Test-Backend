import subprocess
import time
import sys

# 1. Install Node dependencies
print("Installing NPM dependencies...")
subprocess.run(["npm", "install"], check=True)

# 2. Start the Node.js backend
print("Starting Node.js server on port 7860...")
process = subprocess.Popen(["npm", "start"])

# 3. Keep the Space alive and monitor the process
try:
    while True:
        if process.poll() is not None:
            print("Node server stopped unexpectedly.")
            sys.exit(1)
        time.sleep(5)
except KeyboardInterrupt:
    process.terminate()
