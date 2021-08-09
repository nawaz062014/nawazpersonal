/*global location */
sap.ui.define([
	"sncReq/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sncReq/model/formatter",
	"sap/m/MessageToast",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, formatter, MessageToast, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("sncReq.controller.Detail", {

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

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");

			this.getOwnerComponent().oWhenMetadataIsLoaded.then(this._onMetadataLoaded.bind(this));

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share button has been clicked
		 * @param {sap.ui.base.Event} oEvent the butten press event
		 * @public
		 */
		onSharePress: function () {
			var oShareSheet = this.byId("shareSheet");
			oShareSheet.addStyleClass(this.getOwnerComponent().getContentDensityClass());
			oShareSheet.openBy(this.byId("shareButton"));
		},

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function () {
			var oViewModel = this.getModel("detailView");

			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function () {
			var oViewModel = this.getModel("detailView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});

			oShareDialog.open();
		},

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
			var sObjectId = oEvent.getParameter("arguments").objectId;
			var fname = oEvent.getParameter("arguments").Filename;
			this.getOwnerComponent().oWhenMetadataIsLoaded.then(function () {
				var sObjectPath = this.getModel().createKey("SancreqSet", {
					TraNo: sObjectId
						// 	Filename: fname //
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));

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
			var oViewModel = this.getModel("detailView");

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
			var sPath = oElementBinding.getPath();
			this.getOwnerComponent().oListSelector.selectAListItem(sPath);
			//check if binding object exists
			if (oView.getModel().getObject(sPath)) {
				// var Workitemid = oView.getModel().getObject(sPath).Workitemid;
				//var Reason=oView.getModel().getObject(sPath).Reason;
				// this.getView().byId("approversList").getBinding("items").filter([new Filter("Workitemid", FilterOperator.EQ, Workitemid)]);

				//Compare selected id with 0th id, if not same then set to 0th id		
				if (oView.byId("iconTabBar").getSelectedKey() !== oView.byId("iconTabBar").getItems()[0].getId()) {
					oView.byId("iconTabBar").setSelectedKey(0);
				}
			}
		},

		_onMetadataLoaded: function () {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView");

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},
		/*		onOpenAsPDFPressed: function () {
					var sServiceUrl = this.getModel().sServiceUrl;
					var TraNo = this.getView().getBindingContext().getObject().TraNo;
					var pdfURL = "/sap/opu/odata/sap/ZGW_POLICY_DIS_SRV/PDFPaystubs(SEQUENCENUMBER=2,PersonnelAssignment='00000193')/$value";

					var newWindow = window.open(pdfURL, "_blank");

					// set title window
					newWindow.onload = jQuery.proxy(function () {
						newWindow.document.title = this.getResourceBundle().getText('pdf_windo_title');
					}, this);
				},*/
		//formatter approver image URL - This formatter is kept in controller, as it is easy to get binding context here compared to formatter
		userImageFormatter: function (oValue) {

			if (oValue) {
				//	this.getView().getModel()
				var empImage = this.getModel().sServiceUrl + "/EmpPhotoSet('" + oValue + "')/$value";
			}
			//	EmpPhotoSet('"+App1empno+"')/$value

			return empImage;

		}

	});

});