const { GObject, Meta } = imports.gi;

const AltTab = imports.ui.altTab;

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

var RuleWindowSwitcherPopup = GObject.registerClass(
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

    })