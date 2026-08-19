import subprocess
import time
import sys

# 1. Install Node dependencies
print("Installing NPM dependencies...")
subprocess.run(["npm", "install"], check=True)

# 2. Build the project (Generates Prisma Client & Compiles TypeScript)
print("Building the project (npx prisma generate && tsc)...")
subprocess.run(["npm", "run", "build"], check=True)

# 3. Start ONLY the Node.js API server
print("Starting Node.js production server on port 7860...")
process = subprocess.Popen(["npm", "run", "start:prod"])

# 4. Keep the Space alive and monitor the process
try:
    while True:
        if process.poll() is not None:
            print("Node server stopped unexpectedly.")
            sys.exit(1)
        time.sleep(5)
except KeyboardInterrupt:
    process.terminate()
