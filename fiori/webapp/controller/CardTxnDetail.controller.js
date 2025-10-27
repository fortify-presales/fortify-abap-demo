sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/UIComponent"
], function(Controller, JSONModel, UIComponent) {
    "use strict";
    return Controller.extend("com.fortify.demo.zui5fiori.controller.CardTxnDetail", {
        onInit: function() {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("RouteCardTxnDetail").attachPatternMatched(this._onObjectMatched, this);
        },
        _onObjectMatched: function(oEvent) {
            var args = oEvent.getParameter("arguments");
            var oModel = this.getOwnerComponent().getModel();
            var sKey = `txn_id='${args.txn_id}',product_id='${args.product_id}',card_id='${args.card_id}'`;
            oModel.read(`/zv_prod_card_txn(${sKey})`, {
                success: function(oData) {
                    // Use the imported JSONModel instead of global variable
                    this.getView().setModel(new JSONModel(oData), "detail");
                }.bind(this),
                error: function() {
                    // handle error
                }
            });
        },
        onNavBack: function() {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteCardTxnSummary");
        },

        onSendQuery: function() {
            var oDetailModel = this.getView().getModel("detail");
            var sTxnId = oDetailModel.getProperty("/txn_id");
            
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteQueryTxn", {
                txn_id: sTxnId
            });
        }
    });
});