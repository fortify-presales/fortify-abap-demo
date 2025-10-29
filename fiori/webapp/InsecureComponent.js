sap.ui.define([
    'sap/ui/core/Control'
], function (Control) {
    return Control.extend('CustomControl', {
        metadata: {
            properties: {
                foo: { type: 'string', defaultValue: '' }
            }
        },
        renderer: {
            render: function (oRm, oControl) {
                // Cross-Site Scripting: SAPUI5 Control
                oRm.write("<div>" + oControl.getId() + ":" + oControl.getFoo() + "</div>"); // get[A-Z][A-z]+
                // Cross-Site Scripting: SAPUI5 Control
                oRm.writeEscaped("<div><p>Escaped: " + oControl.getId() + ":" + oControl.getFoo() + "</p></div>");
                try {
                    // Dynamic Code Evaluation: Code Injection
                    eval(oControl.getFoo())
                } catch { }
            }
        },
        init: function (data) {
            var result = eval(data.foo); // Dynamic Code Evaluation: Code Injection
            this.setFoo(result);
            console.log(result);
        }
    });
});