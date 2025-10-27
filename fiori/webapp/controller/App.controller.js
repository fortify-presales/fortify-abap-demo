sap.ui.define([
  "sap/ui/core/mvc/Controller"
], (Controller) => {
  "use strict";

  return Controller.extend("com.fortify.demo.zui5fiori.controller.App", {
    onInit() {
    },

    onNavigationSelect: function(oEvent) {
      var sKey = oEvent.getParameter("item").getKey();
      var oRouter = this.getOwnerComponent().getRouter();
      
      if (sKey === "Dashboard") {
        oRouter.navTo("RouteDashboard");
      } else if (sKey === "CardTxnSummary") {
        oRouter.navTo("RouteCardTxnSummary");
      } else if (sKey === "Products") {
        oRouter.navTo("RouteProducts");
      } else if (sKey === "Customers") {
        oRouter.navTo("RouteCustomers");
      } else if (sKey === "AddProduct") {
        oRouter.navTo("RouteAddProduct");
      } else if (sKey === "AddCustomer") {
        oRouter.navTo("RouteAddCustomer");
      } else if (sKey === "QueryTxn") {
        oRouter.navTo("RouteQueryTxn");
      }
    },

    onPressHome: function() {
      // Prefer FLP Cross Application Navigation when running inside Launchpad
      // Navigate to FLP Home. Fallback to known FLP URL if not embedded.
      var oUshell = sap.ushell;
      if (oUshell && oUshell.Container) {
        oUshell.Container.getServiceAsync("CrossApplicationNavigation").then(function(oCrossAppNav) {
          // Navigate to Shell home in-place
          oCrossAppNav.toExternal({
            target: {
              semanticObject: "Shell",
              action: "home"
            }
          });
        });
      } else {
        // Not running in FLP, redirect to FLP home (client 001 by default)
        var sHome = "/sap/bc/ui2/flp?sap-client=001";
        try {
          // If hostname alias is set (e.g., vhcala4hci), keep current host
          window.location.assign(sHome);
        } catch (e) {
          window.location.href = sHome;
        }
      }
    }
  });
});