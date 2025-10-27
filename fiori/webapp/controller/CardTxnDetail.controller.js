sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function(Controller) {
    "use strict";
    return Controller.extend("com.fortify.demo.zui5fiori.controller.CardTxnDetail", {
        onInit: function() {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.getRoute("RouteCardTxnDetail").attachPatternMatched(this._onObjectMatched, this);
        },
        _onObjectMatched: function(oEvent) {
            var args = oEvent.getParameter("arguments");
            var oModel = this.getOwnerComponent().getModel();
            var sKey = `txn_id='${args.txn_id}',product_id='${args.product_id}',card_id='${args.card_id}'`;
            oModel.read(`/zv_prod_card_txn(${sKey})`, {
                success: function(oData) {
                    this.getView().setModel(new sap.ui.model.json.JSONModel(oData), "detail");
                }.bind(this),
                error: function() {
                    // handle error
                }
            });
        },
        onNavBack: function() {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("RouteCardTxnSummary");
        }
    });
});