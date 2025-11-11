" Note: ZFY_TRAVEL table is assumed to exist in the system and released for cloud use.

CLASS zcl_bulk_ops_insecure DEFINITION
  PUBLIC FINAL CREATE PUBLIC.
  PUBLIC SECTION.
    METHODS delete_all.                      " DELETE without WHERE
    METHODS bulk_update_no_where.            " UPDATE without WHERE
    METHODS delete_with_dynamic_where        " Dynamic WHERE from untrusted input
      IMPORTING VALUE(iv_filter) TYPE string.
    METHODS do_implicit_commit.              " Implicit COMMIT in library code
ENDCLASS.

CLASS zcl_bulk_ops_insecure IMPLEMENTATION.

  METHOD delete_all.
    " Insecure: wipes the entire table
    DELETE FROM zfy_travel.
  ENDMETHOD.

  METHOD bulk_update_no_where.
    " Insecure: updates every row
    UPDATE zfy_travel SET internal_comment = 'Processed'.
  ENDMETHOD.

  METHOD delete_with_dynamic_where.
    " Insecure: SQL injection via iv_filter, e.g. `travel_id = 'X' OR 1 = 1`
    " Not supported to ABAP Cloud, only for on-premise systems
    DATA(lv_where) = iv_filter.
    DELETE FROM zfy_travel WHERE (lv_where).
  ENDMETHOD.

  METHOD do_implicit_commit.
    " Insecure: commits from within a utility method
    " Not supported to ABAP Cloud, only for on-premise systems
    COMMIT WORK AND WAIT.
  ENDMETHOD.

ENDCLASS.
