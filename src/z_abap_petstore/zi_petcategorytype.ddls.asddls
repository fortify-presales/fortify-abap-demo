@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Pet Category Type CDS View Entity'
@Metadata.ignorePropagatedAnnotations: true
define view entity ZI_PetCategoryType as select from zpet_cat_type
{
    key cat_id,
    name,
    caturl
}
