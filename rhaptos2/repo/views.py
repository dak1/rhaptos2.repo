#!/usr/local/bin/python
#! -*- coding: utf-8 -*-


from flask import Flask, render_template, request, g, session, flash,   redirect, url_for, abort


import datetime
import md5, random
import os, sys
import flask
import statsd
import json
from functools import wraps


from rhaptos2 import log
from rhaptos2 import exceptions
from rhaptos2.conf import confd
from rhaptos2.repo import app  #circular reference ? see http://flask.pocoo.org/docs/patterns/packages/

from rhaptos2.repo import model




########################### views

@app.route('/')
def index():
    return render_template('index.html')


#@apply_cors
@app.route("/module/", methods=['POST'])
def modulePOST():
    app.logger.info('POST CALLED')
    model.callstatsd('rhaptos2.e2repo.module.POST')
    try:

        html5 = request.form['moduletxt']
        d = json.loads(html5)
        
        app.logger.info(repr(d))
                      
        myhash = model.store_module(html5, d)


    except Exception, e:

        app.logger.error(str(e))
        app.logger.info(repr(d))
        raise(e)

    s = model.asjson({'hashid':myhash})
    resp = flask.make_response(s)    
    resp.content_type='application/json'
    resp.headers["Access-Control-Allow-Origin"]= "*"

    return resp


@app.route("/workspace/", methods=['GET'])
def workspaceGET():
    ''' '''
    
    f = os.listdir(model.userspace())
    json_dirlist = json.dumps(f)
    resp = flask.make_response(json_dirlist)    
    resp.content_type='application/json'
    resp.headers["Access-Control-Allow-Origin"]= "*"

    model.callstatsd('rhaptos2.e2repo.workspace.GET')
    return resp


@app.route("/module/<modname>", methods=['GET'])
def moduleGET(modname):
    app.logger.info('getcall %s' % modname)
    model.callstatsd('rhaptos2.e2repo.module.GET')
    try:
        jsonstr = model.fetch_module(modname)
    except Exception, e:
        raise e

    resp = flask.make_response(jsonstr)    
    resp.headers["Access-Control-Allow-Origin"]= "*"
    return resp

@app.route("/module/", methods=['DELETE'])
def moduleDELETE():
    return 'You DELETEed @ %s' %  model.gettime() 

@app.route("/module/", methods=['PUT'])
def modulePUT():
    return 'You PUTed @ %s' %  model.gettime() 



@app.route("/version/", methods=["GET"])
#@resp_as_json()
def versionGET():
    ''' '''
    s = model.asjson(confd['rhaptos2_current_version'])
    resp = flask.make_response(s)    
    resp.content_type='application/json'
    resp.headers["Access-Control-Allow-Origin"]= "*"

    return resp


### Below are for test /dev only.
@app.route("/crash/", methods=["GET"])
def crash():
    ''' '''
    if app.debug == True:
        app.logger.info('crash command called.')
        raise exceptions.Rhaptos2Error('Crashing on demand')


@app.route("/burn/", methods=["GET"])
def burn():
    ''' '''
    if app.debug == True:
        app.logger.info('burn command called - dying hard with os._exit')
        #sys.exit(1)
        #Flask traps sys.exit (threads?)
        os._exit(1) #trap _this_


################ openid views


@app.before_request
def before_request():
    g.user = None
    if 'openid' in session:
        g.user = model.User.query.filter_by(openid=session['openid']).first()


@app.after_request
def after_request(response):
    model.db_session.remove()
    return response



@app.route('/login', methods=['GET', 'POST'])
@model.oid.loginhandler
def login():
    """Does the login via OpenID.  Has to call into `model.oid.try_login`
    to start the OpenID machinery.
    """
    # if we are already logged in, go back to were we came from
    if g.user is not None:
        return redirect(model.oid.get_next_url())
    if request.method == 'POST':
        openid = request.form.get('openid')
        if openid:
            return model.oid.try_login(openid, ask_for=['email', 'fullname',
                                                  'nickname'])
    return render_template('login.html', next=model.oid.get_next_url(),
                           error=model.oid.fetch_error())


@model.oid.after_login
def create_or_login(resp):
    """This is called when login with OpenID succeeded and it's not
    necessary to figure out if this is the users's first login or not.
    This function has to redirect otherwise the user will be presented
    with a terrible URL which we certainly don't want.
    """
    session['openid'] = resp.identity_url
    user = model.User.query.filter_by(openid=resp.identity_url).first()
    if user is not None:
        flash(u'Successfully signed in')
        g.user = user
        return redirect(model.oid.get_next_url())
    return redirect(url_for('create_profile', next=model.oid.get_next_url(),
                            name=resp.fullname or resp.nickname,
                            email=resp.email))


@app.route('/create-profile', methods=['GET', 'POST'])
def create_profile():
    """If this is the user's first login, the create_or_login function
    will redirect here so that the user can set up his profile.
    """
    if g.user is not None or 'openid' not in session:
        return redirect(url_for('index'))
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        if not name:
            flash(u'Error: you have to provide a name')
        elif '@' not in email:
            flash(u'Error: you have to enter a valid email address')
        else:
            flash(u'Profile successfully created')
            model.db_session.add(model.User(name, email, session['openid']))
            model.db_session.commit()
            return redirect(model.oid.get_next_url())
    return render_template('create_profile.html', next_url=model.oid.get_next_url())


@app.route('/profile', methods=['GET', 'POST'])
def edit_profile():
    """Updates a profile"""
    if g.user is None:
        abort(401)
    form = dict(name=g.user.name, email=g.user.email)
    if request.method == 'POST':
        if 'delete' in request.form:
            model.db_session.delete(g.user)
            model.db_session.commit()
            session['openid'] = None
            flash(u'Profile deleted')
            return redirect(url_for('index'))
        form['name'] = request.form['name']
        form['email'] = request.form['email']
        if not form['name']:
            flash(u'Error: you have to provide a name')
        elif '@' not in form['email']:
            flash(u'Error: you have to enter a valid email address')
        else:
            flash(u'Profile successfully created')
            g.user.name = form['name']
            g.user.email = form['email']
            model.db_session.commit()
            return redirect(url_for('edit_profile'))
    return render_template('edit_profile.html', form=form)


@app.route('/logout')
def logout():
    session.pop('openid', None)
    flash(u'You have been signed out')
    return redirect(model.oid.get_next_url())