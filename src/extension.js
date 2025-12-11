import St from 'gi://St';
import Clutter from 'gi://Clutter';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

// Local import
import { InputDialog } from './dialog.js';

export default class GnomeWorkspaceTitlesExtension extends Extension {
    _workspaceNames = [];

    enable() {
        // Create a panel button
        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);

        // Create a horizontal box to hold icon + label
        const box = new St.BoxLayout({ style_class: 'workspace-indicator-box', vertical: false });

        // Icon
        const icon = new St.Icon({
            icon_name: 'face-laugh-symbolic',
            style_class: 'system-status-icon'
        });
        box.add_child(icon);

        // Label for workspace number
        this._workspaceLabel = new St.Label({
            text: '1',
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'workspace-number-label'
        });
        box.add_child(this._workspaceLabel);

        // Add the box to the panel button
        this._indicator.add_child(box);

        // Add the indicator to the panel
        Main.panel.addToStatusArea(this.uuid, this._indicator);

        // Update the label initially
        this._updateWorkspaceNumber();

        // Connect signal to update on workspace change
        this._workspaceSignal = global.workspace_manager.connect(
            'active-workspace-changed',
            () => this._updateWorkspaceNumber()
        );

        // Make the indicator clickable
        this._indicator.connect('button-press-event', () => this._openRenamePopup());

        log("[GnomeWorkspaceTitlesExtension] Enabled");
    }

    disable() {
        if (this._workspaceSignal) {
            global.workspace_manager.disconnect(this._workspaceSignal);
            this._workspaceSignal = null;
        }

        this._indicator?.destroy();
        this._indicator = null;
        this._workspaceLabel = null;

        console.trace();
    }

    _updateWorkspaceNumber() {
        const activeIndex = global.workspace_manager.get_active_workspace_index();
        const name = this._workspaceNames[activeIndex] || `Workspace ${activeIndex + 1}`;
        this._workspaceLabel.set_text(name);
    }

    async _openRenamePopup() {
        const activeIndex = global.workspace_manager.get_active_workspace_index();
        const currentName = this._workspaceNames[activeIndex] || `Workspace ${activeIndex + 1}`;

        const dialog = new InputDialog('Rename workspace:', currentName);
        const result = await dialog.open();

        if (result !== null) {
            const newName = result.trim();
            if (newName) {
                this._workspaceNames[activeIndex] = newName;
            } else {
                delete this._workspaceNames[activeIndex];
            }
            this._updateWorkspaceNumber();
        }
    }

}