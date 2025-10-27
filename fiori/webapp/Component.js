sap.ui.define([
    "sap/ui/core/UIComponent",
    "com/fortify/demo/zui5fiori/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("com.fortify.demo.zui5fiori.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // Register local lib module path
            var sRootPath = jQuery.sap.getModulePath("com.fortify.demo.zui5fiori");
            jQuery.sap.registerModulePath("lib", sRootPath + "/lib");
            
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();
        }
    });
});