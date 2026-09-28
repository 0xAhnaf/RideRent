# Offline demo distance data

This is an estimated fare dataset for a university demo, not a verified all-pairs road-routing service. No network call or API key is used at runtime.

## Sources

- Location representative points: https://github.com/HedaetShahriar/bangladesh-locations-dataset (MIT; full notice in LOCATION_DATA_LICENSE.txt).
- Source file: https://raw.githubusercontent.com/HedaetShahriar/bangladesh-locations-dataset/main/data/bd_locations.json
- The source itself documents approximate/generated coordinates for some places: https://github.com/HedaetShahriar/bangladesh-locations-dataset/blob/main/metadata/sources.json
- District headquarters indicative road matrix: https://rhd.gov.bd/Documents/HDM/DistrictDistanceMatrix/Index.pdf — published March 2007, using 2002–2004 road GPS data. Historical ferries/roads may differ from today's routes. Numeric facts extracted from the chart; not an official current fare schedule.
- Retrieval: 2026-09-28. Source JSON SHA256: 3a14fc462aec3d218a7dd49970e8d57846bf8bd10107ac9d027ecdbc1031c976

## Coverage and assumptions

64 districts; 594 location entries matching the supplied frontend list. 554 entries have a point in the source dataset; 40 use an explicitly labelled district-centre proxy. Dataset points themselves are not all independently verified.

- Same district AND same thana: fixed BDT 500 one-way or BDT 750 round-trip. No invented 0 km display.
- Different thanas in one district: Haversine separation × 1.3, with a demo minimum of 5 km. The 1.3 factor and 5 km floor are estimation assumptions, not researched road lengths.
- Different districts: historical RHD HQ-to-HQ km + estimated pickup-to-HQ and destination-to-HQ offsets (Haversine × 1.3). This may overestimate neighboring border trips and does not model current bridges, restricted roads, ferries or traffic.
- Round-trip distance is twice the outbound estimate; reverse routes are assumed equal for this demo.
- Round outbound km to one decimal first, then charge BDT 25/km; prices stored to two decimals.
- No extra toll, parking or ferry amount is automatically added.

## Correct a known route

Edit `catalog.json` → `route_overrides`. Key format: `pickupDistrict|pickupThana>destinationDistrict|destinationThana` (exact frontend names).
Example structure (replace km with a distance you checked):

```json
"Dhaka|Dhanmondi>Dhaka|Gulshan": { "km": 15, "source": "your checked source URL/date" }
```

A reviewed override is preferred over formula estimates and reused in reverse. Set both directions only if intentionally different; round-trip currently still assumes an equal return leg. Bump `version` whenever catalog/rules change. Existing saved bookings are unaffected; outstanding quotes must be refreshed.

## Locations using district proxies

- Dhaka / Banani
- Dhaka / Mirpur
- Dhaka / Mohammadpur
- Dhaka / Mugda
- Dhaka / Sabujbagh
- Dhaka / Vatara
- Dhaka / Wari
- Dhaka / Rupnagar
- Dhaka / Hatirjheel
- Dhaka / Bhashantek
- Dhaka / Tejgaon Industrial Area
- Chattogram / Chattogram Sadar
- Chattogram / Bayazid Bostami
- Chattogram / Chawkbazar
- Chattogram / Sadarghat
- Coxs_Bazar / Matamuhuri
- Lakshmipur / Chandraganj
- Rajshahi / Rajshahi Sadar
- Rajshahi / Damkura
- Rajshahi / Chandrima
- Rajshahi / Belpukur
- Rajshahi / Katakhali
- Rajshahi / Airport
- Rajshahi / Kashiadanga
- Rajshahi / Karnahar
- Bogura / Mokamtola
- Khulna / Labanchora
- Khulna / Harintana
- Khulna / Aranghata
- Barishal / Airport
- Barishal / Kawnia
- Barishal / Bandar
- Pirojpur / Indurkani
- Sylhet / Kotwali
- Sylhet / Airport
- Sylhet / Moglabazar
- Sylhet / Hazrat Shah Paran
- Habiganj / Shayestaganj
- Thakurgaon / Ruhia
- Thakurgaon / Bhully
