import { Player, RawMessage } from "@minecraft/server";
import { ActionFormData, ActionFormResponse, FormCancelationReason, MessageFormData, MessageFormResponse, ModalFormData, ModalFormResponse } from "@minecraft/server-ui";

export type FormValue = string | boolean | number | undefined;

interface ActionFormReturnData {
    canceled: boolean;
    cancelationReason?: FormCancelationReason;
    selection?: number;
    indexId?: string;
}

interface ModelFormFormReturnData {
    canceled: boolean;
    cancelationReason?: FormCancelationReason;
    formValues?: FormValue[];
    indexMap?: Map<string, FormValue>;
}

interface Button {
    indexId: string;
    text: string | RawMessage;
    iconPath?: string;
}

interface TextField{
    indexId: string,
    label: string | RawMessage,
    placeholder: string | RawMessage,
    defaultValue?: string
}

interface Dropdown{
    indexId: string,
    label: string, 
    options: string[], 
    defaultValueIndex?: number
}

interface Slider {
    indexId: string,
    label: string | RawMessage, 
    min: number, 
    max: number, 
    step: number, 
    defaultValue?: number
}

interface Toggle {
    indexId: string,
    label: string | RawMessage, 
    defaultValue?: boolean
}

const occupiedPlayers: Set<string> = new Set();

class ActionForm {
    private readonly actionForm: ActionFormData = new ActionFormData();
    private buttonMap: Map<number, string> = new Map<number, string>();
    private buttons: Button[] = [];
    private titleText: string | RawMessage = 'undefined';
    private bodyText: string | RawMessage = 'undefined';

    constructor(title?: string | RawMessage, body?: string | RawMessage, buttons?: Button[]) {
        if (title) this.titleText = title;
        if (body) this.bodyText = body;
        if (buttons) this.buttons = buttons;
    }

    public isOccupied(player: Player) {
        return occupiedPlayers.has(player.id)
    }

    public setTitle(title: string | RawMessage): void {
        this.titleText = title;
    }

    public setBody(body: string | RawMessage): void {
        this.bodyText = body;
    }

    public addButton(indexId: string, text: string | RawMessage, iconPath?: string): void {
        this.buttons.push({ indexId, text, iconPath });
    }

    public async showForm(player: Player): Promise<ActionFormReturnData> {
        this.actionForm.title(this.titleText);
        this.actionForm.body(this.bodyText);
        this.generateButtons();

        occupiedPlayers.add(player.id);

        const response: ActionFormResponse = await this.actionForm.show(player).finally(() => {
            occupiedPlayers.delete(player.id);
        });

        const return_data: ActionFormReturnData = {
            canceled: response.canceled,
            cancelationReason: response?.cancelationReason,
            selection: response?.selection
        };

        if (response.selection !== null && response.selection !== undefined) {
            return_data.indexId = this.buttonMap.get(response.selection);
        }

        return return_data;
    }

    private generateButtons() {
        let buttonIndex: number = 0;
        this.buttons.forEach(button => {
            if (button.iconPath) {
                this.actionForm.button(button.text, button.iconPath);
            } else {
                this.actionForm.button(button.text);
            }
            this.buttonMap.set(buttonIndex, button.indexId);
            buttonIndex++;
        });
    }
}

class ModelForm {
    private readonly modelForm: ModalFormData = new ModalFormData();
    private widgitMap: Map<number, string> = new Map<number, string>();
    private indexMap: Map<string, FormValue> = new Map<string, FormValue>();
    private textFields: TextField[] = [];
    private dropdowns: Dropdown[] = [];
    private sliders: Slider[] = [];
    private toggles: Toggle[] = [];

    public isOccupied(player: Player) {
        return occupiedPlayers.has(player.id)
    }

    public setTitle(title: string | RawMessage): void {
        this.modelForm.title(title);
    }

    public addTextField(indexId: string, label: string | RawMessage, placeholder: string | RawMessage, defaultValue?: string): void {
        this.textFields.push({indexId, label, placeholder, defaultValue})
    }
    public addDropdown(indexId: string, label: string, options: string[], defaultValueIndex?: number): void {
        this.dropdowns.push({indexId, label, options, defaultValueIndex})
    }

    public addSlider(indexId: string, label: string | RawMessage, min: number, max: number, step: number, defaultValue?: number): void {
        this.sliders.push({indexId, label, min, max, step, defaultValue})
    }

    public addToggle(indexId: string, label: string | RawMessage, defaultValue?: boolean): void {
        this.toggles.push({indexId, label, defaultValue})
    }

    public async showForm(player: Player): Promise<ModelFormFormReturnData> {
        this.processWidgets();
        occupiedPlayers.add(player.id);
        const response:ModalFormResponse = await this.modelForm.show(player).finally(() => {
            occupiedPlayers.delete(player.id);
        });;
        const return_data: ModelFormFormReturnData = {
            canceled: response.canceled,
            cancelationReason: response.cancelationReason,
            formValues: response.formValues
        }
        if (response.formValues !== null && response.formValues !== undefined) {
            this.processValues(response.formValues);
            return_data.indexMap = this.indexMap;
        }
        
        return return_data;
    }

    private processWidgets(): void {
        let widgitIndex: number = 0;
        for (const textFeild of this.textFields) {
            this.modelForm.textField(textFeild.label, textFeild.placeholder, textFeild?.defaultValue);
            this.widgitMap.set(widgitIndex, textFeild.indexId);
            widgitIndex +=1;
        }
        for (const dropdown of this.dropdowns) {
            this.modelForm.dropdown(dropdown.label, dropdown.options, dropdown?.defaultValueIndex);
            this.widgitMap.set(widgitIndex, dropdown.indexId);
            widgitIndex +=1;
        }
        for (const slider of this.sliders) {
            this.modelForm.slider(slider.label, slider.min, slider.max, slider.step, slider?.defaultValue);
            this.widgitMap.set(widgitIndex, slider.indexId);
            widgitIndex +=1;
        }
        for (const toggle of this.toggles) {
            this.modelForm.toggle(toggle.label, toggle?.defaultValue);
            this.widgitMap.set(widgitIndex, toggle.indexId);
            widgitIndex +=1;
        }
    }

    private processValues(formValues: FormValue[]): void {
        let widgitIndex: number = 0;
        for (const i of formValues) {
            const value: FormValue = i?.valueOf();
            const indexId: string| undefined = this.widgitMap.get(widgitIndex);
            if (indexId) this.indexMap.set(indexId, value);
            widgitIndex +=1;
        } 
    }
}

class MessageForm {
    private readonly messageForm: MessageFormData = new MessageFormData();

    public isOccupied(player: Player) {
        return occupiedPlayers.has(player.id)
    }

    public setTitle(title: string | RawMessage): void {
        this.messageForm.title(title);
    }

    public setBody(body: string | RawMessage): void {
        this.messageForm.body(body);
    }

    public setButtonOne(button: string | RawMessage): void {
        this.messageForm.button1(button)
    }

    public setButtonTwo(button: string | RawMessage): void {
        this.messageForm.button2(button)
    }

    async show(player: Player): Promise<MessageFormResponse> {
        occupiedPlayers.add(player.id);
        const response:MessageFormResponse = await this.messageForm.show(player).finally(() => {
            occupiedPlayers.delete(player.id);
        });
        return response;
    }
}

export {
    ActionFormReturnData, ModelFormFormReturnData, Button, TextField, Dropdown, Slider, Toggle,
    ActionForm, ModelForm, MessageForm
}