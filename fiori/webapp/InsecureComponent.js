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
                oRm.write('<div>' + oControl.getId() + ':' + oControl.getFoo() + '</div>')
            }
        },
        init: function (data) {
            var result = eval(data.foo); // Insecure use of eval
            this.setFoo(result);
            console.log(result);
        }
    });
});