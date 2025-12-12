import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

export const InputDialog = GObject.registerClass(
    class InputDialog extends St.BoxLayout {
        _init(prompt, initialText = '') {
            super._init({
                vertical: true,
                style_class: 'input-dialog',
                x_expand: true,
                y_expand: true,
                opacity: 0
            });

            // Overlay
            this._overlay = new St.Widget({
                layout_manager: new Clutter.BinLayout(),
                x_expand: true,
                y_expand: true,
                reactive: true,
                can_focus: true,
                track_hover: true,
                style_class: 'input-dialog-overlay'
            });
            Main.layoutManager.uiGroup.add_child(this._overlay);

            // Dialog box
            this._dialogBox = new St.BoxLayout({
                vertical: true,
                style_class: 'input-dialog-box',
                x_expand: false,
                y_expand: false,
                x_align: Clutter.ActorAlign.CENTER,
                y_align: Clutter.ActorAlign.CENTER
            });

            if (prompt) {
                const label = new St.Label({ text: prompt, style_class: 'input-dialog-prompt' });
                this._dialogBox.add_child(label);
            }

            this._entry = new St.Entry({
                text: initialText,
                style_class: 'input-dialog-entry',
                hint_text: 'Enter text...',
                x_expand: true
            });
            this._entry.clutter_text.set_selection(0, -1);
            this._dialogBox.add_child(this._entry);

            // Buttons
            const buttonBox = new St.BoxLayout({ style_class: 'input-dialog-buttons' });
            buttonBox.spacing = 10;

            const cancelButton = new St.Button({ label: 'Cancel' });
            cancelButton.connect('clicked', () => this.close(false));

            const okButton = new St.Button({ label: 'OK' });
            okButton.connect('clicked', () => this.close(true));

            buttonBox.add_child(cancelButton);
            buttonBox.add_child(okButton);
            this._dialogBox.add_child(buttonBox);

            this._overlay.add_child(this._dialogBox);
            this._resolve = null;
        }

        open() {
            this._overlay.opacity = 0;
            this._overlay.ease({
                opacity: 255,
                duration: 200,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD
            });
            this.grabFocus();
            return new Promise(resolve => this._resolve = resolve);
        }

        close(confirm = false) {
            const text = confirm ? this._entry.text : null;
            this._overlay.ease({
                opacity: 0,
                duration: 150,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                onComplete: () => {
                    this._overlay.destroy();
                    if (this._resolve) this._resolve(text);
                }
            });
        }

        grabFocus() {
            this._entry.grab_key_focus();
        }

        vfunc_key_press_event(keyEvent) {
            if (keyEvent.keyval === Clutter.KEY_Return || keyEvent.keyval === Clutter.KEY_KP_Enter) {
                this.close(true);
                return Clutter.EVENT_STOP;
            } else if (keyEvent.keyval === Clutter.KEY_Escape) {
                this.close(false);
                return Clutter.EVENT_STOP;
            }
            return Clutter.EVENT_PROPAGATE;
        }
    });