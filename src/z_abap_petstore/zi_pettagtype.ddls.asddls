@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Pet Tag Type CDS View Entity'
@Metadata.ignorePropagatedAnnotations: true
define view entity ZI_PetTagType as select from zpet_tag_type
{
    
  key tag_id,
      name
    
}
