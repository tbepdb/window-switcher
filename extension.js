'use strict';
const Lang = imports.lang;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;

const AltTab = imports.ui.altTab;
const Main = imports.ui.main;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;

const im_windows = ['^Skype', '^Empathy', '^Pidgin', '^ViberPC'];
const rules = {
  'all':  {
  },
  'im': {
    name: 'im',
    include: im_windows
  },
  'not_im': {
    name: 'not_im',
    exclude: im_windows
  }
};

function setKeybinding(name, func) {
    Main.wm.setCustomKeybindingHandler(name, Shell.ActionMode.NORMAL, func);
}

const RuleWindowSwitcherPopup = new Lang.Class({
    Name: 'RuleWindowSwitcherPopup',
    Extends: AltTab.WindowSwitcherPopup,
    _init: function(rule, all_desktops) {
      this.all_desktops = all_desktops;
      this.rule = rule;
      this.parent();
    },
    _try_rule : function (window) {
      function p_accept(patern, string) {
        return new RegExp(patern).test(string);
      }
      let rule = this.rule;
      let include = false, exclude = false;
      let win_str = window.get_wm_class();
      if (rule) {
        if (rule.include) {
          for (let i = 0; i < rule.include.length; i++) {
            let inc = rule.include[i];
            let win_str = window.get_wm_class();
            if (p_accept(inc, win_str)) {
              include = true;
              i = rule.include.length;
            }
          }
        } else {
          include = true;
        }
        if (rule.exclude) {
          for (let i = 0; i < rule.exclude.length; i++) {
            let exc = rule.exclude[i];
            if (p_accept(exc, win_str)) {
              exclude = true;
              i = rule.exclude.length;
            }
          }
        } else {
          exclude = false;
        }
        //global.log('**************tr', win_str, JSON.stringify(rule), include && !exclude, include, exclude);
        return include && !exclude;
      } else {
        return true;
      }
    },
    _getWindowList: function() {
        let workspace = this._settings.get_boolean('current-workspace-only') ? global.screen.get_active_workspace() : null;
        let res = [];
        let active_window = null;
        let need_add_active = false;
        if (this.all_desktops) {
          workspace = null;
        }
        let windows = global.display.get_tab_list(Meta.TabList.NORMAL, workspace);
        for (let i in windows) {
          let window = windows[i];
          if (window.has_focus()) {
            active_window = window;
            need_add_active = !this._try_rule(window);
          }
          if (this._try_rule(window)) {
            res.push(window);
          }
        }
        if (need_add_active && active_window) {
          res.splice(0, 0, active_window);
        }
        return res;
    },
    _keyPressHandler: function(keysym, action) {
        switch(action) {
            case Meta.KeyBindingAction.SWITCH_APPLICATIONS:
            case Meta.KeyBindingAction.SWITCH_GROUP:
              action = Meta.KeyBindingAction.SWITCH_WINDOWS;
              break;
            case Meta.KeyBindingAction.SWITCH_APPLICATIONS_BACKWARD:
            case Meta.KeyBindingAction.SWITCH_GROUP_BACKWARD:
              action = Meta.KeyBindingAction.SWITCH_WINDOWS_BACKWARD;
              break;
        }
        return this.parent.call(this, keysym, action);
    }

});

const RuleWindowSwitcherExt = new Lang.Class({
    Name: 'RuleWindowSwitcherExt',
    _init: function () {
    },
    _startWindowSwitcher: function (display, screen, window, binding) {
      /*
      let [win, action, rule, target] = binding.get_name().split('-');
      //global.log('*****', binding, rule, binding.get_name(), binding.get_action());
      let tabPopup = new RuleWindowSwitcherPopup(rules[rule]);
      */
      let tabPopup = null;
      //global.log('************** binding', binding.get_name());
      if (binding.get_name() === 'switch-applications' || binding.get_name() === 'switch-applications-backward') {
        //global.log('************** rule not_im');
        tabPopup = new RuleWindowSwitcherPopup(rules.not_im);
      } else if (binding.get_name() === 'switch-group' || binding.get_name() === 'switch-group-backward') {
        //global.log('************** rule im');
        tabPopup = new RuleWindowSwitcherPopup(rules.im, true);
      }
      if (!tabPopup.show(binding.is_reversed(), binding.get_name(), binding.get_mask())) {
          tabPopup.destroy();
      }
    },
    enable: function () {
      //AltTab.APP_ICON_SIZE = 48;
      //setKeybinding('switch-window', Lang.bind(Main.wm, this._startWindowSwitcher));
      setKeybinding('switch-applications', Lang.bind(Main.wm, this._startWindowSwitcher));
      setKeybinding('switch-group', Lang.bind(Main.wm, this._startWindowSwitcher));
      setKeybinding('switch-applications-backward', Lang.bind(Main.wm, this._startWindowSwitcher));
      setKeybinding('switch-group-backward', Lang.bind(Main.wm, this._startWindowSwitcher));
      //setKeybinding('switch-window-backward', Lang.bind(Main.wm, this._startWindowSwitcher));


      /*
      this._settings = Convenience.getSettings();
      global.log('setting', this._settings);

      Main.wm.setCustomKeybindingHandler('window-switch-all-forward',
        Shell.ActionMode.NORMAL,
        Lang.bind(this, this._startWindowSwitcher)
      );
      Main.wm.addKeybinding(
        'window-switch-all-forward',
        this._settings,
        Meta.KeyBindingFlags.NONE,
        Shell.ActionMode.NORMAL,
        Lang.bind(this, Lang.bind(this, this._startWindowSwitcher))
      );
      Main.wm.setCustomKeybindingHandler('window-switch-all-backward',
        Shell.ActionMode.NORMAL,
        Lang.bind(this, this._startWindowSwitcher)
      );
      Main.wm.addKeybinding(
        'window-switch-all-backward',
        this._settings,
        Meta.KeyBindingFlags.NONE,
        Shell.ActionMode.NORMAL,
        Lang.bind(this, Lang.bind(this, this._startWindowSwitcher))
      );
      */
    },
    disable: function () {
      //AltTab.APP_ICON_SIZE = 96;
      //setKeybinding('switch-window', Lang.bind(Main.wm, Main.wm._startWindowSwitcher));
      //setKeybinding('switch-window-backward', Lang.bind(Main.wm, Main.wm._startWindowSwitcher));
      setKeybinding('switch-applications', Lang.bind(Main.wm, Main.wm._startAppSwitcher));
      setKeybinding('switch-group', Lang.bind(Main.wm, Main.wm._startAppSwitcher));
      setKeybinding('switch-applications-backward', Lang.bind(Main.wm, Main.wm._startAppSwitcher));
      setKeybinding('switch-group-backward', Lang.bind(Main.wm, Main.wm._startAppSwitcher));
      /*
      Main.wm.removeKeybinding('window-switch-all-forward');
      Main.wm.removeKeybinding('window-switch-all-backward');
      */
    }
});

let extention = null;

function init() {
    // nothing
}

function enable() {
  extention = new RuleWindowSwitcherExt();
  extention.enable();
}

function disable() {
  if(extention != null) {
    extention.disable();
    extention = null;
  }
}
