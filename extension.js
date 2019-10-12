/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */
const Shell = imports.gi.Shell;
const Main = imports.ui.main;

const Me = imports.misc.extensionUtils.getCurrentExtension();

const { rules } = Me.imports.rules;
const { RuleWindowSwitcherPopup } = Me.imports.RuleWindowSwitcherPopup;

function setKeybinding(name, func) {
    Main.wm.setCustomKeybindingHandler(name, Shell.ActionMode.NORMAL, func);
}

class Extension {
    constructor() {
    }
    _startWindowSwitcher (display, window, binding) {
        let tabPopup = null;
        // global.log('************** binding', binding.get_name());
        if (binding.get_name() === 'switch-applications' || binding.get_name() === 'switch-applications-backward') {
          // global.log('************** rule not_im');
          tabPopup = new RuleWindowSwitcherPopup(rules.not_im);
        } else if (binding.get_name() === 'switch-windows' || binding.get_name() === 'switch-windows-backward') {
          // global.log('************** rule im');
          tabPopup = new RuleWindowSwitcherPopup(rules.im, true);
        }
        if (!tabPopup.show(binding.is_reversed(), binding.get_name(), binding.get_mask())) {
          tabPopup.destroy();
        }
    }

    enable() {
        global.log('************** enable()');
        setKeybinding('switch-windows', this._startWindowSwitcher.bind(Main.wm));
        setKeybinding('switch-applications', this._startWindowSwitcher.bind(Main.wm));
        setKeybinding('switch-applications-backward', this._startWindowSwitcher.bind(Main.wm));
        setKeybinding('switch-windows-backward', this._startWindowSwitcher.bind(Main.wm));
    }

    disable() {
        global.log('************** disable()');
        setKeybinding('switch-windows', Main.wm._startSwitcher.bind(Main.wm));
        setKeybinding('switch-windows-backward', Main.wm._startSwitcher.bind(Main.wm));
        setKeybinding('switch-applications', Main.wm._startSwitcher.bind(Main.wm));
        setKeybinding('switch-applications-backward', Main.wm._startSwitcher.bind(Main.wm));
      }
}

function init() {
    global.log('************** init()', JSON.stringify(rules));
    return new Extension();
}
