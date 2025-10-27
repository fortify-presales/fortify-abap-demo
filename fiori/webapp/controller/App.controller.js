sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel"
], (BaseController) => {
  "use strict";

  return BaseController.extend("com.fortify.demo.zui5fiori.controller.App", {
    onInit() {
      var oViewModel = new JSONModel({
        selectedView: "Contact"
      });
      this.getView().setModel(oViewModel, "viewModel");
    },
    onNavToCardTxnSummary: function() {
      this.getView().getModel("viewModel").setProperty("/selectedView", "CardTxnSummary");
    },
    onNavToContact: function() {
      this.getView().getModel("viewModel").setProperty("/selectedView", "Contact");
    },
    onSideNavSelect: function(oEvent) {
      var sKey = oEvent.getParameter("item").getKey();
      this.getView().getModel("viewModel").setProperty("/selectedView", sKey);
    }
  });
});