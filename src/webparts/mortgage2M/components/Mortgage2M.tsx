import * as React from 'react';
import type { IMortgage2MProps } from './IMortgage2MProps';

import {Route, Routes, HashRouter} from "react-router-dom";
import {Layout} from "../../../Global/Layout";
import DashBoard from "./pages/DashBoard";
import Clients from './pages/Clients';
import NewClient from './pages/NewClient';
import Cases from './pages/Cases';
import NewCase from './pages/NewCase';
import CaseApproval from './pages/CaseApproval';
import Report from './pages/Reort';
import Settings from './pages/Settings';

import { HelmetProvider } from "react-helmet-async";



require('main');

declare global {
    interface Window {
        globalProp: any;
        loadDashBoardComponent: () => void;
        loadCasesComponent: () => void;
        loadNewCaseComponent: () => void;
        loadClientsComponent: () => void;
        loadNewClientComponent: () => void;
        loadCaseApprovalComponent: () => void;
        loadReportComponent: () => void;
        loadSettingsComponent: () => void;
    }
}
export default class Mortgage2M extends React.Component<IMortgage2MProps> {
  public render(): React.ReactElement<IMortgage2MProps> {
    const {} = this.props;

    return (
            <>
                <HelmetProvider>
                <HashRouter>
                    <Routes>
                        <Route path="/" element={<Layout />}>
                            <Route index element={<DashBoard />} />
                            <Route path='clients' element={<Clients />} />
                            <Route path='new-client' element={<NewClient />} />
                            <Route path='cases' element={<Cases />} />
                            <Route path='new-case' element={<NewCase />} />
                            <Route path='case-approval' element={<CaseApproval />} />
                            <Route path='report' element={<Report />} />
                            <Route path='settings' element={<Settings />} />
                            {/* <Route path="mysubmissions" element={<Dashboard />} />
                            <Route path="approverequest" element={<ApproveRequest />} />
                            <Route path="viewrequest" element={<ViewRequest />} />
                            <Route path="surveyhistory" element={<Report />} />
                            <Route path="analytics" element={<Analytics />} />
                            <Route path="reviewqueue" element={<ReviewQueue />} />
                            <Route path="customerform" element={<CustomerForm />} /> */}
                        </Route>
                    </Routes>
                </HashRouter>
                </HelmetProvider>
            </>
    );
  }
}
