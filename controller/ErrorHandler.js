sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessageBox"
], function (Object, MessageBox) {
	"use strict";

	return Object.extend("sncReq.controller.ErrorHandler", {

		/**
		 * Handles application errors by automatically attaching to the model events and displaying errors when needed.
		 * @class
		 * @param {sap.ui.core.UIComponent} oComponent reference to the app's component
		 * @public
		 * @alias com.wisys.controller.ErrorHandler
		 */
		constructor: function (oComponent) {
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oComponent = oComponent;
			this._oModel = oComponent.getModel();
			//this._bMessageOpen = false;
			this._bMessageOpen = true;
			this._sErrorText = this._oResourceBundle.getText("errorText");
			this._sErrorTitle = this._oResourceBundle.getText("errorTitle");
			this._oModel.attachMetadataFailed(function (oEvent) {
				var oParams = oEvent.getParameters();

				this._showMetadataError(oParams.response);
			}, this);

			this._oModel.attachRequestFailed(function (oEvent) {
				//	var oParams = oEvent.getParameters(); //getParameters() is converting json into xml, so read mParameters directly
				var oParams = oEvent.mParameters;
				// An entity that was not found in the service is also throwing a 404 error in oData.
				// We already cover this case with a notFound target so we skip it here.
				// A request that cannot be sent to the server is a technical error that we have to handle though
				if (oParams.response.statusCode !== "404" || (oParams.response.statusCode === 404 && oParams.response.responseText.indexOf(
						"Cannot POST") === 0)) {
					this._showServiceError(oParams.response);
				}
			}, this);
		},

		/**
		 * Shows a {@link sap.m.MessageBox} when the metadata call has failed.
		 * The user can try to refresh the metadata.
		 * @param {string} sDetails a technical error to be displayed on request
		 * @private
		 */
		_showMetadataError: function (sDetails) {
			MessageBox.show(
				this._sErrorText, {
					id: "metadataErrorMessageBox",
					icon: MessageBox.Icon.ERROR,
					title: this._sErrorTitle,
					details: sDetails,
					styleClass: this._oComponent.getContentDensityClass(),
					actions: [MessageBox.Action.CLOSE]
				}
			);
		},

		/**
		 * Shows a {@link sap.m.MessageBox} when a service call has failed.
		 * Only the first error message will be display.
		 * @param {string} sDetails a technical error to be displayed on request
		 * @private
		 */
		_showServiceError: function (sDetails) {
			// if (!this._bMessageOpen) { //this is getting triggered twice in case of exception, second time responseText is in JSON format
			//                           //so wait for function to get triggered second time
			// 	this._bMessageOpen = true;
			// 	return;
			// }

			//check if response is parsable, then parse otherwise show message as is
			var oMessage = "";

			try {
				// Try to parse as a JSON string
				oMessage = JSON.parse(sDetails.responseText);
				var oTextMessage = "";
				if (oMessage.error.innererror) { //make sure innererror object is there
					if (oMessage.error.innererror.errordetails) { //make sure errordetails object is there
						for (var i = 0; i < oMessage.error.innererror.errordetails.length; i++) {

							var errorCode = oMessage.error.innererror.errordetails[i].code;
							//check if error code starts with ZFIORI_MSG
							if (errorCode.startsWith("ZFIORI_MSG")) {
								//if it starts then store these messages to throw error in later lifecycle of the app.
								this._oComponent._oDataHelper.exceptionMessage += errorCode + " : " + oMessage.error.innererror.errordetails[i].message + " ";
							}

							oTextMessage += errorCode + " : " + oMessage.error.innererror.errordetails[i].message + " ";
						}
					}
				}
				oMessage = oTextMessage;

			} catch (err) {
				oMessage = this._sErrorText;
			}
			MessageBox.show(
				oMessage, {
					//	id: "serviceErrorMessageBox",
					icon: MessageBox.Icon.ERROR,
					title: this._sErrorTitle,
					details: sDetails,
					styleClass: this._oComponent.getContentDensityClass(),
					actions: [MessageBox.Action.CLOSE],
					onClose: function () {
						this._bMessageOpen = false;
					}.bind(this)
				}
			);
		}
	});

});