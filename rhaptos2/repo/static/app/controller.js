
// <!--
// Copyright (c) Rice University 2012-3
// This software is subject to
// the provisions of the GNU Affero General
// Public License Version 3 (AGPLv3).
// See LICENCE.txt for details.
// -->


(function() {

  define(['jquery', 'backbone', 'marionette', 'app/auth', 'app/models', 'app/views', 'hbs!app/layouts/content', 'hbs!app/layouts/workspace', 'exports', 'i18n!app/nls/strings'], function(jQuery, Backbone, Marionette, Auth, Models, Views, LAYOUT_CONTENT, LAYOUT_WORKSPACE, exports, __) {
    var $main, $originalContents, ContentLayout, ContentRouter, WorkspaceLayout, contentLayout, mainController, mainRegion, workspaceLayout;
    $main = jQuery('#main');
    $originalContents = $main.contents();
    $main.empty();
    mainRegion = new Marionette.Region({
      el: '#main'
    });
    WorkspaceLayout = Marionette.Layout.extend({
      template: LAYOUT_WORKSPACE,
      regions: {
        toolbar: '#layout-toolbar',
        body: '#layout-body',
        auth: '#layout-auth'
      }
    });
    workspaceLayout = new WorkspaceLayout();
    ContentLayout = Marionette.Layout.extend({
      template: LAYOUT_CONTENT,
      regions: {
        auth: '#layout-auth',
        toolbar: '#layout-toolbar',
        title: '#layout-title',
        title2: '#layout-title2',
        body: '#layout-body',
        back: '#layout-back',
        metadata: '#layout-metadata',
        roles: '#layout-roles'
      }
    });
    contentLayout = new ContentLayout();
    mainController = {
      start: function() {
        return Backbone.history.start();
      },
      getRegion: function() {
        return mainRegion;
      },
      workspace: function() {
        var view, workspace;
        workspace = new Models.Workspace();
        workspace.fetch();
        view = new Views.WorkspaceView({
          collection: workspace
        });
        mainRegion.show(workspaceLayout);
        workspaceLayout.body.show(view);
        view = new Views.AuthView({
          model: Auth
        });
        workspaceLayout.auth.show(view);
        Backbone.history.navigate('workspace');
        return workspace.on('change', function() {
          return view.render();
        });
      },
      createContent: function() {
        var content;
        content = new Models.Content();
        this._editContent(content);
        return Backbone.history.navigate('content');
      },
      editContent: function(id) {
        var content,
          _this = this;
        content = new Models.Content();
        content.set('id', id);
        return content.fetch({
          error: function() {
            return alert("Problem getting content " + id);
          },
          success: function() {
            _this._editContent(content);
            return Backbone.history.navigate("content/" + id);
          }
        });
      },
      _editContent: function(content) {
        var configAccordionDialog, view;
        mainRegion.show(contentLayout);
        configAccordionDialog = function(region, view) {
          var dialog,
            _this = this;
          dialog = new Views.DialogWrapper({
            view: view
          });
          region.show(dialog);
          dialog.on('saved', function() {
            return region.$el.parent().collapse('hide');
          });
          return dialog.on('cancelled', function() {
            return region.$el.parent().collapse('hide');
          });
        };
        configAccordionDialog(contentLayout.metadata, new Views.MetadataEditView({
          model: content
        }));
        configAccordionDialog(contentLayout.roles, new Views.RolesEditView({
          model: content
        }));
        view = new Views.ContentToolbarView({
          model: content
        });
        contentLayout.toolbar.show(view);
        view = new Views.TitleEditView({
          model: content
        });
        contentLayout.title.show(view);
        view = new Views.TitleEditView({
          model: content
        });
        contentLayout.title2.show(view);
        view = new Views.AuthView({
          model: Auth
        });
        contentLayout.auth.show(view);
        contentLayout.title.$el.popover({
          trigger: 'hover',
          placement: 'right',
          content: __('Click to change title')
        });
        contentLayout.back.ensureEl();
        contentLayout.back.$el.on('click', function() {
          return Backbone.history.history.back();
        });
        view = new Views.ContentEditView({
          model: content
        });
        return contentLayout.body.show(view);
      }
    };
    ContentRouter = Marionette.AppRouter.extend({
      controller: mainController,
      appRoutes: {
        '': 'workspace',
        'workspace': 'workspace',
        'content': 'createContent',
        'content/:id': 'editContent'
      }
    });
    new ContentRouter();
    return jQuery.extend(exports, mainController);
  });

}).call(this);

