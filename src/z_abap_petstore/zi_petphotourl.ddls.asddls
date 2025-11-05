@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Pet Photo Url CDS View Entity'
@Metadata.ignorePropagatedAnnotations: true
define view entity ZI_PetPhotoUrl as select from zpet_photo_url
{
    
  key pet_id,
  key photo_id,
      photourl
}
