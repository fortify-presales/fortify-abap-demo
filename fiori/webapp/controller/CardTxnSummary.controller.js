sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel"
], function(Controller, Filter, FilterOperator, JSONModel) {
    "use strict";
    
    return Controller.extend("com.fortify.demo.zui5fiori.controller.CardTxnSummary", {
        onInit: function() {
            console.log("CardTxnSummary controller initialized");
            this._aFilters = {
                status: null,
                search: null
            };
        },
        
        onItemPress: function(oEvent) {
            console.log("onItemPress called!");
            var oItem = oEvent.getSource();
            console.log("Item:", oItem);
            var oContext = oItem.getBindingContext();
            console.log("Context:", oContext);
            
            if (!oContext) {
                console.error("No binding context found");
                return;
            }
            
            var sTxnId = oContext.getProperty("txn_id");
            var sProductId = oContext.getProperty("product_id");
            var sCardId = oContext.getProperty("card_id");
            
            console.log("Navigation parameters:", {
                txn_id: sTxnId,
                product_id: sProductId,
                card_id: sCardId
            });
            
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("RouteCardTxnDetail", {
                txn_id: sTxnId,
                product_id: sProductId,
                card_id: sCardId
            });
        },

        onSearch: function(oEvent) {
            var sQuery = oEvent.getParameter("query");
            this._aFilters.search = sQuery;
            this._applyFilters();
        },

        onFilterChange: function(oEvent) {
            var oSource = oEvent.getSource();
            var sSelectedKey = oSource.getSelectedKey();
            this._aFilters.status = sSelectedKey;
            this._applyFilters();
        },

        onClearFilters: function() {
            // Clear all filter controls
            this.byId("statusFilter").setSelectedKey("");
            this.byId("txnSearchField").setValue("");

            // Clear internal filter state
            this._aFilters = {
                status: null,
                search: null
            };

            // Apply empty filters
            this._applyFilters();
        },

        _applyFilters: function() {
            var oTable = this.byId("cardTxnTable");
            var oBinding = oTable.getBinding("items");
            
            if (!oBinding) {
                return;
            }

            var aFilters = [];

            // Status filter
            if (this._aFilters.status) {
                aFilters.push(new Filter("status", FilterOperator.EQ, this._aFilters.status));
            }

            // Search filter (across multiple fields)
            if (this._aFilters.search) {
                var sQuery = this._aFilters.search;
                aFilters.push(new Filter({
                    filters: [
                        new Filter("txn_id", FilterOperator.Contains, sQuery),
                        new Filter("product_name", FilterOperator.Contains, sQuery),
                        new Filter("cardholder_name", FilterOperator.Contains, sQuery),
                        new Filter("description", FilterOperator.Contains, sQuery)
                    ],
                    and: false
                }));
            }

            oBinding.filter(aFilters);
        },

        onSendQuery: function() {
            this.getOwnerComponent().getRouter().navTo("RouteQueryTxn");
        }
    });
});