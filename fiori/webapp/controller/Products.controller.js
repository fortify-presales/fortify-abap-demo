sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function(Controller, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("com.fortify.demo.zui5fiori.controller.Products", {
        onInit: function() {
            // Create a local model for products
            var oProductsModel = new JSONModel({
                products: []
            });
            this.getView().setModel(oProductsModel);

            // Load product data
            this._loadProductData();
        },

        _loadProductData: function() {
            var oModel = this.getOwnerComponent().getModel();
            var oProductsModel = this.getView().getModel();

            // Read transaction data to get unique products
            oModel.read("/zv_prod_card_txn", {
                success: function(oData) {
                    var aResults = oData.results;
                    var oProducts = {};
                    
                    // Aggregate products by product_id
                    aResults.forEach(function(oTxn) {
                        var sProductId = oTxn.product_id;
                        if (!oProducts[sProductId]) {
                            oProducts[sProductId] = {
                                product_id: oTxn.product_id,
                                product_name: oTxn.product_name,
                                price: oTxn.price,
                                product_currency: oTxn.product_currency,
                                quantity: 0
                            };
                        }
                        // Sum up quantities
                        if (oTxn.quantity) {
                            oProducts[sProductId].quantity += parseFloat(oTxn.quantity);
                        }
                    });
                    
                    // Convert object to array
                    var aProducts = Object.values(oProducts);
                    
                    // Update model
                    oProductsModel.setProperty("/products", aProducts);
                }.bind(this),
                error: function(oError) {
                    console.error("Error loading product data:", oError);
                }
            });
        },

        onSearch: function(oEvent) {
            var sQuery = oEvent.getParameter("query");
            var oTable = this.byId("productsTable");
            var oBinding = oTable.getBinding("items");
            
            if (!oBinding) {
                return;
            }
            
            var aFilters = [];
            if (sQuery && sQuery.length > 0) {
                aFilters.push(new Filter({
                    filters: [
                        new Filter("product_id", FilterOperator.Contains, sQuery),
                        new Filter("product_name", FilterOperator.Contains, sQuery)
                    ],
                    and: false
                }));
            }
            
            oBinding.filter(aFilters);
        },

        onAddProduct: function() {
            this.getOwnerComponent().getRouter().navTo("RouteAddProduct");
        }
    });
});
