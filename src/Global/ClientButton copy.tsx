import * as React from 'react';

export interface IClientButtonProps {
    text: string;
    func : string;
    clax : string;
    prop : string;
    attr : string;
}

export default class ClientButton extends React.Component<IClientButtonProps, {}> {
  public render(): React.ReactElement {
    const pageTemplate : string = `<button type="button" class="${this.props.clax}" ${this.props.attr} onclick="${this.props.func}('${this.props.prop}');">${this.props.text}</button>`;
    return (
        <div style={{display : "inline"}} dangerouslySetInnerHTML={{ __html: pageTemplate }}></div>
    );
  }
}

