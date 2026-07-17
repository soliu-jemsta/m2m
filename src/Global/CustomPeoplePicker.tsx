import * as React from "react";
import "select2/dist/css/select2.css";
require("peoplepicker");

interface ICustomPeoplePickerProps {
  placeholder?: string;
  multiple?: boolean;
  ["custom-people"]: string;
  ["validate-control"]?: string;
  ["pull-control-value"]?: string;
  ["omit-control-value"]?: string;
  ["get-control-value-type"]?: string;
  ["disable-selection-order"]?: string;
  ["validation-msg"]?: string;
}

export default class CustomPeoplePicker extends React.Component<ICustomPeoplePickerProps> {
  public render(): React.ReactElement {
    const { placeholder = "Enter a name", multiple = false } = this.props;
    const customProp = this.props["custom-people"];
    let customId = customProp.toLowerCase();
    //lets control value be pulled from sp list
    const pullControlValue = this.props["pull-control-value"] || "true";
    //omits control value when speed.bind() is used.
    const getControlValue = this.props["omit-control-value"] || "true";
    //specifies if the control is to be validated or not via speed.bind().
    const validate = this.props["validate-control"] || "true";
    //specifies if the value selected is not going to be order aphabetically.
    //this is used when the user wants to select a value in a specific order.
    //multiple must set to true.
    const selectionOrder = this.props["disable-selection-order"] || "false";
    //specifies if a sharepoint user is return or an email is returned via speed.bind().
    const getControlValuetype = this.props["get-control-value-type"] || "people";
    const validationmsg = this.props["validation-msg"] || "please select a person";
    return (
      <select
        id={customId}
        className="js-select2 w-full px-3 sm:px-4 py-2 sm:py-3 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm sm:text-base"
        custom-people={customProp}
        multiple={multiple}
        disable-selection-order={selectionOrder}
        control-value-type={getControlValuetype}
        speed-bind-validate={customProp}
        speed-validate-mode={validate}
        speed-include-control={pullControlValue}
        speed-as-static={getControlValue}
        speed-validate-msg={validationmsg}
        placeholder={placeholder}
      />
    );
  }

}
