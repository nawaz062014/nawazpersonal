sap.ui.define([
	"sncReq/controller/BaseController",
	"sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("sncReq.controller.App", {

		onInit: function () {
			var oViewModel,
				fnSetAppNotBusy,
				oListSelector = this.getOwnerComponent().oListSelector,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

			oViewModel = new JSONModel({
				busy: true,
				delay: 0
			});
			this.setModel(oViewModel, "appView");

			fnSetAppNotBusy = function () {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			this.getOwnerComponent().oWhenMetadataIsLoaded.
			then(fnSetAppNotBusy, fnSetAppNotBusy);

			//Set owner split app to owner component, which is helpfull in show or hide master during creation
			this.getOwnerComponent()._splitApp = this.byId("idAppControl");
			// Makes sure that master view is hidden in split app
			// after a new list entry has been selected.
			oListSelector.attachListSelectionChange(function () {
				this.byId("idAppControl").hideMaster();
			}, this);

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

			var oRouter = this.getRouter();
			oRouter.attachRouteMatched(function (oEvent) {
				var sRouteName = oEvent.getParameter("name");
				if (sRouteName !== "createLoanReq") {
					this.getOwnerComponent()._oDataHelper.bInCreateLoanScreen = false;
				} else {
					this.getOwnerComponent()._oDataHelper.bInCreateLoanScreen = true;
				}
			}.bind(this));
			oRouter.attachBypassed(function (oEvent) {
				var sHash = oEvent.getParameter("hash");
				//set this varaible to false, if bypassed
				this.getOwnerComponent()._oDataHelper.bInCreateLoanScreen = false;
			});

		}

	});

});