#!/usr/bin/env python
#! -*- coding: utf-8 -*-

###
# Copyright (c) Rice University 2012-13
# This software is subject to
# the provisions of the GNU Affero General
# Public License version 3 (AGPLv3).
# See LICENCE.txt for details.
###


""" setup.py - rhaptos2.repo package setup

Author: Paul Brian
(C) 2012 Rice University

This software is subject to the provisions of the GNU Lesser General
Public License Version 2.1 (LGPL).  See LICENSE.txt for details.
"""

from setuptools import setup, find_packages
import os, glob



def get_version():
    """ return a version number, or error string.
    
    We are assuming a file version.txt always exists. By convention
    populate that file with output of git describe
    """

    try:
        v = open("version.txt").read().strip()
    except:
        v = "UNABLE_TO_FIND_RELEASE_VERSION_FILE"
    return v



setup(
    name='rhaptos2.repo',
    version=get_version(),
    packages=find_packages(),
    namespace_packages=['rhaptos2'],
    author='See AUTHORS.txt',
    author_email='info@cnx.org',
    url='https://github.com/Connexions/rhaptos2.repo',
    license='LICENSE.txt',
    description="New editor / repo / system for cnx.org " \
                "-rhaptos2.readthedocs.org",
    install_requires=[
        "fabric >= 1.0.0",
        "flask >= 0.9",
        "statsd",
        "requests",
        "pylint",
        "Flask-OpenID==1.0.1",
        "nose",
        "unittest-xml-reporting",
        ],
    include_package_data=True,
    package_data={'rhaptos2.repo': ['templates/*.*',
                                    'static/*.*',
                                    'tests/*.*'],
                  },
    entry_points = """\
[console_scripts]
rhaptos2_runrepo = rhaptos2.repo.run:main
""",
    )


