sap.ui.define([
    "sap/ui/core/mvc/Controller"
], (Controller) => {
    "use strict";

    return Controller.extend("com.fortify.demo.zui5fiori.controller.Main", {
        onInit() {
            //var oRichTextEditor = this.getView().byId("richTextEditor");
            //if (oRichTextEditor) {
            //    oRichTextEditor.setSanitize(false);
            //}
        },
        
        onSubmitInput: function() {
            var oInput = this.getView().byId("userInputField");
            var userInput = oInput.getValue();
            console.log("User entered:", userInput);
            // Find the submit button's DOM element
            var submitButtonDomRef = this.getView().byId("submitButton").getDomRef();
            var pageDomRef = this.getView().byId("page").getDomRef();
            if (pageDomRef) {
                var outputDiv = document.getElementById("userOutputDiv");
                if (!outputDiv) {
                    outputDiv = document.createElement("div");
                    outputDiv.id = "userOutputDiv";
                    outputDiv.style.marginTop = "0.5rem";
                    submitButtonDomRef.parentNode.insertBefore(outputDiv, submitButtonDomRef.nextSibling);
                }
                outputDiv.innerHTML = userInput;
            }
        }
    });
});