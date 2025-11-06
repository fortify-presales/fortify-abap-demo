@AccessControl.authorizationCheck: #NOT_REQUIRED
@EndUserText.label: 'Pet Photo Url CDS View Entity'
define view entity ZI_PetPhotoUrl as select from zpet_photo_url
  association to parent ZI_Pet as _Pet on $projection.pet_id = _Pet.id
{
  key pet_id,
  key photo_id,
      photourl,
      _Pet
}
