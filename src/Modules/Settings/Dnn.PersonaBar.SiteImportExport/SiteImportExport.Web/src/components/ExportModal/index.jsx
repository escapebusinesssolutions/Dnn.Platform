import React, { PropTypes, Component } from "react";
import { connect } from "react-redux";
import {
    importExport as ImportExportActions,
    visiblePanel as VisiblePanelActions
} from "../../actions";
import Localization from "localization";
import InputGroup from "dnn-input-group";
import Label from "dnn-label";
import Dropdown from "dnn-dropdown-with-error";
import SingleLineInputWithError from "dnn-single-line-input-with-error";
import MultiLineInputWithError from "dnn-multi-line-input-with-error";
import GridCell from "dnn-grid-cell";
import GridSystem from "dnn-grid-system";
import Switch from "dnn-switch";
import RadioButtons from "dnn-radio-buttons";
import PagePicker from "dnn-page-picker";
import Button from "dnn-button";
import styles from "./style.less";
import utilities from "utils";

import {PagePickerInteractor} from './page-picker'

const scrollAreaStyle = {
    width: "100%",
    height: 200,
    marginTop: 0,
    border: "1px solid #c8c8c8"
};

const keysToValidate = ["ExportName"];

class ExportModal extends Component {
    constructor(props) {
        super();
        this.state = {
            wizardStep: 0,
            exportRequest: {
                PortalId: -1,
                ExportName: "",
                ExportDescription: "",
                IncludeUsers: true,
                IncludeVocabularies: true,
                IncludeTemplates: true,
                IncludeProperfileProperties: true,
                IncludeRoles: true,
                IncludePermissions: true,
                IncludeDeletions: false,
                IncludeContent: true,
                IncludeExtensions: true,
                IncludeFiles: true,
                ExportMode: props.lastExportTime ? "Differential" : "Complete",
                ItemsToExport: [],
                RunNow: true
            },
            errors: {
                ExportName: false
            },
            reloadPages: false,
            requestSubmitting: false
        };
    }

    componentWillMount() {
        const { props, state } = this;
        const { exportRequest } = state;
        exportRequest.PortalId = props.portalId;
        this.setState({
            exportRequest
        });
    }

    componentWillReceiveProps(props) {
        const { state } = this;
        const { exportRequest } = state;
        let { reloadPages } = state;
        if (exportRequest.PortalId !== props.portalId) {
            exportRequest.PortalId = props.portalId;
            reloadPages = true;
            this.setState({ exportRequest, reloadPages }, () => {
                this.setState({
                    reloadPages: false
                });
            });
        }
    }

    goToStep(wizardStep) {
        const { props } = this;
        props.dispatch(ImportExportActions.navigateWizard(wizardStep));
    }

    cancelExport() {
        const { props } = this;
        this.goToStep(0);
        props.onCancel();
    }

    onExport() {
        const { props, state } = this;
        if (this.Validate()) {
            this.setState({
                requestSubmitting: true
            });

            props.dispatch(ImportExportActions.exportSite(state.exportRequest, (data) => {
                this.setState({
                    requestSubmitting: false
                });
                utilities.utilities.notify(Localization.get("ExportRequestSubmitted"));
                props.dispatch(ImportExportActions.getAllJobs({
                    portal: props.portalId,
                    pageIndex: 0,
                    pageSize: 10
                }, () => {
                    props.dispatch(ImportExportActions.jobSelected(data.jobId));
                }));
                props.dispatch(VisiblePanelActions.selectPanel(0));
            }, () => {
                this.setState({
                    requestSubmitting: false
                });
                utilities.utilities.notifyError(Localization.get("ExportRequestSubmit.ErrorMessage"));
            }));
        }
    }

    Validate() {
        let success = true;
        success = this.ValidateTexts();
        if (success && !this.ValidateHasExportItem()) {
            utilities.utilities.notifyError(Localization.get("NoExportItem.ErrorMessage"));
            success = false;
        }
        return success;
    }

    ValidateTexts(key) {
        let success = true;
        const { exportRequest } = this.state;
        const { errors } = this.state;
        keysToValidate.map(vkey => {
            if (key === undefined || key === vkey) {
                if (exportRequest[vkey] === "") {
                    success = false;
                    errors[vkey] = true;
                } else {
                    errors[vkey] = false;
                }
            }
            this.setState({});
        });
        return success;
    }

    ValidateHasExportItem() {
        let success = true;
        const { exportRequest } = this.state;
        if (exportRequest.IncludeContent || exportRequest.IncludeFiles || exportRequest.IncludeUsers || exportRequest.IncludeRoles ||
            exportRequest.IncludeVocabularies || exportRequest.IncludeTemplates || exportRequest.IncludeProperfileProperties ||
            exportRequest.IncludePermissions || exportRequest.IncludeExtensions || (exportRequest.pages && exportRequest.pages.length > 0)) {
            success = true;
        }
        else {
            success = false;
        }
        return success;
    }

    getPortalOptions() {
        const { props } = this;
        let options = [{ label: props.portalName, value: props.portalId }];
        return options;
    }

    onChange(key, event) {
        const value = typeof event === "object" ? event.target.value : event;
        let { exportRequest } = this.state;
        exportRequest[key] = value;
        this.setState({
            exportRequest
        });
        if (keysToValidate.some(vkey => vkey === key))
            this.ValidateTexts(key);
    }

    updatePagesToExport(selectedPages) {
        let { exportRequest } = this.state;
        exportRequest.pages = selectedPages;
        this.setState({ exportRequest });
    }

    getExportModeOptions() {
        let options = [
            { label: Localization.get("ExportModeDifferential"), value: "Differential" },
            { label: Localization.get("ExportModeComplete"), value: "Complete" }
        ];
        return options;
    }

    render() {
        const { state, props } = this;
        const PortalTabsParameters = {
            portalId: props.portalId,
            cultureCode: "",
            isMultiLanguage: false,
            excludeAdminTabs: true,
            disabledNotSelectable: false,
            roles: "",
            sortOrder: 0
        };
        return (
            <div className={styles.exportModal}>
                <div className="pageTitle">{Localization.get("ExportSettings")}</div>
                <GridCell className="export-site-container">
                    <div className="left-column">
                        <GridCell>
                            <Label
                                labelType="block"
                                label={Localization.get("Site")} />
                            <Dropdown
                                enabled={false}
                                options={this.getPortalOptions()}
                                value={props.portalId}
                                onSelect={this.onChange.bind(this, "PortalId")}
                            />
                        </GridCell>
                        <GridCell>
                            <SingleLineInputWithError
                                label={Localization.get("Name") + "*"}
                                inputStyle={{ margin: "0" }}
                                withLabel={false}
                                maxLength={100}
                                error={state.errors.ExportName}
                                errorMessage={Localization.get("ExportName.ErrorMessage")}
                                value={state.exportRequest.ExportName}
                                onChange={this.onChange.bind(this, "ExportName")}
                                style={{ width: "100%" }}
                            />
                        </GridCell>
                    </div>
                    <div className="right-column">
                        <GridCell>
                            <MultiLineInputWithError
                                inputStyle={{ "minHeight": 110 }}
                                maxLength={250}
                                style={{ "width": "100%" }}
                                label={Localization.get("Description")}
                                value={state.exportRequest.ExportDescription}
                                onChange={this.onChange.bind(this, "ExportDescription")}
                            />
                        </GridCell>
                    </div>
                    <div className="seperator">
                        <hr />
                    </div>
                    <GridSystem>
                        <div className="export-switches">
                            <div className="sectionTitle">{Localization.get("IncludeInExport")}</div>
                            <InputGroup>
                                <Label
                                    labelType="inline"
                                    label={Localization.get("Content")}
                                />
                                <Switch
                                    value={state.exportRequest.IncludeContent}
                                    onChange={this.onChange.bind(this, "IncludeContent")}
                                />
                            </InputGroup>
                            <InputGroup>
                                <Label
                                    labelType="inline"
                                    label={Localization.get("Assets")}
                                />
                                <Switch
                                    value={state.exportRequest.IncludeFiles}
                                    onChange={this.onChange.bind(this, "IncludeFiles")}
                                />
                            </InputGroup>
                            <InputGroup>
                                <Label
                                    labelType="inline"
                                    label={Localization.get("Users")}
                                />
                                <Switch
                                    value={state.exportRequest.IncludeUsers}
                                    onChange={this.onChange.bind(this, "IncludeUsers")}
                                />
                            </InputGroup>
                            <InputGroup>
                                <Label
                                    labelType="inline"
                                    label={Localization.get("Roles")}
                                />
                                <Switch
                                    value={state.exportRequest.IncludeRoles}
                                    onChange={this.onChange.bind(this, "IncludeRoles")}
                                />
                            </InputGroup>
                            <InputGroup>
                                <Label
                                    labelType="inline"
                                    label={Localization.get("Vocabularies")}
                                />
                                <Switch
                                    value={state.exportRequest.IncludeVocabularies}
                                    onChange={this.onChange.bind(this, "IncludeVocabularies")}
                                />
                            </InputGroup>
                            <InputGroup>
                                <Label
                                    labelType="inline"
                                    label={Localization.get("PageTemplates")}
                                />
                                <Switch
                                    value={state.exportRequest.IncludeTemplates}
                                    onChange={this.onChange.bind(this, "IncludeTemplates")}
                                />
                            </InputGroup>
                            <InputGroup>
                                <Label
                                    labelType="inline"
                                    label={Localization.get("ProfileProperties")}
                                />
                                <Switch
                                    value={state.exportRequest.IncludeProperfileProperties}
                                    onChange={this.onChange.bind(this, "IncludeProperfileProperties")}
                                />
                            </InputGroup>
                            <InputGroup>
                                <Label
                                    labelType="inline"
                                    label={Localization.get("Permissions")}
                                />
                                <Switch
                                    value={state.exportRequest.IncludePermissions}
                                    onChange={this.onChange.bind(this, "IncludePermissions")}
                                />
                            </InputGroup>
                            <InputGroup>
                                <Label
                                    labelType="inline"
                                    label={Localization.get("Extensions")}
                                />
                                <Switch
                                    value={state.exportRequest.IncludeExtensions}
                                    onChange={this.onChange.bind(this, "IncludeExtensions")}
                                />
                            </InputGroup>
                            <InputGroup>
                                <div style={{ "paddingBottom": 20, "paddingTop": 10 }}><hr /></div>
                                <Label
                                    labelType="inline"
                                    label={Localization.get("DeletionsInExport")}
                                />
                                <Switch
                                    value={state.exportRequest.IncludeDeletions}
                                    onChange={this.onChange.bind(this, "IncludeDeletions")}
                                />
                            </InputGroup>
                            <InputGroup>
                                <Label
                                    labelType="inline"
                                    label={Localization.get("RunNow")}
                                />
                                <Switch
                                    value={state.exportRequest.RunNow}
                                    onChange={this.onChange.bind(this, "RunNow")}
                                />
                            </InputGroup>
                        </div>
                        <div className="export-pages">
                            <div className="sectionTitle">{Localization.get("PagesInExport")}</div>
                            <PagePickerInteractor PortalTabsParameters={PortalTabsParameters} />


                            <div className="seperator2">
                                <hr />
                            </div>
                            <InputGroup>
                                <Label
                                    labelType="inline"
                                    label={Localization.get("ExportMode")}
                                />
                                <RadioButtons
                                    disabled={!props.lastExportTime}
                                    onChange={this.onChange.bind(this, "ExportMode")}
                                    options={this.getExportModeOptions()}
                                    buttonGroup="exportMode"
                                    value={props.lastExportTime ? state.exportRequest.ExportMode : "Complete"} />
                            </InputGroup>
                            <InputGroup>
                                <Label
                                    labelType="inline"
                                    label={Localization.get("LastExport")}
                                />
                                <div className="lastExport">{props.lastExportTime || "-- --"}</div>
                            </InputGroup>
                        </div>
                    </GridSystem>
                    <GridCell className="action-buttons">
                        <Button type="secondary" onClick={this.cancelExport.bind(this)}>{Localization.get("Cancel")}</Button>
                        <Button type="primary"
                            disabled={state.requestSubmitting}
                            onClick={this.onExport.bind(this)}>
                            {Localization.get("BeginExport")}
                        </Button>
                    </GridCell>
                </GridCell>
            </div>
        );
    }
}

ExportModal.propTypes = {
    dispatch: PropTypes.func.isRequired,
    onCancel: PropTypes.func,
    wizardStep: PropTypes.number,
    exportLogs: PropTypes.array,
    viewingLog: PropTypes.bool,
    portalId: PropTypes.number.isRequired,
    portalName: PropTypes.string.isRequired,
    exportJobId: PropTypes.number,
    lastExportTime: PropTypes.string
};

function mapStateToProps(state) {
    return {
        wizardStep: state.importExport.exportWizardStep,
        exportLogs: state.importExport.exportLogs,
        viewingLog: state.importExport.viewingLog,
        exportJobId: state.importExport.exportJobId,
        lastExportTime: state.importExport.lastExportTime,
        portalId: state.importExport.portalId,
        portalName: state.importExport.portalName
    };
}

export default connect(mapStateToProps)(ExportModal);
