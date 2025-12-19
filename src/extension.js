import St from 'gi://St';
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

// Local import
import { InputDialog } from './dialog.js';

export default class GnomeWorkspaceTitlesExtension extends Extension {
    enable() {
        // Initialize GSettings
        this._settings = new Gio.Settings({
            schema_id: 'org.gnome.desktop.wm.preferences',
        });

        // Create a panel button
        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);

        // Create a horizontal box to hold icon + label
        const box = new St.BoxLayout({ style_class: 'workspace-indicator-box', vertical: false });

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

        console.debug("[GnomeWorkspaceTitlesExtension] Enabled");
    }

    disable() {
        // Clean up
        this._settings = null;

        // Remove the indicator from the panel
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }

        // Disconnect workspace signal if exists
        if (this._workspaceSignal) {
            global.workspace_manager.disconnect(this._workspaceSignal);
            this._workspaceSignal = null;
        }

        // Disconnect click signal if exists
        if (this._clickSignal) {
            this._indicator.disconnect(this._clickSignal);
            this._clickSignal = null;
        }
    }

    // Retrieve workspace names from GSettings
    _getWorkspaceNames() {
        return this._settings.get_strv('workspace-names');
    }

    // Set the name for a specific workspace
    _setWorkspaceName(index, newName) {
        const names = this._getWorkspaceNames();

        // Ensure array is large enough
        while (names.length <= index) {
            names.push('');
        }

        names[index] = newName;
        this._settings.set_strv('workspace-names', names);
    }

    // Update the workspace number label
    _updateWorkspaceNumber() {
        const activeIndex = global.workspace_manager.get_active_workspace_index();
        const names = this._getWorkspaceNames();

        const name = names[activeIndex] || `Workspace ${activeIndex + 1}`;
        this._workspaceLabel.set_text(name);
    }

    // Open a popup dialog to rename the current workspace
    async _openRenamePopup() {
        const activeIndex = global.workspace_manager.get_active_workspace_index();
        const names = this._getWorkspaceNames();

        const currentName = names[activeIndex] || `Workspace ${activeIndex + 1}`;

        const dialog = new InputDialog('Rename workspace:', currentName);
        const result = await dialog.open();

        if (result !== null) {
            const newName = result.trim();

            if (newName) {
                // Set the new name
                this._setWorkspaceName(activeIndex, newName);
            } else {
                // Clear the name
                names[activeIndex] = '';
                this._settings.set_strv('workspace-names', names);
            }

            this._updateWorkspaceNumber();
        }
    }
}