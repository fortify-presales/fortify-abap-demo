sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function(Controller) {
    "use strict";
    return Controller.extend("com.fortify.demo.zui5fiori.controller.MainSummary", {
        onInit: function() {
            // Fetch summary data from mainService
            var oModel = this.getOwnerComponent().getModel();
            oModel.read("/zv_prod_card_txn", {
                success: function(oData) {
                    var oView = this.getView();
                    oView.setModel(new sap.ui.model.json.JSONModel({zv_prod_card_txn: oData.results}));
                }.bind(this),
                error: function() {
                    // handle error
                }
            });
        },
        onItemPress: function(oEvent) {
            var oItem = oEvent.getSource();
            var oContext = oItem.getBindingContext();
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("RouteDetail", {
                txn_id: oContext.getProperty("txn_id"),
                product_id: oContext.getProperty("product_id"),
                card_id: oContext.getProperty("card_id")
            });
        }
    });
});