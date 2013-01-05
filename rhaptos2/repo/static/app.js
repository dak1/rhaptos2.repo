// Generated by CoffeeScript 1.3.3
(function() {

  define(['jquery', 'underscore', 'backbone', 'marionette', 'aloha', 'app/controller', 'css!app'], function(jQuery, _, Backbone, Marionette, Aloha, Controller) {
    var Backbone_sync_orig,
      _this = this;
    Controller.start();
    this.jQuery = this.$ = function() {
      console.warn('You should add "jquery" to your dependencies in define() instead of using the global jQuery!');
      return jQuery.apply(this, arguments);
    };
    jQuery.extend(this.jQuery, jQuery);
    Backbone_sync_orig = Backbone.sync;
    Backbone.sync = function(method, model, options) {
      var data, href, params;
      if ('update' === method) {
        data = _.extend({}, model.toJSON());
        data.json = JSON.stringify(model);
        href = options['url'] || model.url() || (function() {
          throw 'URL to sync to not defined';
        })();
        href = "" + href + "?" + (jQuery.param(model.toJSON()));
        params = {
          type: 'PUT',
          url: href,
          data: JSON.stringify(model),
          processData: false,
          dataType: 'json',
          contentType: 'application/json'
        };
        return jQuery.ajax(_.extend(params, options));
      } else {
        return Backbone_sync_orig(method, model, options);
      }
    };
    return jQuery(document).on('click', 'a:not([data-bypass])', function(evt) {
      var href;
      evt.preventDefault();
      href = $(this).attr('href');
      console.warn("User clicked on an internal link. Use the app/controller module instead of the URL " + href);
      if (href != null) {
        return Backbone.history.navigate(href, true);
      }
    });
  });

}).call(this);
