CLASS zcl_zip_test DEFINITION
  PUBLIC
  FINAL
  CREATE PUBLIC.

  PUBLIC SECTION.
    INTERFACES if_oo_adt_classrun.
ENDCLASS.

CLASS zcl_zip_test IMPLEMENTATION.

  METHOD if_oo_adt_classrun~main.


    data:   lv_text TYPE string,
            lv_xstring TYPE xstring.

    lv_text = |Hello ABAP Cloud!|.

    out->write( | Zipping text: {  lv_text }| ).

    lv_xstring = CONV xstring( lv_text ).

    DATA(lo_zip) = NEW cl_abap_zip( ).
    lo_zip->add( name = 'test.txt' content = lv_xstring ).

    DATA(zip_content) = lo_zip->save( ).

    out->write( | Zip content (xstring): { zip_content }| ).
    "cl_demo_output=>display( zip_content ).

  ENDMETHOD.

ENDCLASS.
