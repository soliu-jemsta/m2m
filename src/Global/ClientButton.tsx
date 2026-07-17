import * as React from "react";

declare const MainApplication: any;

export interface IClientButtonProps {
    children: React.ReactNode;
    func: string;
    clax?: string;
    prop?: string;
    attr?: any;
}

export default class ClientButton extends React.Component<IClientButtonProps> {

    private resolveFunction = (path: string) => {
        const parts = path.split(".");
        let context: any = MainApplication;

        for (let i = 0; i < parts.length; i++) {
            context = context[parts[i]];
            if (!context) {
                console.error("Function not found:", path);
                return null;
            }
        }

        return context;
    };

    private handleClick = () => {
        const fn = this.resolveFunction(this.props.func);

        if (typeof fn === "function") {
            fn(this.props.prop);
        }
    };

    public render(): React.ReactElement {

        return (
            <button
                type="button"
                className={this.props.clax}
                onClick={this.handleClick}
                {...this.props.attr}
            >
                {this.props.children}
            </button>
        );
    }
}