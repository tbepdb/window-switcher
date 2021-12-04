'use strict';
const Lang = imports.lang;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;

const AltTab = imports.ui.altTab;
const Main = imports.ui.main;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const im_windows = [
  {
    function: 'get_title',
    pattern: /^Hangout/
  },
  {
    function: 'get_title',
    pattern: /^.*WhatsApp$/
  },
  {
    function: 'get_title',
    pattern: /^Brick: /
  },
  {
    function: 'get_title',
    pattern: /^Telegram/
  },
  {
    function: 'get_title',
    pattern: /^Google.{0,}Hangouts/
  },
  {
    function: 'get_title',
    pattern: /^Google\sHangouts/
  },
  {
    function: 'get_title',
    pattern: /^YakYak/
  },
  {
    function: 'get_wm_class',
    pattern: /^Skype/
  },
  {
    function: 'get_title',
    pattern: /^Skype/
  },
  {
    function: 'get_wm_class',
    pattern: /^skypeforlinux/
  },
  {
    function: 'get_wm_class',
    pattern: /^Empathy/
  },
  {
    function: 'get_wm_class',
    pattern: /^Pidgin/
  },
  {
    function: 'get_wm_class',
    pattern: /^crx_oonccmmafcaodljbcgobdbknmbljiafh/
  },
  {
    function: 'get_wm_class',
    pattern: /^ViberPC/
  },
  {
    function: 'get_wm_class',
    pattern: /^discord/
  },{
    function: 'get_wm_class',
    pattern: /^Slack/
},{
    function: 'get_wm_class',
    pattern: /^Element/
  }];
const rules = {
  'all':  {
  },
  'im': {
    stick: true,
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
        return patern.test(string);
      }
      function w_accept(rule, window) {
        if (rule.pattern && rule.function && window) {
          if (window[rule.function] && typeof window[rule.function] === 'function') {
            try {
              let win_str = window[rule.function]();
              return p_accept(rule.pattern, win_str);
            } catch (e) {
              return false;
            }
          } else {
            return false;
          }
        } else {
          return false;
        }
      }
      let rule = this.rule;
      let include = false, exclude = false;
      if (rule) {
        if (rule.include) {
          for (let i = 0; i < rule.include.length; i++) {
            let inc = rule.include[i];
            if (w_accept(inc, window)) {
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
            if (w_accept(exc, window)) {
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
        let workspace = this._settings.get_boolean('current-workspace-only') ? global.workspace_manager.get_active_workspace() : null;
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
    _startWindowSwitcher: function (display, window, binding) {
      /*
      global.log('*****', binding, rule);
      let [win, action, rule, target] = binding.get_name().split('-');
      global.log('*****', binding, rule);
      let tabPopup = new RuleWindowSwitcherPopup(rules[rule]);
      */
      let tabPopup = null;
      //global.log('************** binding', binding.get_name());
      if (binding.get_name() === 'switch-applications' || binding.get_name() === 'switch-applications-backward') {
        //global.log('************** rule not_im');
        tabPopup = new RuleWindowSwitcherPopup(rules.not_im);
      } else if (binding.get_name() === 'switch-windows' || binding.get_name() === 'switch-windows-backward') {
        //global.log('************** rule im');
        tabPopup = new RuleWindowSwitcherPopup(rules.im, true);
      }
      if (!tabPopup.show(binding.is_reversed(), binding.get_name(), binding.get_mask())) {
          tabPopup.destroy();
      }
    },
    enable: function () {
      setKeybinding('switch-windows', Lang.bind(Main.wm, this._startWindowSwitcher));
      setKeybinding('switch-applications', Lang.bind(Main.wm, this._startWindowSwitcher));
      setKeybinding('switch-applications-backward', Lang.bind(Main.wm, this._startWindowSwitcher));
      setKeybinding('switch-windows-backward', Lang.bind(Main.wm, this._startWindowSwitcher));


    },
    disable: function () {
      setKeybinding('switch-windows', Lang.bind(Main.wm, Main.wm._startWindowSwitcher));
      setKeybinding('switch-windows-backward', Lang.bind(Main.wm, Main.wm._startWindowSwitcher));
      setKeybinding('switch-applications', Lang.bind(Main.wm, Main.wm._startAppSwitcher));
      setKeybinding('switch-group', Lang.bind(Main.wm, Main.wm._startAppSwitcher));
      setKeybinding('switch-applications-backward', Lang.bind(Main.wm, Main.wm._startAppSwitcher));
      setKeybinding('switch-group-backward', Lang.bind(Main.wm, Main.wm._startAppSwitcher));
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
