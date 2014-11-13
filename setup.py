#!/usr/bin/env python


from setuptools import setup


setup(
    name='gitgrapher',
    version='0.0.0',
    description='huh?',
    author='tannern',
    packages=['gitgrapher', 'gitgrapher.static'],
    package_data={
        'gitgrapher.static': [
            '*.html', '*.js', '*.css'
        ]
    },
    install_requires = [
        'gitpython'
    ]
)
