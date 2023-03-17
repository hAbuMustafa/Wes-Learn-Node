export default function autocomplete(input, latInput, lngInput) {
  const dropdown = input
    ? new google.maps.places.Autocomplete(input, {
        fields: ['formatted_address', 'geometry', 'name'],
      })
    : null;

  dropdown?.addListener('place_changed', () => {
    const place = dropdown.getPlace();
    latInput.value = place.geometry.location.lat();
    lngInput.value = place.geometry.location.lng();
  });

  input?.on('keydown', (e) => {
    if (e.keyCode === 13) e.preventDefault();
  });
}
