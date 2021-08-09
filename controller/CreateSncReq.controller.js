/*global location */
sap.ui.define([
	"sncReq/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sncReq/model/formatter",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/IconTabFilter",
	"sap/m/Dialog"
], function (BaseController, JSONModel, formatter, MessageToast, Filter, FilterOperator, IconTabFilter, Dialog) {
	"use strict";

	return BaseController.extend("sncReq.controller.CreateSncReq", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				Approvers: [{
						Empname: "Muhummad Ali",
						Role: "Line Manager",
						Status: "Approved"
					}, {
						Empname: "Muhummad Ali",
						Role: "Dept Head",
						Status: "Approved"
					}, {
						Empname: "Ahmad Ahmad",
						Role: "FI Dept Head",
						Status: "Approved"
					}, {
						Empname: "Rashid",
						Role: "Payroll Admin",
						Status: "not initiated"
					}, {
						Empname: "Jabbar",
						Role: "General Service",
						Status: "not initiated"
					}

				],
				empDetails: {}
			});
			//alert("create controller");
			this.getRouter().getRoute("createSncReq").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "HeaderView");

			//Request date default as system date setDataValue(date)
			//	this.getView().byId("ReqDate").setDateValue(new Date());

			//this.getView().byId("ReqDate").setDataValue(date));

			this.getOwnerComponent().oWhenMetadataIsLoaded.then(this._onMetadataLoaded.bind(this));

			var sServiceUrl = "/sap/opu/odata/sap/ZGW_HR_SANC_REQ_SRV";
			var oView = this;
			var oModel1 = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			var oJsonModel1 = new sap.ui.model.json.JSONModel();

			oModel1.read("/ReportingEmpsSet?", null, null, true, function (oData, response) {
				oJsonModel1.setData(oData);
			});
			this.getView().setModel(oJsonModel1, "ReportingEmpsSet");

			var oModel2 = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			var oJsonModel2 = new sap.ui.model.json.JSONModel();

			oModel2.read("/VolCategorySet?", null, null, true, function (oData, response) {
				oJsonModel2.setData(oData);
			});
			this.getView().setModel(oJsonModel2, "VolCategorySet");

			var oModel3 = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			var oJsonModel3 = new sap.ui.model.json.JSONModel();

			oModel3.read("/VolCodeSet?", null, null, true, function (oData, response) {
				oJsonModel3.setData(oData);
			});
			this.getView().setModel(oJsonModel3, "VolCodeSet");
			// 			this.getView().setModel(mnthModel, "mnthModel");
			//this.getView().byId("sid").setModel(oJsonModel3, "VolCodeSet");

			var ldate = this.getView().byId("Date");
			ldate.addEventDelegate({
				onAfterRendering: function () {
					ldate.$().find("input").attr("readonly", true);
				}
			});

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function (oEvent) {

			var oView = this.getView();

			var type = oEvent.getParameter("arguments").type,
				oViewModel = this.getModel("HeaderView"),
				myselfText = this.getResourceBundle().getText("myself"),
				behalfText = this.getResourceBundle().getText("behalf");
			var clearnaceType = this.getOwnerComponent()._oDataHelper.getLoanType();
			var employee = "";
			//Store this info as it is required during submission of the request
			//Nawaz
			//	this.LoanRaisedFor = type; //Myself or Bhalf will be the value for this 

			//create discardWarningMessage box instance if not already created 
			if (!this.warningDialog) {
				this.warningDialog = this.getView().byId("warningDialog");
				//register warningDialog to oDataHelper, so that it can be triggered warning message if user, click on list item when in create screen
				this.getOwnerComponent()._oDataHelper.setDiscardWarning(this.warningDialog);
			}

			//set user in create Loan screen, this variable is helpfull to through error message, if user 
			//clicks on + button (create Loan button, in handleOpenActionSheet function of MasterController), when he is in create Loan screen 
			this.getOwnerComponent()._oDataHelper.bInCreateLoanScreen = true;

			//if employee details are not fetched and clearnaceType is not set, then 
			//navigate user back to report screen
			if (!this.getOwnerComponent()._oDataHelper.employeeDetails) {
				var bReplace = true;
				this.getRouter().navTo("master", {}, bReplace);

				return false;
			}

			if (type === myselfText) {
				// set logged in employee data on select of "MySelf"
				employee = this.getOwnerComponent()._oDataHelper.employeeDetails;
				oViewModel.setProperty("/empDetails", employee);

			} else if (type === behalfText) {
				employee = this.getOwnerComponent()._oDataHelper.behalfEmployeeDetails;
				oViewModel.setProperty("/empDetails", employee);
				// oView.byId("approversList").getBinding("items").filter([new Filter("App1empno", FilterOperator.EQ, employee.Empno)]);
			}

			//Compare selected id with 0th id, if not same then set to 0th id
			if (oView.byId("iconTabBar").getSelectedKey() !== oView.byId("iconTabBar").getItems()[0].getId()) {
				oView.byId("iconTabBar").setSelectedKey(0);
			}
			if (!this.getOwnerComponent()._oDataHelper.exceptionMessage) {
				oView.byId("submitButton").setEnabled(true);
			}

		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function (sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("HeaderView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function () {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				// sObjectId = oObject.Pernr,
				sObjectId = oObject.TraNo,
				// here i need to change pernr to Trano
				sObjectName = oObject.Reason,
				oViewModel = this.getModel("HeaderView");

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			// oViewModel.setProperty("/shareSendEmailSubject",
			// 	oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			// oViewModel.setProperty("/shareSendEmailMessage",
			// 	oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		_onMetadataLoaded: function () {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("HeaderView");

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},
		selchange: function () {
			// 			var oCat = "001";
			var oCat = this.getView().byId("sct").getSelectedKey();
			// oView.byId("sid").getBinding("items").filter([new Filter("Vcate", FilterOperator.EQ, SelectedVcatt)]);
			var comb1 = this.getView().byId("sid").getBinding("items").filter([new Filter("Vcate", FilterOperator.EQ,
				oCat)]);
			this.getView().byId("sid").setVisible(true);
			this.getView().byId("lblsid").setVisible(true);
		},

		onOpenAsPDFPressed: function () {
			MessageToast.show("Open as pdf pressed");
		},
		submitPressed: function () {

			if (!this.submitDialog) {
				this.submitDialog = this.getView().byId("warningOnSubmitDialog");

			}
			this.submitDialog.open();

		},
		//	submitLoanRequest: function() {
		submitPresetRequest: function () {
			var oView = this.getView();
			//Get requester pernr
			//check if user details are already fetched, if not get these details again.
			if (this.getOwnerComponent()._oDataHelper.employeeDetails) {
				var RequesterPn = this.getOwnerComponent()._oDataHelper.employeeDetails.Empno;

				this.formJsonAndSubmit(oView, RequesterPn);
			} else {
				//Fetch logged in emplloyee details from server if doesn't exist already
				this.getOwnerComponent()._oDataHelper.fetchLoggedInEmployeeDetails(function (oError, oData) {

					var somethingWentWrong = this.getResourceBundle().getText("somethingWentWrong");
					if (oError) {
						//On failed to fetch, show please try again message
						sap.m.MessageBox.show(
							somethingWentWrong, {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: "Success",
								actions: [sap.m.MessageBox.Action.OK]
							});
						return false;
					}
					//Check if Empno is available, then fire formJsonAndSubmit
					if (oData.Empno) {
						this.formJsonAndSubmit(oView, oData.Empno);
					}
				}.bind(this));
			}

		},
		//This function forms JSON to submit to backend and triggers submit request
		formJsonAndSubmit: function (oView, emp) {
			var oView = this.getView();

			var oErrors;

			var Err1 = this.getResourceBundle().getText("Error1");
			var Err2 = this.getResourceBundle().getText("Error2");
			var Err3 = this.getResourceBundle().getText("Error3");
			var Err4 = this.getResourceBundle().getText("Error4");

			var f = this.byId("fileUploader");
			var fname = f.oFilePath._lastValue;

			var fields = f.oFilePath._lastValue.split('.');

			var filename = fields[0];
			var filetype = fields[1];

			var requestEmployeeDetails = this.getOwnerComponent()._oDataHelper.employeeDetails;

			var lv_pernr = oView.byId("pnr").getValue();

			if (lv_pernr === "") {
				sap.m.MessageBox.show(
					Err4, {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: "Error",
						actions: [sap.m.MessageBox.Action.OK]
					});
				return;
			}

			var lv_date = oView.byId("Date").getValue();
			if (lv_date === "") {
				sap.m.MessageBox.show(
					Err1, {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: "Error",
						actions: [sap.m.MessageBox.Action.OK]
					});
				return;
			}

			var lv_vcate = oView.byId("sct").getSelectedKey();
			if (lv_vcate === "") {
				sap.m.MessageBox.show(
					Err2, {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: "Error",
						actions: [sap.m.MessageBox.Action.OK]
					});
				return;
			}

			var lv_vioid = oView.byId("sid").getSelectedKey();
			if (lv_vioid === "") {
				sap.m.MessageBox.show(
					Err3, {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: "Error",
						actions: [sap.m.MessageBox.Action.OK]
					});
				return;
			}

			lv_date = lv_date + "T00:00:00";
			//RequesterPn,
			oErrors = this.validations(oView);
			if (oErrors == true) {
				var oData = {
					//	"Mandt": "",
					"TraNo": "",
					"Status": "",
					"Pernr": oView.byId("pnr").getValue(),
					"Ename": oView.byId("EMPNA").getValue(),
					// 	"Estdt": oView.byId("Date").getValue(),
					"Estdt": lv_date,
					// 	"Vcate": oView.byId("sct").getValue(),
					// 	"Vcatt": oView.byId("sctt").getValue(),
					// 	"Vioid": oView.byId("sid").getValue(),
					// 	"Vioit": oView.byId("sidt").getValue(),

					"Vcate": oView.byId("sct").getSelectedKey(),
					// 	"Vcatt": oView.byId("sctt").getText(),
					"Vcatt": oView.byId("sct").getValue(),
					"Vioid": oView.byId("sid").getSelectedKey(),
					// 	"Vioit": oView.byId("sidt").getSelectedValue(),
					"Vioit": oView.byId("sid").getValue(),

					"Note": oView.byId("Note").getValue(),
					"Company": requestEmployeeDetails.Company,
					"CompanyTxt": requestEmployeeDetails.CompanyTxt,
					"RequesterPn": requestEmployeeDetails.Empno,
					"Emppos": requestEmployeeDetails.Emppos,
					"EmpposTxtL": requestEmployeeDetails.EmpposTxtL,
					"Dept": requestEmployeeDetails.Dept,
					"DeptTxtL": requestEmployeeDetails.DeptTxtL,
					"Email": requestEmployeeDetails.Email,
					"Filename": oView.byId("fileUploader").getValue()

				};
				var tpernr = oView.byId("pnr").getValue();
				//this variable helps in avoiding, navigating to 
				this.getOwnerComponent()._oDataHelper.bCreateFired = true;
				//Get i18n Texts for Error/Success message boxes
				var successText = this.getResourceBundle().getText("successFull");
				var failedText = this.getResourceBundle().getText("failedText");
				var successTitle = this.getResourceBundle().getText("success");
				var errorTitle = this.getResourceBundle().getText("error");

				// this.getModel().read("/AttachmentsSet('null')?", null, null, true, function (oData1, response) {});
				var oToken = this.getModel().getSecurityToken(),
					f = this.byId("fileUploader"),
					url,
					u;

				//	var approversItems = oController.byId("approversList").getItems();
				var approversItems = oView.byId("approversList").getItems();
				var a = 0; // counter for the Approvers  
				for (var i = 0; i < approversItems.length; i++) {
					var approverDetails = approversItems[i].getBindingContext().getObject();
					a = a + 1;
					oData["App" + (a) + "empno"] = approverDetails.App1empno;
					oData["App" + (a) + "empna"] = approverDetails.App1empna;
					oData["App" + (a) + "email"] = approverDetails.App1email;
					oData["App" + (a) + "mob"] = approverDetails.App1mob;
					oData["App" + (a) + "id"] = approverDetails.App1id;
				}

				oData.Filename = f.oFilePath._lastValue;

				this.getModel().create("/SancreqSet", oData, {
					success: function (oData) {
						if (oData.TraNo) {
							if (f.oFilePath._lastValue != "") {

								var fname = f.oFilePath._lastValue;
								// url = "/sap/opu/odata/sap/ZGW_HR_SANC_REQ_SRV/OcchzdReqSet(Pernr='" + oData.Pernr + "')/AttachmentsSet";

								url = "/sap/opu/odata/sap/ZGW_HR_SANC_REQ_SRV/SancreqSet(TraNo='" + oData.TraNo + "')/AttachmentsSet";

								// 			url = "/sap/opu/odata/sap/ZGW_HR_SANC_REQ_SRV/SancreqSet(Pernr='" + tpernr + "',Filename='" + fname +
								// 				"')/AttachmentsSet";
								u = url;
								f.setUploadUrl(u);
								f.removeAllHeaderParameters();

								f.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
									name: "x-csrf-token",
									value: oToken //this.oDataModel.getSecurityToken()
								}));
								f.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
									name: "slug",
									value: f.oFilePath._lastValue //f.getValue()
								}));
								f.setSendXHR(true);
								if (f.getValue()) {
									f.upload();
								}
							} //File upload

							sap.m.MessageBox.show(
								// successText + " - " + tpernr, {
								successText + " - " + oData.TraNo, {
									icon: sap.m.MessageBox.Icon.SUCCESS,
									title: successTitle,
									actions: [sap.m.MessageBox.Action.OK],
									onClose: function () {
										//clear UI elements and navigate to master screen
										this.wrningDialogYesPressed();

									}.bind(this)
								});

							this.resetUIelementsState();

						} else {
							sap.m.MessageBox.show(
								failedText, {
									icon: sap.m.MessageBox.Icon.ERROR,
									title: errorTitle,
									actions: [sap.m.MessageBox.Action.OK]
								});
						}

					}.bind(this),
					error: function () {

					}.bind(this)
				});
			}
		},
		discardPressed: function () {
			if (!this.warningDialog) {
				this.warningDialog = this.getView().byId("warningDialog");
				//register warningDialog to oDataHelper, so that it can be triggered warning message if user, click on list item when in create screen
				this.getOwnerComponent()._oDataHelper.setDiscardWarning(this.warningDialog);
			}
			this.warningDialog.open();

		},
		wrningDialogYesPressed: function () {
			//clear Loan UI state 

			this.resetUIelementsState();

			var oHistory = sap.ui.core.routing.History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {

				// Otherwise we go backwards with a forward history
				var bReplace = true;
				this.getRouter().navTo("master", {}, bReplace);
				setTimeout(function myFunction() {
					this.getOwnerComponent().oListSelector._oList.getBinding("items").refresh();
				}.bind(this), 500);
			}
		},
		wrningDialogNoPressed: function () {
			this.warningDialog.close();
		},
		submitDialogYesPressed: function () {

			//this.submitLoanRequest();
			this.submitPresetRequest();

			this.submitDialog.close();

			//added by nawaz
			//	this.getOwnerComponent().oListSelector._oList.getBinding("items").refresh(); 

		},
		submitDialogNoPressed: function () {
			this.submitDialog.close();
		},
		resetUIelementsState: function () {
			var oView = this.getView();
			oView.byId("pnr").setValue("");
			oView.byId("EMPNA").setValue("");
			oView.byId("Date").getValue("");
			// 			oView.byId("sct").getValue("");
			// 			oView.byId("sctt").getValue("");
			// 			oView.byId("sid").getValue("");
			// 			oView.byId("sidt").getValue("");

			oView.byId("sct").getSelectedKey("");
			// 			oView.byId("sctt").getSelectedText("");
			oView.byId("sct").getValue("");
			oView.byId("sid").getSelectedKey("");
			// 			oView.byId("sidt").getSelectedText("");
			oView.byId("sid").getValue("");

			oView.byId("Note").getValue("");
			oView.byId("fileUploader").setVisible(false);
			oView.byId("fileUploader").setValue("");
			oView.byId("sid").setVisible(false);

		},

		//this function is to get F4 help for reporting employee number and name :nawaz
		onValueHelpRequest2: function (e) {
			var o = ["Pernr", "Ename"];
			this.onValueHelpRequest1("pnr", "EMPNA", "/results", "{Pernr}", "{Ename}", "both", o, "ReportingEmpsSet", "");
		},

		onValueHelpRequest1: function (f, t, p, d, a, o, b, m, c) {
			// var e = this.oResourceBundle.getText(t);
			var oView = this.getView();
			var e = 'Choose Employee';
			var g = d;
			var h = b;
			var F = this.getView().byId(f);
			var Z = this.getView().byId(t);
			var n = "";
			var O = "";
			var j = function (E) {
				var oSelectedItems = E.mParameters.selectedItems,
					oItem,
					PernrFld,
					ENameFld,
					SelectedPernr,
					SelectedEName;

				for (var i = 0; i < oSelectedItems.length; i++) {
					oItem = oSelectedItems[i];
					SelectedPernr = oItem.getTitle();
					SelectedEName = oItem.getDescription();
					oView.byId(t).setValue(SelectedPernr);
					oView.byId(f).setValue(SelectedEName);
				}
			};
			var v = function (E) {
				var V = E.getParameter("value");
				var oFilter = new sap.ui.model.Filter(
					"Pernr",
					sap.ui.model.FilterOperator.Contains, V
				);
				E.getSource().getBinding("items").filter([oFilter]);
			};
			this._valueHelpSelectDialog = new sap.m.SelectDialog({
				title: e,
				items: {
					path: p,
					template: new sap.m.StandardListItem({
						title: a,
						description: g,
						active: true
					})
				},
				search: v,
				liveChange: v,
				confirm: j,
				cancel: j
			});
			this._valueHelpSelectDialog.setModel(this.getView().getModel("ReportingEmpsSet"));
			this._valueHelpSelectDialog.open();
		},

		//this function is to get F4 help for Sanction Category  category and name :nawaz
		onValueHelpRequest3: function (e) {
			//this below variables names frerence from entitye set  :VolCategorySet
			var o = ["Vcate", "Vcatt"];
			// 		first two variables refrence from xml id
			this.onValueHelpRequest5("sct", "sctt", "/results", "{Vcate}", "{Vcatt}", "both", o, "VolCategorySet", "");
		},

		onValueHelpRequest5: function (f, t, p, d, a, o, b, m, c) {
			// var e = this.oResourceBundle.getText(t);
			var oView = this.getView();
			var e = 'Choose Sanction Category';
			var g = d;
			var h = b;
			var F = this.getView().byId(f);
			var Z = this.getView().byId(t);
			var n = "";
			var O = "";
			var j = function (E) {
				var oSelectedItems = E.mParameters.selectedItems,
					oItem,
					VcateFld,
					VcattFld,
					SelectedVcate,
					SelectedVcatt;

				for (var i = 0; i < oSelectedItems.length; i++) {
					oItem = oSelectedItems[i];
					SelectedVcate = oItem.getTitle();
					SelectedVcatt = oItem.getDescription();
					oView.byId(t).setValue(SelectedVcate);
					oView.byId(f).setValue(SelectedVcatt);

				}
				// var scr = oView.byId("sid").getValue();
				// oView.byId("sid").getBinding("items").filter([new Filter("Vcate", FilterOperator.EQ, SelectedVcatt)]);

			};
			var v = function (E) {
				var V = E.getParameter("value");
				var oFilter = new sap.ui.model.Filter(
					"Vcate",
					sap.ui.model.FilterOperator.Contains, V
				);
				E.getSource().getBinding("items").filter([oFilter]);
			};
			this._valueHelpSelectDialog = new sap.m.SelectDialog({
				title: e,
				items: {
					path: p,
					template: new sap.m.StandardListItem({
						title: a,
						description: g,
						active: true
					})
				},
				search: v,
				liveChange: v,
				confirm: j,
				cancel: j
			});
			this._valueHelpSelectDialog.setModel(this.getView().getModel("VolCategorySet"));
			this._valueHelpSelectDialog.open();

			// 			var scr = this.getView().byId("sct").getValue();

			// 			this.getView().byId("VolCodeSet").getBinding("items").filter([new Filter("Vcate", FilterOperator.EQ, scr)]);
		},

		// 		var scr = this.getView().byId("sct").getValue();
		// 		this.getView().byId("VolCodeSet").getBinding("items").filter([new Filter("Vcate", FilterOperator.EQ, scr)]);

		// 		onSctChange: function (oEvent) {
		// 			var otype = oEvent.oSource.mProperties.selectedKey;

		// 			var scr = this.getView().byId("sct").getValue();

		// 			this.getView().byId("VolCodeSet").getBinding("items").filter([new Filter("Vcate", FilterOperator.EQ, otype)]);

		// 		},

		//this function is to get F4 help for Sanction Type  voilation id  and name :nawaz
		onValueHelpRequest4: function (e) {
			//this below variables names frerence from entitye set  :VolCodeSet
			var o = ["Vioid", "Vioit"];
			// 		first two variables refrence from xml id
			this.onValueHelpRequest6("sid", "sidt", "/results", "{Vioid}", "{Vioit}", "both", o, "VolCodeSet", "");
		},

		onValueHelpRequest6: function (f, t, p, d, a, o, b, m, c) {
			// var e = this.oResourceBundle.getText(t);
			var oView = this.getView();
			var e = 'Choose Sanction Type';
			var g = d;
			var h = b;
			var F = this.getView().byId(f);
			var Z = this.getView().byId(t);
			var n = "";
			var O = "";

			var scr = oView.byId("sct").getValue();

			// 			this.getView().byId("VolCodeSet").getBinding("items").filter([new Filter("Vcate", FilterOperator.EQ, scr)]);
			//this.getView().byId("VolCodeSet").getBinding("items").filter([new Filter("Vcate", FilterOperator.EQ, scr)]);

			var j = function (E) {
				var oSelectedItems = E.mParameters.selectedItems,
					oItem,
					VioidFld,
					VioitFld,
					SelectedVioid,
					SelectedVioit;

				for (var i = 0; i < oSelectedItems.length; i++) {
					oItem = oSelectedItems[i];
					SelectedVioid = oItem.getTitle();
					SelectedVioit = oItem.getDescription();
					oView.byId(t).setValue(SelectedVioid);
					oView.byId(f).setValue(SelectedVioit);
				}
			};
			var v = function (E) {
				var V = E.getParameter("value");
				var oFilter = new sap.ui.model.Filter(
					"Vioid",
					sap.ui.model.FilterOperator.Contains, V
				);
				E.getSource().getBinding("items").filter([oFilter]);
			};
			this._valueHelpSelectDialog = new sap.m.SelectDialog({
				title: e,
				items: {
					path: p,
					// 	parameters: {
					// 		Vcate: '001'
					// 	},
					template: new sap.m.StandardListItem({
						title: a,
						description: g,
						active: true

					})
				},
				search: v,
				liveChange: v,
				confirm: j,
				cancel: j
			});
			this._valueHelpSelectDialog.setModel(this.getView().getModel("VolCodeSet"));
			//var oFilter = new Filter("Vcate", sap.ui.model.FilterOperator.Contains, "001");
			//var oBinding = this._valueHelpSelectDialog.getBinding("items");
			//oBinding.filter([oFilter]);
			this._valueHelpSelectDialog.open();
		},

		//This Function is to perform the validation for the USer Input 		
		validations: function (oView) {
			var Msg;
			return true;
		},

	});

});