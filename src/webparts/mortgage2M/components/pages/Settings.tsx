import * as React from "react";
// import { Link } from "react-router-dom";
// import { NewLoader } from "../../../../Global/NewLoader";
// import { Link } from "react-router-dom";
// import ClientButton from "../../../../Global/ClientButton";
// // import { NewLoader } from "../../../../Global/NewLoader";
// import IdeaFormSkeleton from "../../../../Global/IdeaFormSkeleton";

require("settings");

export default class Settings extends React.Component<{}, {}> {
  public render(): React.ReactElement {
    return (
      <>
        <div className="" id="view-cases">
          <h1>No settings at the moment!!!</h1>
        </div>
      </>
    );
  }

  public componentDidMount(): void {
    window.loadSettingsComponent();
  }
}
