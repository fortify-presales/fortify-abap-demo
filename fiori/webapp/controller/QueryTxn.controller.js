sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function(Controller, MessageToast) {
    "use strict";
    return Controller.extend("com.fortify.demo.zui5fiori.controller.QueryTxn", {
        onInit: function() {
            console.log("QueryTxn controller initialized");
            
            // Attach to route matched event to handle txn_id parameter
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteQueryTxn").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function(oEvent) {
            var oArgs = oEvent.getParameter("arguments");
            var sTxnId = oArgs.txn_id;
            
            if (sTxnId) {
                // Pre-populate the transaction ID field
                var oTxnIdInput = this.getView().byId("txnIdField");
                oTxnIdInput.setValue(sTxnId);
            }
        },

        onNavBack: function() {
            this.getOwnerComponent().getRouter().navTo("RouteDashboard");
        },

        onCancel: function() {
            this._clearForm();
            this._hideMessage();
            MessageToast.show("Query cancelled");
        },
        
        onSubmitInput: function() {
            var oTxnIdInput = this.getView().byId("txnIdField");
            var oSummaryInput = this.getView().byId("summaryField");
            var oDescriptionEditor = this.getView().byId("descriptionField");
            
            var sTxnId = oTxnIdInput.getValue();
            var sSummary = oSummaryInput.getValue();
            var sDescription = oDescriptionEditor.getValue();
            
            // Validate form
            if (!sTxnId || sTxnId.trim() === "") {
                this._showMessage("Please enter a transaction ID", "Error");
                return;
            }
            
            if (!sSummary || sSummary.trim() === "") {
                this._showMessage("Please enter a summary", "Error");
                return;
            }
            
            if (!sDescription || sDescription.trim() === "") {
                this._showMessage("Please enter query details", "Error");
                return;
            }
            
            console.log("User submitted query - Transaction ID:", sTxnId);
            console.log("User submitted query - Summary:", sSummary);
            console.log("User submitted query - Description:", sDescription);
            
            // Intentionally writing unsanitized input to DOM for XSS demonstration
            var submitButtonDomRef = this.getView().byId("submitButton").getDomRef();
            var pageDomRef = this.getView().byId("queryTxnPage").getDomRef();
            
            if (pageDomRef) {
                var outputDiv = document.getElementById("userOutputDiv");
                if (!outputDiv) {
                    outputDiv = document.createElement("div");
                    outputDiv.id = "userOutputDiv";
                    outputDiv.style.marginTop = "0.5rem";
                    outputDiv.style.padding = "1rem";
                    outputDiv.style.border = "1px solid #ccc";
                    outputDiv.style.backgroundColor = "#f5f5f5";
                    submitButtonDomRef.parentNode.insertBefore(outputDiv, submitButtonDomRef.nextSibling);
                }
                // Vulnerable: directly setting innerHTML with unsanitized user input
                outputDiv.innerHTML = "<strong>Transaction ID:</strong> " + sTxnId + "<br><strong>Summary:</strong> " + sSummary + "<br><br><strong>Details:</strong> " + sDescription;
            }
            
            this._showMessage("Query submitted successfully!", "Success");
            MessageToast.show("Query submitted");
        },

        _clearForm: function() {
            var oTxnIdInput = this.getView().byId("txnIdField");
            var oSummaryInput = this.getView().byId("summaryField");
            var oDescriptionEditor = this.getView().byId("descriptionField");
            
            oTxnIdInput.setValue("");
            oSummaryInput.setValue("");
            oDescriptionEditor.setValue("");
            
            // Clear output div if it exists
            var outputDiv = document.getElementById("userOutputDiv");
            if (outputDiv && outputDiv.parentNode) {
                outputDiv.parentNode.removeChild(outputDiv);
            }
        },

        _showMessage: function(sText, sType) {
            var oMessageStrip = this.byId("queryTxnMessageStrip");
            oMessageStrip.setText(sText);
            oMessageStrip.setType(sType);
            oMessageStrip.setVisible(true);
        },

        _hideMessage: function() {
            var oMessageStrip = this.byId("queryTxnMessageStrip");
            oMessageStrip.setVisible(false);
        }
    });
});