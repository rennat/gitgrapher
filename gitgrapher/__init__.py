import os
import sys
import json
import time
import datetime
# nonstandard
import git
# self
from gitgrapher.routedapp import RoutedApp


def format_git_time(git_time):
    dt = datetime.datetime.fromtimestamp(git_time)
    return dt.isoformat() + 'Z'


def make_app(current_path, static_root):
    app = RoutedApp(static_root)
    repo = git.Repo(current_path)
    
    @app.route('/')
    def root(environ, start_response):
        start_response('301 Moved Permanently', [
            ('Content-Type', 'text/html'),
            ('Location', '/main.html')
        ])
        return [
            '<a href="/main.html">try /main.html instead</a>'
        ]
    
    @app.route('/data.json')
    def app_data(environ, start_response):
        start_response('200 OK', [
            ('Content-Type', 'application/json')
        ])
        return [
            json.dumps({
                'name': os.path.basename(repo.working_dir)
            })
        ]
    
    @app.route('/repo/graph_data.json')
    def graph(environ, start_response):
        refs = {}
        nodes = {}
        edges = []
        for ref in repo.refs:
            for commit in repo.iter_commits(rev=ref.commit.hexsha):
                if commit.hexsha in nodes:
                    continue
                nodes[commit.hexsha] = {
                    'tree': commit.tree.hexsha,
                    'author_name': commit.author.name,
                    'author_email': commit.author.email,
                    'authored_date': format_git_time(commit.authored_date)
                }
                for parent in commit.parents:
                    edges.append({
                        'source': commit.hexsha,
                        'target': parent.hexsha
                    })
        for tag in repo.tags:
            refs['tag/{}'.format(tag.name)] = tag.commit.hexsha
        for branch in repo.branches:
            refs['branch/{}'.format(branch.name)] = branch.commit.hexsha
        start_response('200 OK', [
            ('Content-Type', 'application/json')
        ])
        return [json.dumps({
            'refs': refs,
            'nodes': nodes,
            'edges': edges
        })]
        
    return app    
