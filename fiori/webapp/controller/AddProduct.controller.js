sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/richtexteditor/RichTextEditor"
], function(Controller, JSONModel, MessageToast, RichTextEditor) {
    "use strict";

    return Controller.extend("com.fortify.demo.zui5fiori.controller.AddProduct", {
        onInit: function() {
            var oProductForm = this.byId("productForm");
            if (oProductForm) {
                // Create the label
                var oDescLabel = new sap.m.Label(this.createId("productDescLabel"), {
                    text: "Description",
                    required: true
                });

                // Create the RichTextEditor
                var oRichTextEditor = new RichTextEditor({
                    width: "100%",
                    height: "200px",
                    editorType: "TinyMCE6",
                    value: "",
                    customToolbar: true,
                    showGroupFont: true,
                    showGroupLink: true,
                    showGroupInsert: true,
                    sanitizeValue: false,
                    wrapping: true
                });

                // TODO: fix description binding to model
                //oRichTextEditor.bindValue("addProduct>/description");

                // TODO: fix insertion point
                // Find the index to insert after Product Name Input
                var oProductNameInput = this.byId("productNameInput");
                var iIndex = oProductForm.indexOfAggregation("content", oProductNameInput);

                // Insert label and editor after Product Name Input
                oProductForm.insertAggregation("content", oDescLabel, iIndex + 1);
                oProductForm.insertAggregation("content", oRichTextEditor, iIndex + 2);
            }
        },

        onNavBack: function() {
            this.getOwnerComponent().getRouter().navTo("RouteProducts");
        },

        onCancel: function() {
            this._clearForm();
            this.onNavBack();
        },

        onSaveProduct: function() {
            var oModel = this.getView().getModel("addProduct");
            var oData = oModel.getData();
            
            // Validate form
            if (!this._validateForm(oData)) {
                this._showMessage("Please fill in all required fields", "Error");
                return;
            }
            
            // Create XML content
            var sXmlContent = this._generateXML(oData);
            
            // Save to file using browser download
            this._saveToFile(sXmlContent, "product_" + oData.product_id + ".xml");
            
            // Show success message
            this._showMessage("Product saved successfully to XML file!", "Success");
            MessageToast.show("Product " + oData.product_id + " saved to XML file");
            
            // Clear form
            this._clearForm();
        },

        _validateForm: function(oData) {
            if (!oData.product_id || oData.product_id.trim() === "") {
                return false;
            }
            if (!oData.product_name || oData.product_name.trim() === "") {
                return false;
            }
            if (!oData.description || oData.description.trim() === "") {
                return false;
            }
            if (!oData.price || oData.price === "" || isNaN(parseFloat(oData.price))) {
                return false;
            }
            return true;
        },

        _generateXML: function(oData) {
            var sTimestamp = new Date().toISOString();
            
            // Intentionally NOT escaping XML to demonstrate XML injection vulnerability
            var sXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
            sXml += '<product>\n';
            sXml += '  <header>\n';
            sXml += '    <created>' + sTimestamp + '</created>\n';
            sXml += '    <source>Fortify SAP Demo - Add Product Form</source>\n';
            sXml += '  </header>\n';
            sXml += '  <data>\n';
            sXml += '    <product_id>' + oData.product_id + '</product_id>\n';
            sXml += '    <product_name>' + oData.product_name + '</product_name>\n';
            sXml += '    <description>' + oData.description + '</description>\n';
            sXml += '    <price currency="USD">' + oData.price + '</price>\n';
            sXml += '  </data>\n';
            sXml += '</product>';
            
            return sXml;
        },

        _saveToFile: function(sContent, sFilename) {
            // Create a Blob with the XML content
            var blob = new Blob([sContent], { type: 'application/xml' });
            
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
            var oModel = this.getView().getModel("addProduct");
            oModel.setData({
                product_id: "",
                product_name: "",
                description: "",
                price: ""
            });
            this._hideMessage();
        },

        _showMessage: function(sText, sType) {
            var oMessageStrip = this.byId("messageStrip");
            oMessageStrip.setText(sText);
            oMessageStrip.setType(sType);
            oMessageStrip.setVisible(true);
        },

        _hideMessage: function() {
            var oMessageStrip = this.byId("messageStrip");
            oMessageStrip.setVisible(false);
        }
    });
});
