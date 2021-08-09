sap.ui.define([], function () {
	"use strict";

	return {
		/**
		 * Rounds the currency value to 2 digits
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		currencyValue: function (sValue) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2);
		},

		/**
		 * Returns a configuration object for the {@link sap.ushell.ui.footerbar.AddBookMarkButton} "appData" property
		 * @public
		 * @param {string} sTitle the title for the "save as tile" dialog
		 * @returns {object} the configuration object
		 */
		shareTileData: function (sTitle) {
			return {
				title: sTitle
			};
		},
		/*		reasonFormatter:function(sReason){
					return sReason.toLowerCase();
				},*/
		statusFormatter: function (sStatus) {
			//	return sStatus.toLowerCase();
		},
		statusColorFormatter: function (sStatus) {

				// if (sStatus === "New case") {
				// 	return "Success";
				// } else { //REJECTED
				// 	return "Error";
				// }

				if (sStatus === "APPROVED") {
					return "Success";
				} else { //REJECTED
					return "Error";
				}

			}
			/**
			 * this function formats roleDescriptions starting with DEPT- so that
			 * DEPT- can be removed from the display
			 * */

		/*		roleDescFormatterForDept:function(oVal){
					//Key string is "DEPT-", in future, if this is changed, just replace the key
					// string with new key value
					if(!this.key){
					     this.key="DEPT-"; //change this value, if anything is changed in "DEPT-" 
					}
					
					//check if oVal exists and starts with key string
					if(oVal && oVal.startsWith(this.key)){
						 
						 oVal=oVal.substring(this.key.length,oVal.length);
					}

		            return oVal;
				
				}*/

	};

});