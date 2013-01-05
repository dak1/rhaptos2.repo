# # Application Root
# This is the start of the application. Steps:
#
# 1. Load dependencies (JS/CSS/JSON)
# 2. Register client-side routes
# 3. Load any HTML/JSON sent from the server that is sprinkled in the HTML file
#
# For example, if the user goes to a piece of content we already send
# the content inside a `div` tag.
# The same can be done with metadata/roles (as a JSON object sent in the HTML)
define [
  'jquery'
  'underscore'
  'backbone'
  'marionette'
  'aloha'
  'app/controller'
  'css!app'
], (jQuery, _, Backbone, Marionette, Aloha, Controller) ->

  # # Application Code
  # The Single Page Application starts here
  #
  # The controller begins listening to route changes
  # and loads the initial views based on the URL.
  Controller.start()


  # # Various HACKS
  # These cross over many modules and do not have a better home than here.

  # ## Global Variables like jQuery
  # **HACK:** to discourage people from using the global jQuery
  # and instead use the `requirejs` version.
  # This helps ensure plugins that extend jQuery (like bootstrap)
  # are properly listed as dependencies in requirejs' `define`
  @jQuery = @$ = ->
    console.warn 'You should add "jquery" to your dependencies in define() instead of using the global jQuery!'
    jQuery.apply @, arguments
  jQuery.extend(@jQuery, jQuery)


  # ## Custom POST/PUT syntax
  # **FIXME:** By default Backbone sends the JSON object as the body when a PUT is called.
  # Instead, send each key/value as a PUT parameter
  Backbone_sync_orig = Backbone.sync
  Backbone.sync = (method, model, options) =>
    if 'update' == method
      data = _.extend {}, model.toJSON()
      # **FIXME:** This URL (and the funky data.json param) is a HACK and should be fixed
      data.json = JSON.stringify(model)
      href = options['url'] or model.url() or throw 'URL to sync to not defined'
      href = "#{href}?#{jQuery.param(model.toJSON())}"

      params =
        type: 'PUT'
        url: href
        data: JSON.stringify(model)
        processData: false
        dataType: 'json'
        contentType: 'application/json'

      jQuery.ajax(_.extend(params, options))
    else
      Backbone_sync_orig method, model, options


  # # Hash tags in links
  # Code should use the `Controller` module to change the page
  # instead of relying on the URL
  #
  # For now, I trust that the programmer knows what they are doing and:
  # 1. warn them
  # 2. trigger the route change
  # 3. hope a router matches that URL
  jQuery(document).on 'click', 'a:not([data-bypass])', (evt) ->
    # Stop the default event to ensure the link will not cause a page
    # refresh.
    evt.preventDefault()

    # Get the anchor href.
    href = $(@).attr('href')

    # Warn the developer that they should probably call the controller method
    # instead of using an anchor link
    console.warn "User clicked on an internal link. Use the app/controller module instead of the URL #{href}"

    # `Backbone.history.navigate` is sufficient for all Routers and will
    # trigger the correct events. The Router's internal `navigate` method
    # calls this anyways.
    Backbone.history.navigate(href, true) if href?
