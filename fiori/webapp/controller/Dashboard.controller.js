sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "lib/currency.min"
], function(Controller, JSONModel, currency) {
    "use strict";

    return Controller.extend("com.fortify.demo.zui5fiori.controller.Dashboard", {
        onInit: function() {
            // Create a local model for dashboard data
            var oDashboardModel = new JSONModel({
                transactionCount: 0,
                productCount: 0,
                customerCount: 0,
                totalAmount: 0,
                pendingQueries: []
            });
            this.getView().setModel(oDashboardModel, "dashboard");

            // Load data from OData service
            this._loadDashboardData();
            
            // Load pending queries demo data
            this._loadPendingQueries();
        },

        _loadDashboardData: function() {
            var oModel = this.getOwnerComponent().getModel();
            var oDashboardModel = this.getView().getModel("dashboard");

            // Read transaction data
            oModel.read("/zv_prod_card_txn", {
                success: function(oData) {
                    var aResults = oData.results;
                    var iTxnCount = aResults.length;
                    
                    // Get unique products and customers
                    var aProducts = {};
                    var aCustomers = {};
                    var fTotalAmount = 0;
                    
                    aResults.forEach(function(oTxn) {
                        aProducts[oTxn.product_id] = true;
                        aCustomers[oTxn.card_id] = true;
                        if (oTxn.amount) {
                            fTotalAmount += parseFloat(oTxn.amount);
                        }
                    });
                    
                    var iProductCount = Object.keys(aProducts).length;
                    var iCustomerCount = Object.keys(aCustomers).length;
                    
                    // Format amount using currency.js if available, otherwise use toFixed
                    var sFormattedAmount;
                    if (currency && currency.default) {
                        sFormattedAmount = currency.default(fTotalAmount).format();
                    } else if (typeof currency === 'function') {
                        sFormattedAmount = currency(fTotalAmount).format();
                    } else {
                        sFormattedAmount = "$" + fTotalAmount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
                    }
                    
                    // Update dashboard model with formatted amount
                    oDashboardModel.setData({
                        transactionCount: iTxnCount,
                        productCount: iProductCount,
                        customerCount: iCustomerCount,
                        totalAmount: sFormattedAmount,
                        pendingQueries: oDashboardModel.getProperty("/pendingQueries")
                    });
                }.bind(this),
                error: function(oError) {
                    console.error("Error loading dashboard data:", oError);
                    // Set default values on error
                    oDashboardModel.setData({
                        transactionCount: 0,
                        productCount: 0,
                        customerCount: 0,
                        totalAmount: "$0.00",
                        pendingQueries: oDashboardModel.getProperty("/pendingQueries")
                    });
                }
            });
        },

        _loadPendingQueries: function() {
            var oDashboardModel = this.getView().getModel("dashboard");
            
            // Demo data for pending queries
            var aPendingQueries = [
                {
                    query_id: "QRY-001",
                    txn_id: "TXN-2024-001",
                    summary: "Payment not received for completed transaction",
                    status: "PENDING",
                    submitted_date: "2024-10-25"
                },
                {
                    query_id: "QRY-002",
                    txn_id: "TXN-2024-015",
                    summary: "Duplicate charge on credit card statement",
                    status: "IN_PROGRESS",
                    submitted_date: "2024-10-24"
                },
                {
                    query_id: "QRY-003",
                    txn_id: "TXN-2024-023",
                    summary: "Incorrect product delivered - need refund",
                    status: "PENDING",
                    submitted_date: "2024-10-23"
                },
                {
                    query_id: "QRY-004",
                    txn_id: "TXN-2024-031",
                    summary: "Transaction shows PENDING but payment deducted",
                    status: "IN_PROGRESS",
                    submitted_date: "2024-10-22"
                },
                {
                    query_id: "QRY-005",
                    txn_id: "TXN-2024-042",
                    summary: "Unable to track shipment status",
                    status: "PENDING",
                    submitted_date: "2024-10-21"
                }
            ];
            
            oDashboardModel.setProperty("/pendingQueries", aPendingQueries);
        },

        onNavToCardTxnSummary: function() {
            this.getOwnerComponent().getRouter().navTo("RouteCardTxnSummary");
        },

        onNavToProducts: function() {
            this.getOwnerComponent().getRouter().navTo("RouteProducts");
        },

        onNavToCustomers: function() {
            this.getOwnerComponent().getRouter().navTo("RouteCustomers");
        }
    });
});
