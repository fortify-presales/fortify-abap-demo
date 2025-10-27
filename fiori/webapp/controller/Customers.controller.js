sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function(Controller, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("com.fortify.demo.zui5fiori.controller.Customers", {
        onInit: function() {
            console.log("Customers controller initialized");
            // Create a local model for customers
            var oCustomersModel = new JSONModel({
                customers: []
            });
            this.getView().setModel(oCustomersModel);

            // Load customer data
            this._loadCustomerData();
        },

        _loadCustomerData: function() {
            var oModel = this.getOwnerComponent().getModel();
            var oCustomersModel = this.getView().getModel();

            // Read transaction data to get unique customers
            oModel.read("/zv_prod_card_txn", {
                success: function(oData) {
                    var aResults = oData.results;
                    var oCustomers = {};
                    
                    // Aggregate customers by card_id
                    aResults.forEach(function(oTxn) {
                        var sCardId = oTxn.card_id;
                        if (!oCustomers[sCardId]) {
                            oCustomers[sCardId] = {
                                card_id: oTxn.card_id,
                                cardholder_name: oTxn.cardholder_name,
                                transaction_count: 0,
                                total_spent: 0
                            };
                        }
                        // Count transactions
                        oCustomers[sCardId].transaction_count += 1;
                        // Sum up amounts
                        if (oTxn.amount) {
                            oCustomers[sCardId].total_spent += parseFloat(oTxn.amount);
                        }
                    });
                    
                    // Convert object to array
                    var aCustomers = Object.values(oCustomers);
                    
                    // Update model
                    oCustomersModel.setProperty("/customers", aCustomers);
                }.bind(this),
                error: function(oError) {
                    console.error("Error loading customer data:", oError);
                }
            });
        },

        onSearch: function(oEvent) {
            var sQuery = oEvent.getParameter("query");
            var oTable = this.byId("customersTable");
            var oBinding = oTable.getBinding("items");
            
            if (!oBinding) {
                return;
            }
            
            var aFilters = [];
            if (sQuery && sQuery.length > 0) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("card_id", FilterOperator.Contains, sQuery),
                        new Filter("cardholder_name", FilterOperator.Contains, sQuery)
                    ],
                    and: false
                }));
            }
            
            oBinding.filter(aFilters);
        },

        onAddCustomer: function() {
            this.getOwnerComponent().getRouter().navTo("RouteAddCustomer");
        }
    });
});
