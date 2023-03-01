'use strict';
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Lang = imports.lang;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;

const AltTab = imports.ui.altTab;
const Main = imports.ui.main;

const { GObject } = imports.gi;
const { im_windows, rules } = Me.imports.rules;

function p_accept(patern, string) {
    return patern.test(string);
}

function w_accept(rule, window) {
    if (rule.pattern && rule.function && window) {
        // global.log('**************tr',  rule.pattern, rule.function);
        if (window[rule.function] && typeof window[rule.function] === 'function') {
            try {
                let win_str = window[rule.function]();
                // global.log('**************tr', win_str, rule.pattern, p_accept(rule.pattern, win_str));
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

const RuleWindowSwitcherPopup = GObject.registerClass(
    class RuleWindowSwitcherPopup extends AltTab.WindowSwitcherPopup {

    _init(rule, all_desktops) {
        this.all_desktops = all_desktops;
        this.rule = rule;
        super._init();
    }
    _try_rule(window) {
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
            //global.log('**************tr', JSON.stringify(rule), include && !exclude, include, exclude);
            return include && !exclude;
        } else {
            return true;
        }
    }
    _getWindowList() {
        //global.log('**************_getWindowList');
        let workspace = global.workspace_manager.get_active_workspace();
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
        //global.log('**************_getWindowList', res);
        return res;
    }
    _keyPressHandler(keysym, action) {
        switch (action) {
            case Meta.KeyBindingAction.SWITCH_APPLICATIONS:
            case Meta.KeyBindingAction.SWITCH_GROUP:
                action = Meta.KeyBindingAction.SWITCH_WINDOWS;
                break;
            case Meta.KeyBindingAction.SWITCH_APPLICATIONS_BACKWARD:
            case Meta.KeyBindingAction.SWITCH_GROUP_BACKWARD:
                action = Meta.KeyBindingAction.SWITCH_WINDOWS_BACKWARD;
                break;
        }
        return super._keyPressHandler.call(this, keysym, action);
    }
});

function setKeybinding(name, func) {
    Main.wm.setCustomKeybindingHandler(name, Shell.ActionMode.NORMAL, func);
}

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

class Extension {
    constructor() {
        this.extention = new RuleWindowSwitcherExt();
        this.enable();
    }

    enable() {
        this.extention.enable();
    }

    disable() {
        this.extention.disable();
    }
}

function init() {
    return new Extension();
}