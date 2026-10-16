"""Create only the owned isolated download-test frontend; production and scheduler are untouched."""
import hashlib, json, subprocess, sys, zipfile
from pathlib import Path
ROOT = Path('/home/director-video-audio-staging-20261015')
TARGET = ROOT / 'frontend-download-safety-20261016'
NAME = 'director-video-download-safety-staging-frontend'
def run(args):
    result = subprocess.run(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=40)
    if result.returncode: raise RuntimeError('Isolated staging operation failed: '+args[0])
    return result.stdout
assert json.loads((ROOT/'infrastructure.json').read_text())['database'] == 'online_director_audio_20261015'
assert TARGET.resolve().parent == ROOT.resolve()
package = ROOT / 'frontend-download-safety.zip'
assert hashlib.sha256(package.read_bytes()).hexdigest() == sys.argv[1]
backend = json.loads(run(['docker','inspect','director-video-audio-staging-backend']))[0]
env = dict(item.split('=',1) for item in backend['Config']['Env'] if '=' in item)
assert env['MYSQL_DATABASE'] == 'online_director_audio_20261015'
assert env['RABBITMQ_VHOST'] == '/director-audio-20261015'
scheduler = json.loads(run(['docker','inspect','director-video-audio-staging-scheduler']))[0]
assert scheduler['State']['Status'] == 'exited', 'Download tests must not start scheduler'
assert not TARGET.exists(), 'Preserve the previous artifact; do not overwrite unknown staging state'
assert NAME not in run(['docker','ps','-a','--format','{{.Names}}']).decode().splitlines()
TARGET.mkdir()
with zipfile.ZipFile(package) as archive:
    for name in archive.namelist(): (TARGET / name).resolve().relative_to(TARGET.resolve())
    archive.extractall(TARGET)
assert (TARGET/'index.html').is_file()
image = json.loads(run(['docker','inspect','director-video-frontend-candidate-408d962']))[0]['Image']
run(['docker','start','director-video-audio-staging-redis','director-video-audio-staging-backend'])
run(['docker','run','-d','--name',NAME,'--restart','no','--memory','48m',
     '--network','director-video-audio-staging-net','-p','127.0.0.1:28281:8080',
     '-v',str(TARGET)+':/usr/share/nginx/html:ro',
     '-v',str(ROOT/'frontend-nginx.conf')+':/etc/nginx/conf.d/default.conf:ro',image])
run(['docker','exec',NAME,'nginx','-t'])
print(json.dumps({'frontend':NAME,'port':28281,'sha256':sys.argv[1],'scheduler':'stopped'}))
