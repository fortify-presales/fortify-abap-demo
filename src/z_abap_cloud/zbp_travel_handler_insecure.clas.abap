CLASS zbp_travel_handler_insecure DEFINITION
  PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    METHODS:
      create,          " triggers RAP-S001 (no AUTHORITY-CHECK)
      delete_all,      " triggers RAP-S006 (bulk DML)
      create_secure.   " secure example
ENDCLASS.

CLASS zbp_travel_handler_insecure IMPLEMENTATION.

  METHOD create.
    " ❌ No AUTHORITY-CHECK before DML
    DATA(ls_travel) = VALUE zfy_travel(
      travel_id        = 'T100'
      agency_id        = 'A1'
      customer_id      = 'C1'
      begin_date       = sy-datum
      end_date         = sy-datum + 7
      internal_comment = 'Unsecured insert'
      createdby       = sy-uname
    ).

    INSERT zfy_travel FROM ls_travel.  " ← triggers RAP-S001
  ENDMETHOD.


  METHOD delete_all.
    " ❌ Mass DELETE without WHERE or AUTHORITY-CHECK
    " Triggers ABAP-RAP-S006: Bulk Operation Without Restriction
    DELETE FROM zfy_travel.             " ← triggers RAP-S006
  ENDMETHOD.


  METHOD create_secure.
    " Proper authorization check before DML
    AUTHORITY-CHECK OBJECT 'Z_TRAVEL' ID 'ACTVT' FIELD '02'.
    IF sy-subrc = 0.
      DATA(ls_secure) = VALUE zfy_travel(
        travel_id        = 'T200'
        agency_id        = 'A2'
        customer_id      = 'C2'
        begin_date       = sy-datum
        end_date         = sy-datum + 5
        internal_comment = 'Secure insert'
        createdby       = sy-uname
      ).
      INSERT zfy_travel FROM ls_secure.
    ENDIF.
  ENDMETHOD.

ENDCLASS.

