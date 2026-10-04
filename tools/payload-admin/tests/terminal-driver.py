"""Fixture-only PTY driver. Never emits the entered password or terminal transcript."""
import json
import os
import pty
import select
import subprocess
import sys
import tempfile
import time

root = os.path.realpath(os.environ.get('PAYLOAD_LOCAL_ROOT', ''))
assert os.path.dirname(root) == os.path.realpath(tempfile.gettempdir())
assert os.path.basename(root).startswith('des-art-payload-test-')
data = json.load(sys.stdin)
master, slave = pty.openpty()
child = subprocess.Popen(sys.argv[1:], stdin=slave, stdout=slave, stderr=slave, close_fds=True)
os.close(slave)
output = bytearray()
step = 0
deadline = time.monotonic() + 30
prompts = ['Email существующей', 'Новый пароль', 'Повторите пароль']
values = [data['email'], data['password'], data['password']]
try:
    while time.monotonic() < deadline:
        readable, _, _ = select.select([master], [], [], 0.1)
        if readable:
            try:
                chunk = os.read(master, 8192)
            except OSError:
                break
            if not chunk:
                break
            output.extend(chunk)
            if step < 3 and prompts[step].encode() in output:
                os.write(master, (values[step] + '\r').encode())
                step += 1
        elif child.poll() is not None:
            break
    if child.poll() is None:
        child.terminate()
    code = child.wait(timeout=5)
    print(json.dumps({'code': code, 'step': step, 'echoed': data['password'].encode() in output,
                      'completed': 'Пароль изменён'.encode() in output}))
finally:
    os.close(master)
