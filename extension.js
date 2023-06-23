// -*- mode: js2; indent-tabs-mode: nil; js2-basic-offset: 4 -*-
// Start apps on custom workspaces
/* exported init enable disable */

const {Shell, Meta} = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const { GObject } = imports.gi;
const AltTab = imports.ui.altTab;

let _appData;
let windowSwitcher;

const WindowSwitcherPopup = GObject.registerClass(
    class WindowSwitcherPopup extends AltTab.WindowSwitcherPopup {
    all_desktops = true;
    is_invert = false;
    _init() {
        super._init();
    }

    _getRuleWindowList () {
        const windows =  []
        for (const app of _appData) {
            windows.push(...app.get_windows());
        }
        return windows;
    }

    _windowTry(ruleWindows, window) {
        return this.is_invert ? !ruleWindows.includes(window) : ruleWindows.includes(window);
    }

    _getWindowList() {
        //global.log('**************_getWindowList', this.is_invert);
        let workspace = global.workspace_manager.get_active_workspace();
        let windows = [];
        let active_window = null;
        let need_add_active = false;
        if (this.all_desktops) {
            workspace = null;
        }
        const ruleWindows = this._getRuleWindowList();
        // global.log('**************_getWindowList', ruleWindows, global.display.get_tab_list(Meta.TabList.NORMAL, workspace));
        for (let window of global.display.get_tab_list(Meta.TabList.NORMAL, workspace)) {
            if (window.has_focus()) {
                active_window = window;
                need_add_active = !(this._windowTry(ruleWindows, window));
            }
            if (this._windowTry(ruleWindows, window)) {
                windows.push(window);
            }
        }
        if (need_add_active && active_window) {
            windows.splice(0, 0, active_window);
        }
        //global.log('**************_getWindowList', res);
        return windows;
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

const OtherWindowSwitcherPopup = GObject.registerClass(
    class OtherWindowSwitcherPopup extends WindowSwitcherPopup {
    _init() {
        this.all_desktops = false;
        this.is_invert = true;
        super._init();
    }
});

function setKeybinding(name, func) {
    Main.wm.setCustomKeybindingHandler(name, Shell.ActionMode.NORMAL, func);
}
class WindowSwitcher {
    constructor() {
        this._settings = ExtensionUtils.getSettings();
        this._appSystem = Shell.AppSystem.get_default();
        this._appIds = [];

        this._appsChangedId =
            this._appSystem.connect('installed-changed',
                this._updateAppData.bind(this));

        this._settings.connect('changed', this._updateAppConfigs.bind(this));
        this._updateAppConfigs();
    }

    _updateAppConfigs() {
        this._appIds = [];

        this._settings.get_strv('application-list').forEach(appId => {
            this._appIds.push(appId);
        });

        this._updateAppData();
    }

    _updateAppData() {
        _appData = this._appIds.map(id => this._appSystem.lookup_app(id));
    }

    destroy() {
        if (this._appsChangedId) {
            this._appSystem.disconnect(this._appsChangedId);
            this._appsChangedId = 0;
        }

        if (this._settings) {
            this._settings.run_dispose();
            this._settings = null;
        }

        this._appIds = [];
        this._updateAppData();
    }

    _startSwitcher(display, window, binding) {
        let constructor = null;
        // global.log('**************_startSwitcher', binding.get_name());
        switch (binding.get_name()) {
        case 'switch-applications':
        case 'switch-applications-backward':
        case 'switch-group':
        case 'switch-group-backward':
            constructor = OtherWindowSwitcherPopup;
            break;
        case 'switch-windows':
        case 'switch-windows-backward':
            constructor = WindowSwitcherPopup;
            break;
        case 'cycle-windows':
        case 'cycle-windows-backward':
            constructor = AltTab.WindowCyclerPopup;
            break;
        case 'cycle-group':
        case 'cycle-group-backward':
            constructor = AltTab.GroupCyclerPopup;
            break;
        case 'switch-monitor':
            constructor = SwitchMonitor.SwitchMonitorPopup;
            break;
        }

        if (!constructor)
            return;

        /* prevent a corner case where both popups show up at once */
        if (this._workspaceSwitcherPopup != null)
            this._workspaceSwitcherPopup.destroy();

        let tabPopup = new constructor();

        if (!tabPopup.show(binding.is_reversed(), binding.get_name(), binding.get_mask()))
            tabPopup.destroy();
    }

    enable () {
        setKeybinding('switch-windows', this._startSwitcher.bind(Main.wm));
        setKeybinding('switch-applications', this._startSwitcher.bind(Main.wm));
        setKeybinding('switch-applications-backward', this._startSwitcher.bind(Main.wm));
        setKeybinding('switch-windows-backward', this._startSwitcher.bind(Main.wm));
      }

    disable () {
        setKeybinding('switch-windows', (Main.wm._startWindowSwitcher || Main.wm._startSwitcher).bind(Main.wm));
        setKeybinding('switch-windows-backward', (Main.wm._startWindowSwitcher || Main.wm._startSwitcher).bind(Main.wm));
        setKeybinding('switch-applications', (Main.wm._startWindowSwitcher || Main.wm._startSwitcher).bind(Main.wm));
        setKeybinding('switch-group', (Main.wm._startWindowSwitcher || Main.wm._startSwitcher).bind(Main.wm));
        setKeybinding('switch-applications-backward', (Main.wm._startWindowSwitcher || Main.wm._startSwitcher).bind(Main.wm));
        setKeybinding('switch-group-backward', (Main.wm._startWindowSwitcher || Main.wm._startSwitcher).bind(Main.wm));
    }

}

/** */
function init() {
}


/** */
function enable() {

    windowSwitcher = new WindowSwitcher();
    windowSwitcher.enable();
}

/** */
function disable() {
    windowSwitcher.disable();
    windowSwitcher.destroy();
}
