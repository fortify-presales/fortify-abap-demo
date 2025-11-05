@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Pet Category CDS View Entity'
@Metadata.ignorePropagatedAnnotations: true
define view entity ZI_PetCategory as select from zpet_category
  association to ZI_PetCategoryType as _CatType on zpet_category.cat_id = _CatType.cat_id
{
    key pet_id,
    key cat_id,
        _CatType
}
