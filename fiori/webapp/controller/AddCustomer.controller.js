sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function(Controller, JSONModel, MessageToast) {
    "use strict";

    return Controller.extend("com.fortify.demo.zui5fiori.controller.AddCustomer", {
        onInit: function() {
            console.log("AddCustomer controller initialized");
            
            // Create a model to hold form data
            var oFormModel = new JSONModel({
                customer_id: "",
                customer_name: "",
                status: ""
            });
            this.getView().setModel(oFormModel, "addCustomer");
        },

        onNavBack: function() {
            this.getOwnerComponent().getRouter().navTo("RouteCustomers");
        },

        onCancel: function() {
            this._clearForm();
            this.onNavBack();
        },

        onSaveCustomer: function() {
            var oModel = this.getView().getModel("addCustomer");
            var oData = oModel.getData();
            
            // Validate form
            if (!this._validateForm(oData)) {
                this._showMessage("Please fill in all required fields", "Error");
                return;
            }
            
            // Create JSON content
            var sJsonContent = this._generateJSON(oData);
            
            // Save to file using browser download
            this._saveToFile(sJsonContent, "customer_" + oData.customer_id + ".json");
            
            // Show success message
            this._showMessage("Customer saved successfully to JSON file!", "Success");
            MessageToast.show("Customer " + oData.customer_id + " saved to JSON file");
            
            // Clear form
            this._clearForm();
        },

        _validateForm: function(oData) {
            if (!oData.customer_id || oData.customer_id.trim() === "") {
                return false;
            }
            if (!oData.customer_name || oData.customer_name.trim() === "") {
                return false;
            }
            if (!oData.status || oData.status.trim() === "") {
                return false;
            }
            return true;
        },

        _generateJSON: function(oData) {
            var sTimestamp = new Date().toISOString();
            
            // Intentionally NOT escaping or validating input to demonstrate JSON injection vulnerability
            var oCustomer = {
                header: {
                    created: sTimestamp,
                    source: "Fortify SAP Demo - Add Customer Form"
                },
                data: {
                    customer_id: oData.customer_id,
                    customer_name: oData.customer_name,
                    status: oData.status
                }
            };
            
            // Using JSON.stringify without any sanitization - vulnerable to injection
            return JSON.stringify(oCustomer, null, 2);
        },

        _saveToFile: function(sContent, sFilename) {
            // Create a Blob with the JSON content
            var blob = new Blob([sContent], { type: 'application/json' });
            
            // Create a temporary download link
            var link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = sFilename;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            
            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(link.href);
        },

        _clearForm: function() {
            var oModel = this.getView().getModel("addCustomer");
            oModel.setData({
                customer_id: "",
                customer_name: "",
                status: ""
            });
            this._hideMessage();
        },

        _showMessage: function(sText, sType) {
            var oMessageStrip = this.byId("addCustomerMessageStrip");
            oMessageStrip.setText(sText);
            oMessageStrip.setType(sType);
            oMessageStrip.setVisible(true);
        },

        _hideMessage: function() {
            var oMessageStrip = this.byId("addCustomerMessageStrip");
            oMessageStrip.setVisible(false);
        }
    });
});
