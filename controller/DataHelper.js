sap.ui.define([
	"sap/ui/base/Object"
], function (BaseObject) {
	"use strict";

	return BaseObject.extend("sncReq.model.DataHelper", {

		/**
		 * Custom utility class.
		 * Provides an api to access data and cache data, data like logged in employee details. This information can be accessed across Views
		 * function.
		 * @class
		 * @public
		 * @alias sncReq.model.DataHelper
		 */

		constructor: function (oComponent) {
			this.employeeDetails = null;
			this.behalfEmployeeDetails = null;
			//	this.LoanType = "";
			this.bCreateFired = false;
			//	this.bInCreateLoanScreen = false;
			this.exceptionMessage = "";
			this.oComponent = oComponent;
			this._oModel = oComponent.getModel();
			this.discardWarningMessage = null;

		},
		/**
		 * Fetches logged in emplloyee details from server and assign details to employeeDetails object
		 *
		 * @ returns null,
		 */
		//this function is called in Master Controller, as we need to hide or show segmented button based on the response from this service. 
		fetchLoggedInEmployeeDetails: function (callback) {
			//	read data from odata model
			this._oModel.read("/EmpDataSet('null')", {
				success: function (oData) {

					this.employeeDetails = oData;
					callback(null, oData);
				}.bind(this),
				error: function () {
					callback("Error");
				}
			});

		},

		/**
		 * Gets logged in emplloyee details, 
		 * @return employeeDetails object
		 * @ returns null, if no emloyee details are present
		 */
		getLoggedInEmployeeDetails: function () {

			return this.employeeDetails;
		},
		/**
		 * Set Loan type function, this function gets called when user selects type of clearnce, i.e., Vacation, Resignation etc
		 */
		setLoanType: function (sType) {
			this.LoanType = sType;
		},
		/**
		 * Returns Loan type 
		 */
		getLoanType: function () {
			return this.LoanType;
		},
		/**
		 * Set discard warning message here
		 * @params warningMessage, as an argument
		 * */
		setDiscardWarning: function (warningMessage) {
			this.discardWarningMessage = warningMessage;
		},
		/**
		 * Get discard warning message here
		 * returns warningMessage
		 * */
		getDicardWarning: function () {
			return this.discardWarningMessage;
		},
		/**
		 * Opens discard warning message
		 * */
		openDicardWarning: function () {
			if (this.discardWarningMessage) {
				this.discardWarningMessage.open();
			}

		},
		/**
		 * Fetch employee details based on his employee id
		 * @empID- Pass employee id of the user
		 * @callback- callback function to trigger after user data is fetched, this accepts 2 arguments, oError and oData.
		 * oError will be null for success callback
		 * oError will string with value Error for error callback
		 */
		fetchEmployeeDetails: function (Empno, callback) {
			//	read data from odata model
			this._oModel.read("/EmpDataSet('" + Empno + "')", {
				success: function (oData) {

					this.behalfEmployeeDetails = oData;
					callback(null, oData);
				}.bind(this),
				error: function () {
					callback("Error");
				}
			});

		}

	});

});