// Generated by CoffeeScript 1.3.3

/*
  authoringtools_client_tools.{coffee,js} - The script used set up and control
    the extended tools interface. These are the tools that are found in the
    tools dropdown in the interface.

  Author: Michael Mulich
  Copyright (c) 2012 Rice University

  This software is subject to the provisions of the GNU Lesser General
  Public License Version 2.1 (LGPL).  See LICENSE.txt for details.
*/


(function() {
  var METADATA_SUBJECTS, MODAL_SPINNER_OPTIONS, MetadataModal, exports, _generate_metadata_url,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  exports = {};

  METADATA_SUBJECTS = ["Arts", "Mathematics and Statistics", "Business", "Science and Technology", "Humanities", "Social Sciences"];

  MODAL_SPINNER_OPTIONS = {
    lines: 13,
    length: 16,
    width: 6,
    radius: 27,
    corners: 1,
    rotate: 0,
    color: '#444',
    speed: 0.9,
    trail: 69,
    shadow: false,
    hwaccel: false,
    className: 'spinner',
    zIndex: 2e9,
    top: 'auto',
    left: '265px'
  };

  window._spinopts = MODAL_SPINNER_OPTIONS;

  _generate_metadata_url = function(id) {
    return MODULEURL + id + '/metadata';
  };

  MetadataModal = (function() {

    function MetadataModal() {
      this.submit_handler = __bind(this.submit_handler, this);
      this.$el = $('#metadata-modal');
      $('#metadata-modal button[type="submit"]').click(this.submit_handler);
      this.$el.on('show', $.proxy(this.render, this));
    }

    MetadataModal.prototype.submit_handler = function(event) {
      var data, module_id;
      data = {};
      $.map($('#metadata-modal form').serializeArray(), function(obj) {
        if (obj.name === 'subjects') {
          if (!(obj.name in data)) {
            data[obj.name] = [];
          }
          return data[obj.name].push(obj.value);
        } else {
          return data[obj.name] = obj.value;
        }
      });
      module_id = serialise_form().uuid;
      console.log('Posting metadata for module: ' + module_id);
      $.ajax({
        type: 'POST',
        url: _generate_metadata_url(module_id),
        data: JSON.stringify(data, null, 2),
        dataType: 'json',
        contentType: 'application/json',
        success: function() {
          return $('#metadata-modal').modal('hide');
        }
      });
      return false;
    };

    MetadataModal.prototype.language_handler = function() {
      var $variant_lang, code, selected_code, template, value, variants, _ref;
      selected_code = $(this).val();
      variants = [];
      _ref = Language.getCombined();
      for (code in _ref) {
        value = _ref[code];
        if (code.slice(0, 2) === selected_code) {
          $.extend(value, {
            code: code
          });
          variants.push(value);
        }
      }
      $variant_lang = $('#metadata-modal select[name="variant_language"]');
      if (variants.length > 0) {
        variants.splice(0, 0, {
          code: '',
          english: ''
        });
        template = '{{#variants}}<option value="{{code}}">{{english}}</option>{{/variants}}';
        return $variant_lang.removeAttr('disabled').html(Mustache.to_html(template, {
          'variants': variants
        }));
      } else {
        return $('#metadata-modal select[name="variant_language"]').html('').attr('disabled', 'disabled');
      }
    };

    MetadataModal.prototype.render = function() {
      var $target, module_id, opts, renderer, spinner, wrapped_renderer;
      module_id = serialise_form().uuid;
      renderer = function(data) {
        var language_code, languages, subject, subjects, value, variant_languages, _i, _len, _ref, _ref1;
        languages = [
          {
            code: '',
            "native": '',
            english: ''
          }
        ];
        _ref = Language.getLanguages();
        for (language_code in _ref) {
          value = _ref[language_code];
          $.extend(value, {
            code: language_code
          });
          if ((data.language != null) && data.language === language_code) {
            $.extend(value, {
              selected: 'selected'
            });
          }
          languages.push(value);
        }
        data.languages = languages;
        if (data.language != null) {
          variant_languages = [
            {
              code: '',
              "native": '',
              english: ''
            }
          ];
          _ref1 = Language.getCombined();
          for (language_code in _ref1) {
            value = _ref1[language_code];
            if (language_code.slice(0, 2) !== data.language) {
              continue;
            }
            $.extend(value, {
              code: language_code
            });
            if ((data.variant_language != null) && data.variant_language === language_code) {
              $.extend(value, {
                selected: 'selected'
              });
            }
            variant_languages.push(value);
          }
          data.variant_languages = variant_languages;
        }
        subjects = [];
        for (_i = 0, _len = METADATA_SUBJECTS.length; _i < _len; _i++) {
          subject = METADATA_SUBJECTS[_i];
          value = {
            name: subject
          };
          if ((data.subjects != null) && __indexOf.call(data.subjects, subject) >= 0) {
            value.selected = 'checked';
          }
          subjects.push(value);
        }
        data.subjects = subjects;
        $('#metadata-modal .modal-body').html(Mustache.to_html(Templates.metadata, data));
        return $('#metadata-modal select[name="language"]').change(this.language_handler);
      };
      $target = $('#metadata-modal .modal-body');
      opts = MODAL_SPINNER_OPTIONS;
      $.extend(opts, {
        top: $target.height() / 2,
        left: $target.width() / 2
      });
      spinner = new Spinner(MODAL_SPINNER_OPTIONS).spin($target[0]);
      wrapped_renderer = function(data) {
        spinner.stop();
        return renderer(data);
      };
      return $.when($.ajax({
        type: 'GET',
        url: _generate_metadata_url(module_id),
        contentType: 'application/json'
      })).then($.proxy(wrapped_renderer, this));
    };

    return MetadataModal;

  })();

  exports.construct = function() {
    var metadata_modal, modal_link_id, _i, _len, _ref;
    $('.dropdown-toggle').dropdown();
    _ref = ['#import-link', '#metadata-link', '#sharing-link', '#publish-link'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      modal_link_id = _ref[_i];
      $(modal_link_id).modal({
        show: false
      });
    }
    $('#import-modal .modal-body').html(Mustache.to_html(Templates.metadata, {}));
    metadata_modal = new MetadataModal();
    $('#sharing-modal .modal-body').html(Mustache.to_html(Templates.sharing, {}));
    return $('#publish-modal .modal-body').html(Mustache.to_html(Templates.publish, {}));
  };

  window.Tools = exports;

}).call(this);
