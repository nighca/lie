"""Bounded local design preview. Serves only this fixture and its three tracked references."""
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlsplit,unquote
repo=Path(__file__).resolve().parents[2]
files={'index.html','scene.html','scene.css','scene.js'}
allowed={'/docs/result-outcome-design/'+name for name in files}|{'/design/character-presets/assets/coral-bob/default.png','/design/character-presets/assets/sunny-moustache/default.png','/apps/web/public/games/empty-medal-box.json'}
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(repo),**kwargs)
 def send_head(self):
  path=unquote(urlsplit(self.path).path)
  if path=='/':
   self.send_response(302);self.send_header('Location','/docs/result-outcome-design/index.html');self.end_headers();return None
  if path not in allowed:self.send_error(404);return None
  return super().send_head()
ThreadingHTTPServer(('127.0.0.1',5355),Handler).serve_forever()
