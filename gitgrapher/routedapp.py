import os
import mimetypes


class RoutedApp(object):
    
    def __init__(self, static_root):
        self.static_root = static_root
        self.routes = {}
    
    def __call__(self, environ, start_response):
        # try routes
        path = environ['PATH_INFO']
        if path in self.routes:
            routed_method = self.routes[path]
            return routed_method(environ, start_response)
        # try files
        file_path = os.path.join(self.static_root, path.strip('/'))
        if os.path.isfile(file_path):
            try:
                fp = open(file_path, 'r')
                mime_info = mimetypes.guess_type(file_path)
                headers = [('Content-Type', mime_info[0])]
                if mime_info[1]:
                    headers.append(('Content-Encoding', mime_info[1]))
                start_response('200 OK', headers)
                return self.iter_file(fp, mime_info[1])
            except:
                raise
                start_response('401 Unauthorized', [
                    ('Content-Type', 'text/plain')
                ])
                return ['Unauthorized']
        # not found
        start_response('404 Not Found', [
            ('Content-Type', 'text/plain')
        ])
        return ['Not Found']
    
    def iter_file(self, fp, encoding=None):
        for line in fp:
            if encoding is not None:
                yield line.encode(encoding)
            else:
                yield line
    
    def route(self, path, func=None):
        if func is not None:
            self.routes[path] = func
            return self
        def wrapper(wrapped):
            self.routes[path] = wrapped
            return wrapped
        return wrapper
